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

Installed Snipe: `war-snipe-local/work-audit-refine-snipe`, version `0.21.12+codex.20260908.8fd30f3`. Execute its owned `skills/snipe/assets/snipe-runner.mjs`; request `rawArgs: "4 correctness,simplicity,auto"`, an explicit merge-base target with full base/head SHAs, and no path filters. The active task does not expose exact model/effort metadata. Profile discovery succeeded. User selected `gpt-5.6-sol / high` for every seat. Initial panel completed against the initial full-SHA scope at capacity 3; actual assigned lenses are correctness, simplicity, cascading-impact, test-fidelity. All four validated seats requested changes; complete stable coverage. The exact report and execution evidence are stored beside this ledger. Read-only auditors must retain confinement, coverage, failure, and scope-stability evidence; incomplete is never clean.

## Issue dispositions (repair checkpoints)

| Issue | Risk | Status / evidence |
|---|---|---|
| #2279 | Conflict routing bypasses a fixable surviving blocker | Fixed 5574b3ac; four interactive/AFK false approvals reproduced; user ruling recorded |
| #2280 | Bare scope prose falsely triggers a mandate conflict | Fixed 5574b3ac; narrow mandate phrases and survivor routing tested together |
| #2196 | Later relaunch counts sibling work as never-started task completion | Fixed 151b3509; task-owned nonempty commit proof survives rebase/clone |
| #2154 | Approval transfer accounts seats at null SHA | Fixed 5574b3ac; mandatory transfer evidence. Final checkpoint also corrects producer destination to task tip |
| #2182 | Baseline-proceed gate evidence can select superseded log | Fixed 8eb7d2c0; unique gate artifacts, explicit continuations, no stale fallback |

## Completion checklist

- [x] Read handoff; verify live PR identity and isolated source ownership; preserve comparison refs.
- [x] Initial four-seat Snipe panel, roster/profile/package, findings and dispositions.
- [x] Read relevant plan, doctrine, learnings, and test fixtures; reproduce priority issues.
- [x] Record consequential operator ruling if needed; implement verified repairs and synchronized doctrine.
- [x] Bounded remaining-follow-on triage for false approval/completion/source/pin/gate evidence.
- [x] Targeted regressions red before, green after; class-closure evidence.
- [x] Full JS, shell, redaction, release-slot and applicable checks on candidate (source checkpoint; final SHA evidence goes in PR).
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

## Recovery provenance checkpoint

#2196 root cause: the phase-shared commit count cannot establish ownership. The read-only
`task-integrated.sh` helper resolves local refs to immutable SHAs, requires task ancestry,
then finds a nonempty non-merge commit in phase history with the exact WAR-Task branch trailer.
Only its TASK_INTEGRATED result permits the barrier to report preMerged. NO_TASK_PROOF takes
ordinary work/audit; helper errors stop provisioning. Work/fix prompts and the standing worker
card produce the trailer. The refiner card, recovery reference, schemas, plan D9/Task 6.1 and
ADR 0008 now name the same proof. Other Git authority/foreign-commit reconciliation rules stay.

Real-Git regression exercises inherited sibling work, prior-phase task work, untagged legacy work,
empty tagged commits, unmerged own work, rebased integrated own work, expired reflogs and a fresh
clone without the original worktree/journal. It drives the helper result through actual Workflow
skip/dispatch bookkeeping. The old ancestor/count algorithm's false completion was independently
red before this repair. Four disposable helper mutations (ancestry, owner trailer, nonempty diff,
phase range) each failed the real-Git fixture. Invalid CLI/repository inputs and missing refs are
also covered. Checkpoint command: workflow + skill-doc-contracts + prompt-surface-budgets Node
test files — **842 passed, 0 failed**; `git diff --check` passed.

Consequence: legacy branches may do redundant work/audit, but cannot acquire completion credit
from sibling history. The proof lives in pushed commit history and survives another-machine
recovery; it does not claim to prove task acceptance independently of the existing audit/gate
and resume reconciliation contracts. There is no new local state authority.

## D21 operator direction (2026-09-09)

The operator selected automatic in-phase reconciliation: dispatch a fresh refiner to establish
Git certainty and complete or safely retry an uncertain task/polish/terminal merge. Hold before
land only when bounded maintenance cannot prove/recover the state. Never require the human to
run Git CLI commands; keep auditors read-only. Git remains authoritative, including across
machines. The operator also authorized a separate stronger refiner recovery tier (Opus for
judgment-heavy reconciliation; routine refiner remains Sonnet). This supersedes the pending
hold-versus-reconcile question above. Implemented and tested in cb193836; see checkpoint below.

## Gate artifact isolation checkpoint (2026-09-09)

Reproduced #2182 through baseline-proceed for absent, empty and nonempty baseline debt: six
regressions failed at `151b3509` (missing capture on all three, stale conventional-file fallback
on all three). The shared segmented-merge wrapper now supplies capture to all four task merge
sites. Every logical attempt allocates a fresh `mktemp -d` directory, including integrated-tip
and land gates. Only explicit segmented continuations can reuse their returned absolute path.
No evidence consumer guesses a conventional filename; absent/malformed paths mean SOFT evidence
absence. This closes #2181, #2187 and #2188 within the same class and the same-tip/background-writer
portion of #2168. It amends D8's unsafe conventional-path fallback; stamp semantics stay unchanged.

Standing refiner/auditor instructions, schemas, recovery reference, ADR evidence descriptions,
CONTEXT and the operative plan slice were updated together. The existing four-site census and
byte-equal registry cover producers/readers; baseline retries now participate in that contract.
Regression fixtures cover debt shapes, malformed paths, returned-path continuation for both modes,
and execute the actual dispatched mktemp command twice to prove an old same-SHA writer cannot
replace the current red artifact. Disposable absolute-path, NUL-path and continuation-threading
mutations each fail their behavioral assertion. Workflow + skill-doc-contracts + prompt-budget
checkpoint: **853 passed, 0 failed**. `git diff --check` passed. The new path allocation is refiner
executed; the workflow does not pretend to open or independently authenticate log contents.

## Git reconciliation checkpoint (2026-09-09)

Implemented the operator's D21 amendment. Before a task, floor/environment/baseline retry,
polish, terminal or land dispatch, a read-only refiner snapshots full Git object identities and
the exact origin target ref. Missing snapshots retry on the stronger tier before any mutation.
A lost/error/malformed mutation response enters bounded in-phase refiner maintenance. The
separate `agents.refiner.recovery` tier defaults to Opus/high across presets; routine refinement
remains independently configured. Config validation, preset display and runtime default/override
coverage accompany the new tier. No auditor gets Git writes and no human Git CLI step is required.

Recovery accepts merged content only with matching snapshot identities, local/remote/source
SHAs, nonempty matching patch evidence and a normal result with a captured gate artifact.
Required floors use the immutable pre-merge base, avoiding an empty diff after an earlier push.
Land recovery reuses the actual phase commit and checks its parents against the captured remote
working base and integration source. It never creates a second phase commit. Proved-unmerged
requires both target refs unchanged; unknown/contradictory state retries up to roundLimit and
holds before land when still unresolved. Non-infrastructure errors retain their original hard
path if maintenance proves absence but cannot complete the operation. Read-only deaths keep
existing classifications.

Evidence: **21 real-Git mutation cases** cover before-merge, after-local-merge and after-push loss
at all six task/sweep merge routes, plus post-push loss at all three land routes. All pass and
all **21 fail against 8eb7d2c0** before this repair. The fixtures perform real Git commits,
merges and local-remote pushes; gate/floor responses remain harness-controlled agent results,
not a claim that live Opus ran the procedure. Land fixtures prove exactly one phase merge commit.
Three distinct read-only alternate-consumer fixtures cover pin-mismatch and floor re-audit deaths
and integrated-tip gate-audit death. **27 disposable guard mutations fail** their behavioral
assertions, covering snapshot fields, reconciliation identity/patch/result evidence, unchanged-ref
proof, land parent/source checks and those three read-only death guards.

Checkpoint command: workflow + war-config + skill-doc-contracts + prompt-surface-budgets —
**1,108 passed, 0 failed**. Three additional malformed-response tests passed after extending the
same recovery gate to absent/unknown statuses. Full repository validation remains pending.
`git diff --check` passed. Standing refiner recovery doctrine, schema summary and operative D21
plan row are updated. Git remains the source of truth across machines; the snapshots are Git
identities, not a replacement completion database. Live-refiner adherence and genuinely divergent
or ambiguous concurrent state remain explicitly bounded: agents investigate; no false completion.

## Final source repair checkpoint (2026-09-09)

- Initial Snipe's two finding-identity concerns are fixed: seeded sweep rows register
  in queuedKeys at construction; degenerate finding identities use their complete
  serialized content tuple instead of a lossy 32-bit hash. Actual-flow regressions
  fail before the fix; the concrete old collision is `finding 1r` / `finding 30`.
  A disposable seed-registry mutation fails the unexpected re-entry assertion.
- #2141 was independently reproduced: a stale worker pin erased a blocker at the real
  task tip. Task audits now require read-only Git reconciliation and a fresh roster
  before approval. Worker-reported pins may be repaired; later gate/transfer-specific
  pins cannot silently move. Missing proof/repeated conflict prevents approval; original
  findings are retained. Real-Git fixtures cover successful repair, surviving blocker
  and repeated conflict; malformed proof and moved-transfer controls cover refusal.
  Four disposable mutations (conflict detection, retry bound, full-SHA proof, operation
  pin equality) fail their assertions. This is implementation of the operator's
  integrity-first/Git-is-truth direction, not a separately answered design question.
- #2154 sibling producer defect reproduced with real Git: a clean rebase assigned
  `rebased_tip` to integration while the task tip differed. Both producer instructions
  now resolve the task branch; POST still compares integration to task. The original
  real-Git approval-receipt assertion fails and the corrected producer passes.
- #2229 reproduced on sweep and terminal paths: no soundness charge preceded citation
  credit/unpark. Hoisted the existing shared charge to all three completion paths.
  An unsound citation is rejected by the same panel/blocker contract; the question
  remains parked. The initial two regressions fail on absent charges; existing positive
  citation fixtures still require successful execution and the exact threaded row.

Consequence sweep: shared auditRound callers, ace's already-gated pin/transfer receipts,
full-roster worker/rebuttal rounds, source/prompt/card/schema mirrors and ADR 0024 were
checked. Post-merge gate-evidence absence remains a separate SOFT rule; no shared mutation
is licensed by an uncertain task audit. #2229 changes the existing judgment's coverage,
not the authority of a citation or the operator's ruling.

## Bounded follow-on dispositions

The campaign's recent follow-ons were scanned for false approval/completion, wrong source
or pin, and misleading gate artifacts. No backlog-wide cleanup or issue closure is implied.

| Issues | Disposition |
|---|---|
| #2279, #2280, #2196, #2154, #2182 | Reproduced and repaired; named checkpoints above |
| #2141 | Reproduced; Git pin repair + re-audit, never mismatch-to-approval |
| #2181, #2187, #2188; same-tip writer aspect of #2168 | Closed by unique capture and explicit-path consumers in 8eb7d2c0 |
| #2229 | Reproduced; shared citation-soundness charge now covers sweep and terminal |
| #2184 | Reported advisory gate_log_status/gateLogStatus machinery absent at initial and current source; no repair needed here |
| #2294 | Initial 6497e0ce already retries null OR infra-dead audit seats twice; historical issue premise superseded |
| #2251, #2257 (and #2252 derivation) | Initial source already uses top-level statement boundaries, preserving &&/|| list semantics; executable statement tests validate the later ruling |
| #2277 | Deferred prospective compound-shell instruction clarification; current top-level qualifier excludes interiors, no live plan check has this shape. No false-green proof claimed |
| #2189 | Standalone sweep segmentation remains an explicit exclusion; uncertain mutation outcomes now reconcile under D21 before land. Optional continuation tuning is deferred |
| #2207, #2208 | Deferred provenance-policy forks; current conservative input floor can refuse a launch, not grant false task completion |
| #2244 | Deferred merged-corroboration drain-cause presentation loss; original primary finding/routing survives, no false approval/completion shown |
| #2126, #2127 | Deferred prompt-placement/budget refactors outside this integrity pass |

Plan-declared future backstops remain: D17 field-run cost, #2097 later loop-comparison
measurements, and live-refiner procedure adherence (including already_upstream). Local
Git fixtures establish mechanics and actual engine routing; they are not a live model
end-to-end run. Genuine unresolved divergence still holds after bounded agent maintenance.

Final validation and the final four-seat report will be pinned to the committed candidate
in the PR description. That external evidence avoids changing the candidate after review.
This ledger records source checkpoints; a pending final review is not a clean verdict.

Final repair validation: **1,823 JavaScript tests passed, 0 failed** with
`node --test 'skills/**/*.test.mjs'` on the final source changes. The final 12 targeted
pin/citation tests also passed. Two independent citation-charge deletion mutations fail
the sweep/terminal assertions. Redaction lint reports `lint: clean`; the actual staged
workflow is **323,321 bytes**, below the 524,288-byte cap. Runtime is Node v24.17.0.
Version-slot and prompt-budget checks are included in the full JS run. Only test-comment
clarification and this evidence ledger were edited after that run; production bytes match.

The shell census correctly flagged the newly added task-integrated.sh as unclassified.
It now has an explicit exemption naming its Git ancestry/commit-provenance mechanism;
it performs no gate-file discovery. The census itself remains fail-closed.

All **31 shell test files passed**: 30 passed in the initial sweep; the corrected
classification census was re-run and passed all 48 assertions. No other shell failure
occurred. The JavaScript tests affected only by final comment cleanup were re-run and
passed. Fresh remote check: PR head still 6497e0ce, target master still ba08a77f, PR open
and CLEAN, initial redaction-lint green. No concurrent source movement was overwritten.

## Candidate 1 review and pin-class closure

Candidate `1bd9474b7ea813d85976b8639f666df29b26fda3` was pushed normally and passed
1,823 JS tests and GitHub redaction CI. Four-seat Snipe completed with full stable
coverage, same package and sol/high profile. Correctness and cascading-impact reported
the same Major: missing/malformed worker or auditor pins bypassed reconciliation.
Simplicity and test-fidelity approved; simplicity reported redundant approval conjuncts.
The exact report and validated execution evidence are retained as candidate-1-snipe files.
This candidate was **held**, never represented as clean or merged.

Five raw-response regressions reproduced the missing-proof false approvals before repair.
The shared task-audit boundary now checks worker-pin usability and every seat's pin,
not only a differing valid pair. It uses the same bounded read-only recovery and fresh
review, and the task-specific schema requires audit_sha. Post-merge gate-evidence SOFT
absence is unchanged. Eight positive/negative recovery mirrors cover missing/malformed
worker/seat evidence: valid second responses continue in-phase; persistent invalid
responses never merge. A missing worker pin also exposed a strict prompt interpolation
error; its diagnostic now renders an explicit unrecorded marker so Git lookup can run.

Legacy success fixtures now use commit-shaped worker identities and an explicit task-
audit fixture builder supplies the dispatched pin. Explicit audit_sha values, including
undefined, are untouched; rawTaskAuditPins bypasses the builder for missing-field
regressions. These raw actual-flow cases prove production behavior, not fixture repair.
The six redundant allApprove/blocker checks were reduced to the central predicate;
persistent deaths still produce a roster shortfall and cannot approve.

Second-candidate repair validation: **1,836 JS tests passed, 0 failed**. Six disposable
mutations (worker usability, seat usability, valid-pair equality, retry bound, task
schema requirement, operation-pin equality) each fail the intended assertion. Redaction
lint is clean; the actual staged script is **323,229 bytes**, within the 524,288 cap.
The final shell sweep and another complete four-seat Snipe review remain pending on
the new committed candidate. No first-candidate approval is transferred to these bytes.

## Candidate 2 review and final boundary repairs (in progress)

Candidate `3bc79603381c84d952bb40d9ecc9727ff5bc53b0` passed 1,836 JS tests,
all 31 shell files, redaction lint and GitHub CI; staged workflow 323,229 bytes.
All 17 preserved refs remained unchanged. Its complete, stable four-seat Snipe panel
is retained in candidate-2-snipe.md/.json. Simplicity approved; correctness,
cascading-impact and test-fidelity requested changes. It remains **held**.

The four findings were verified and grouped into three repair classes:

- Approval evidence: ace full/subset/scope-breach, merge mismatch and terminal
  receipts were appended before unanimous approval. Twenty behavioral rejection
  regressions failed before repair and pass after moving writes behind allApprove.
  Existing successful receipt cases retain their provenance; rejected content still
  follows its existing revert/hold path.
- Git object identity: syntactically equal reports bypassed actual Git resolution.
  Every complete task panel now obtains an independent read-only positional Git proof.
  Full object identities must agree; a bounded re-audit may repair initial worker
  reports, while operation-specific promises cannot move. Real Git fixtures include
  two actual commit objects with a shared seven-digit prefix, a nonexistent object,
  a valid abbreviation and successful repair. The previously untested audit-pin
  transport-death arm has an independent-sibling acceptance test.
- Artifact identity: any absolute path previously survived to readers. Every capture
  producer now owns a new logical-attempt prefix; only its mktemp suffix/gate.log path
  is admitted before continuations, evidence, recovery or downstream readers. Recovery
  receives a fresh prefix, segmented continuation retains its current prefix, and a
  baseline retry cannot reuse an already admitted same-tip file. Per-run randomness
  prevents deterministic reuse after restart; Git remains the durable source of truth,
  while gate files remain ephemeral evidence. Content and stamp reading remain the
  refiner/auditor's responsibility; path validation alone does not prove file contents.

Full validation, guard-removal evidence and the next committed-candidate panel are
pending. Historical approvals do not cover these changed bytes.

Boundary repair validation complete: **1,898 JS tests passed, 0 failed; all 31 shell
files passed; redaction lint clean; staged workflow 325,742 bytes / 524,288 cap**.
Version slots remain coherent and monotonic at 0.21.13. The full JS run caught one
stale capture-call census after unused positional arguments were removed; the census
now pins the same four identity-bearing context objects, and the entire suite passed.
The final schema edit only clarifies that successful re-audits (not transfer-only
probes) emit re-audit receipts and preserves the required audit_sha sentence.

The final controls comprise 18 failing guard-removal mutations plus two before-source
runs: six Git identity cases and 22 artifact cases fail before the repair. A malformed
proof's no-throw classification and a genuinely abbreviated resolution strengthen the
array/full-resolution controls that initially survived; all final controls fail their
behavioral assertions. Ace receipt authorization is centralized at recordAceTransfer,
with full/subset/scope-breach mirrors; mismatch and terminal writers keep their own
success gates. Task pin proofs use the normal refiner tier, escalating repair verification
to the recovery tier. No additional permission or human Git maintenance is required.

Exact commands, source/log hashes, controls and all protected ref identities are in
candidate-3-validation.json. The initial and both reviewed candidates remain traceable.
The next panel must cover the new committed SHA; the verdict remains held until then.

## Candidate 3 review: incomplete panel; success accounting repair in progress

Candidate `5db8cce7fac141a759b07432fff5f5e4a21a6b34` is pushed, clean, CI green,
with all recorded validation hashes matching committed files. Its Snipe scope was
stable and readable, but the panel is **incomplete**: correctness requested changes,
simplicity approved with a Minor, and cascading-impact/test-fidelity both failed with
“Selected model is at capacity.” Their partial transport output is not an audit verdict.
The exact report and validated peer outcomes are retained in candidate-3-snipe files.
No model substitution or broader permissions were used.

The new Major is verified: normal success-shaped MergeResults bypass post-dispatch Git
verification. The repair is extending the existing reconciliation boundary to confirm
both claimed success and claimed non-success through fresh read-only Git. This also
prevents a false floor/error report from concealing an advanced target. Task and land
identity checks are shared with recovery; missing or contradictory proof enters the
existing bounded maintenance path. Proven absence must never return a lost success enum.
Regression, consumer migration and validation are in progress; no approval is claimed.

The Minor collision-fixture finding is absorbed: two fixed real Git commit payloads
share prefix 385b737. Git verifies their full IDs and ambiguity on every run; no dynamic
collision search remains. The earlier proof-schema error instruction is also made
schema-conforming (`head_sha: ''`, `pins: []`) while retaining unresolved-audit routing.

### Normal-outcome Git certainty: class closure

- **Cause → rule:** a recognized MergeResult enum bypassed reconciliation. A normal reply now
  receives a separate read-only Git confirmation before it can account success or absence.
  Confirmation checks the independently resolved reported SHA, actual local/origin/source refs,
  task ancestry and captured patch, or the land commit's exact ordered parents. Equal abbreviated
  proof fields are insufficient. Known failure replies also require unchanged local/origin refs.
- **Sibling/consumer sweep:** one boundary covers primary/floor/environment/baseline task merges,
  polish and terminal merges, plus all land sites after segmented continuation. Unconfirmed replies
  become errors before recovery so a proved-unmerged result cannot return the original success.
  The shared `mergeGitMatches` predicate serves confirmation and recovery; missing/false ancestry,
  absent origin parent, changed source/patch and malformed parents cannot bypass either arm.
  Completion arrays, transfer accounting, evidence threading, current-tip tracking and Wrap-up
  consume only the confirmed/reconciled result. A verified normal task no-op remains valid;
  automatic uncertain recovery still needs a nonempty patch and advancement.
- **Regression/mutation evidence:** ten real-Git task/land cases cover minimal, nonexistent,
  wrong-tip, valid and falsely failed replies; eight negative cases fail against `5db8cce7`.
  Valid pushes proceed; concealed successful pushes reconcile in phase; land reuses one actual
  phase commit. Alternate polish/terminal cases preserve unresolved findings. Mirror cases cover
  missing proof, failed reads, full identity, claim correspondence, every land-parent condition,
  false-failure local/remote advancement, foreign mode/status and recovery ancestry. All **22**
  guard-removal controls fail their intended assertions; no surviving mutation is counted as proof.
- **Consequences:** normal confirmation uses the configured ordinary refiner; uncertain maintenance
  uses the independent recovery tier. No auditor gains write permission, no worker round is spent,
  and recoverable state proceeds without human Git. Source, refiner card, recovery/schema references,
  D21 and ADR 0051 now state this shared rule. Existing gate/floor obligations and missing-artifact
  SOFT behavior remain. Legacy success fixtures now supply identities explicitly or through a named
  fixture constructor; boundary fixtures opt out and use raw replies plus independent Git oracles.
- **Residuals:** the extra read-only dispatch has a runtime cost, retained under D17's live-cost
  backstop. The refiner still executes Git/gate/floor procedures under its agent contract; controlled
  gate/floor replies in real-Git fixtures are not live-model end-to-end proof. Unknown concurrent
  history holds only after bounded maintenance cannot prove a safe outcome. The collision Minor
  and schema-conforming audit-pin error response are fixed without new policy.

Fresh full JS validation passed **1,940 tests, 0 failed**, including prompt budgets and version
coherence at 0.21.13. Staged workflow: **329,210 bytes / 524,288 cap**. Redaction lint is clean;
all 17 protected refs are unchanged. All **31 shell test files passed, 0 failed**. Commands,
source/log hashes and controls are preserved in candidate-4-validation.json. The next exact-SHA
panel is pending.
The final panel's exact report, execution identity and verdict will be recorded in the PR body
so recording the review does not silently create another candidate SHA.

## Candidate 4 audit and remaining Git boundary repair

Candidate `81b16050fafb6eea5dcad11ef223216b5b378fd0` was committed/pushed with
1,940 JS tests and 31 shell suites passing, clean redaction/CI and 329,210 staged bytes.
Its four-seat Snipe panel is complete and stable: correctness and simplicity approve;
cascading-impact and test-fidelity request changes. Exact report and validated execution
metadata are preserved in candidate-4-snipe.md/.json. The PR description carries that report
and a held verdict. All 17 protected refs remain unchanged.

Three Majors are in the same open Git-certainty/classification boundary: pin-transfer rebase
results need independent pre/post Git evidence (including already_upstream), a pre-existing
local-only integration commit must not piggyback on the current task's publication, and the
terminal repeated snapshot-death arm needs a sibling-completion regression. The Minor release
blurb drift is verified in README/CHANGELOG and is being corrected without a version bump.

Repair in progress: a shared pre-mutation target check now runs before pin rebase as well as
ordinary task/sweep merges. It accepts an aligned origin target or a fresh cut exactly at its
published working seed. The recovery tier can fast-forward a local follower safely before an
independent re-read; it must preserve and report unaccounted local-only history. Pin transfer
gets a separate read-only proof of the original approved content, actual branch/ref identities,
pre/post Git patch IDs and actual cherry matches. Changed content re-audits before publication;
an unverified already_upstream cannot bypass the merge boundary. Repeated snapshot deaths
retain soft env-died and allow independent siblings to land. Validation and guard-removal
controls are pending; this dirty successor is not covered by candidate 4's approvals.

### Candidate 5 class closure: Git truth across the pin and resume boundaries

- **Cause → rule:** the pre-merge pin probe could rebase before any snapshot, and its own
  internally consistent fields could account approval/completion without actual Git evidence.
  A local-only target commit could also piggyback on the current task's push. The shared snapshot
  now checks target publication before pin rebase and every task/sweep merge. A separate read-only
  pin proof independently resolves reported commits, the approved content/tree (including known
  forward-revert), actual target/source refs, merge base, patch IDs and cherry matches.
- **Sibling/consumer sweep:** transferred, mismatch, already-upstream, conflict, empty-unmatched,
  error, missing and unknown status arms were inspected. Contradiction routing still reaches the
  independent transfer guard. Changed content after an error re-audits; absent reported bases are
  filled from Git, and fabricated destinations/cherry accounting cannot emit a receipt. Target
  publication is checked before pin rebase and again before normal task, polish and terminal
  merges. Safe target maintenance uses the stronger recovery seat and an independent re-read;
  even a lost maintenance reply can resolve from Git. Unaccounted local-only history is preserved
  and held after bounded maintenance instead of published. Completion, transfer receipts, current
  tips and phase land consume only admitted proof.
- **Resume consequence:** the same sweep found that an exact phase commit already at origin
  before dispatch was falsely rejected by the previous strict first-parent rule. Normal and
  uncertain land now reuse that published two-parent commit with the exact integration parent
  and local-base ancestry proof. This exception permits an empty patch/no advancement only for
  that already-published land; uncertain task recovery retains its nonempty/advancement bounds.
- **Regression/mutation evidence:** sixteen real-Git pin cases exercise truthful and forged
  patch/SHA/cherry claims, partial-error/unknown/missing replies, approving/rejecting fresh panels,
  target mutation, and valid/invalid forward-revert ancestry. Six real-Git target cases cover
  published/unpublished seeds, local-only history, safe follower fast-forward, a reply lost after
  fast-forward, and false maintenance success. Two real-Git already-published phase cases prove
  normal and lost-response re-entry create no duplicate commit. Eleven cases fail against the
  exact previous candidate. All **52** retained guard-removal controls fail their intended
  assertions (47 boundary controls plus five ordering/error-arm controls). Redundant content-tree,
  upstream-base, cherry-full and cherry-presence checks were removed rather than counted as proof.
  Malformed proof, missing/false ancestry, absent remote, overclaimed/duplicate/unresolved matches,
  both retry outcomes and each snapshot/proof exhausted-death classification have mirror cases.
  A dead snapshot stays site-named soft env-died and the independent sibling lands.
- **Documentation:** refiner card, recovery procedure, schemas, ADRs 0049/0051 and D21 now describe
  the same source-of-truth boundary. README/CHANGELOG no longer promise silent scope-conflict
  approval, guessed gate files or ancestry-only recovery. The legacy harness uses explicitly named
  synthetic Git replies; the boundary regressions use separate real-Git oracles and raw mutator
  claims. No release/version change, auditor Git write permission or human Git command is added.
- **Residuals:** independent refiners execute the Git/gate/floor contracts; the real-Git fixtures
  use controlled gate/floor responses and do not establish live-model procedural adherence.
  Additional read-only dispatch cost remains the D17 live-cost backstop. Unknown writers or
  unaccounted concurrent history hold only after bounded safe maintenance cannot prove an outcome.
  General concurrency/locking redesign is outside this bounded repair.

Final validation passed **2,017 JS tests, 0 failed**, and **31 shell test files, 0 failed**.
The final release-blurb-only correction also passed all **95** version-slot, skill-document
and prompt-budget checks; engine source/tests were unchanged. Redaction is clean, version slots
remain 0.21.13, the actual staged workflow is **339,151 bytes / 524,288 cap**, and all **17**
protected refs are unchanged. Candidate-5-validation.json carries commands, source/log hashes,
52 guard controls, eleven before-source negatives and the protected-ref comparison.
The final exact-SHA Snipe report, execution identity, CI and verdict will be recorded in the
PR body without changing its candidate. No merge or release is authorized or performed.

## Candidate 5 audit and corrective boundary sweep

Candidate `f53c979c5b5338d9961ad35fd5f05fbf178a587f` has a complete, stable four-seat
Snipe report, preserved in candidate-5-snipe.md/.json and the held PR description. Simplicity
approves with a Minor; correctness/cascading-impact identify the same submodule context defect,
and test-fidelity identifies incomplete cherry-set coverage. The candidate is held.

Both defects are verified. Distinct claims `[A, B]` with duplicate independent cherry rows
`[A, A]` falsely complete the task; the earlier duplicate fixture changed the claim collection
instead. The set comparison now requires coverage of each distinct claim, which together with
equal lengths proves both directions and unique proof rows. The submodule fixture creates an
actual Git submodule with only origin/main, a local unpublished integration branch, and two task
branches. The previous candidate fails before the first task merge because it requests the
superproject seed; its pin context also watches targetBase instead of the integration branch.

Repair in progress: one task Git context feeds pin preflight/proof and all primary/floor/
environment/baseline task merges. It names integration as target and targetBase as the submodule
seed (workingBranch for ordinary tasks). Phase sweep/terminal contexts carry the same phase
seed; land continues to target the submodule base. Real-Git initial/later-task, lost-task-response,
lost-land-response and unpublished-seed cases pass after correction. Retry/sweep mirrors, mutation
proof, documentation and final validation are still being completed.

The holder-aware worktree diagnostic Minor is deferred: all three arms are correct, and this
request's bounded scope excludes optional broad cleanup. Its shared-helper refactor does not
repair false approval, completion, pin attribution or misleading evidence in this candidate.
No issue is closed for that deferral.

### Candidate 6 class closure: proof sets and repository-local ref contexts

- **Root cause → rule:** cherry-row coverage did not prove coverage of every claimed task commit.
  The consumer now checks every distinct claim against the cherry list. Distinct claims plus
  equal cardinality and full claim coverage also prove the cherry list has no duplicates or extra
  identities; a second redundant uniqueness/set implementation is unnecessary. Duplicate-first,
  duplicate-second and reordered-positive fixtures exercise the collection the prior test missed.
- **Producer/sibling/consumer sweep:** the pin rebase, pin proof and primary/floor/environment/
  baseline task merge paths now share `taskMergeContext`. The integration target and explicit
  seed are chosen in the task's repository. `mergeSnapshot` no longer invents a superproject seed.
  Phase polish and terminal share `phaseGitSeed`; submodule land retains targetBase as its target.
  Normal and recovery confirmations inherit the same context. Real-Git tests use an actual
  submodule and bare remote with no superproject working ref, cover the first and later tasks,
  and verify one phase commit on lost task/land responses. Retry and sweep/terminal mirrors check
  every caller and both ordinary/submodule seed branches.
- **Recursive maintenance consequence:** a fresh local integration cut may trail its already
  published seed. The recovery prompt explicitly permits a safe follower fast-forward to that
  seed when origin integration is absent, followed by the same independent re-read. A real-Git
  fixture follows this instruction and succeeds; removing the instruction makes the controlled
  refiner preserve state and the test fail. This is prompt-procedure evidence, not live-model
  execution proof. An unpublished local seed still stays held and is never pushed.
- **Discriminating evidence:** the previous committed candidate fails both duplicate-proof cases
  and all three successful submodule normal/lost-response cases. All **66** retained mutation
  controls fail their intended assertions: the earlier 52 boundary/ordering controls, 13 new
  context/set controls and one published-seed instruction control. Earlier before-source failures
  remain separately attributed to their original candidates. The real-Git target fixtures now
  query the seed actually named in the snapshot prompt rather than hard-coding a working ref.
- **Docs and residuals:** recovery/schema references and ADR 0051 describe the explicit topology
  and exact-set rule. Runtime source comments distinguish pre-mutation/proved-unmerged soft deaths
  from unresolved mutations. No config, model, permission, enum, version or release scope changes.
  Git and gate/floor procedures remain an agent contract; the fixtures do not claim a live Opus
  run. Mixed-repository orchestration outside the existing submodule-phase contract is not redesigned.
  The current holder-diagnostic duplication Minor remains a documented nonblocking refactor.

Final validation: **2,030 JS tests passed, 0 failed**, **31 shell files passed, 0 failed**,
redaction clean, release slots coherent at 0.21.13, and actual staged size **338,778 / 524,288
bytes**. The first full run exposed a stale inline-context capture census; its correction now
pins the named primary/floor/environment/baseline callers, followed by the complete successful
rerun. All **17** protected refs remain unchanged. Candidate-6-validation.json records source/log
hashes and controls. Commit/push and the exact-SHA final review follow; the PR body will carry
the final report and verdict without changing that candidate. No merge or release is performed.


### Candidate 6 final panel: held for current-content proof

The complete, stable, full-scope four-seat panel at **2fb21d096fdb7162d495bc748de1d77627165b8b**
returned correctness request_changes and three approvals. The exact report and execution identity
are preserved in candidate-6-snipe.md/.json and the held PR body. Correctness verified that
`git cherry` omits merge commits: a task's unique merge resolution can disappear during rebase
while all listed non-merge commits match upstream. A second real-Git graph independently confirms
that a linear task can also disappear when its matching upstream commit was later reverted;
that graph has task_count == cherry.length, so a count-only repair would leave the same class open.
Both probes rebase the task exactly onto integration with different approved and final Git trees.

Repair rule: the no-panel shortcut requires the actual final Git tree to equal the approved tree.
The cherry collection remains an exact, distinct set of the **non-merge** task commits Git listed;
it is no longer presented as proof of current content or of merge-commit coverage. Equal trees
prove complete content even when merge commits are absent from cherry; an extra count comparison
would be redundant for that proof. When trees differ or the final tree evidence is absent, a full
panel examines the original task diff and changes since approval, with the plan's acceptance
criteria, before completion. A successful panel permits already-published work without an empty
content merge; shared refs are independently re-read before its receipt. Rejected, incomplete,
dead or pin-invalid panels cannot complete the task. Tests and validation are in progress.


### Candidate 7 class closure: historical matches versus present content

- **Cause and rule:** history equivalence cannot establish present content. Two real-Git negative
  graphs lose approved merge-only or later-reverted linear work while cherry reports only `-`
  matches and rebase ends at integration. Both fail against the previous committed source. The
  linear graph also proves equal task/cherry counts would not repair the class. The consumer now
  requires equality of independently read complete trees for the direct shortcut. Missing or
  malformed final-tree evidence cannot compare equal to the already validated approved tree.
- **Sibling/consumer sweep:** all in-lock mismatch routes (explicit mismatch, disproved transfer,
  error/missing/unknown changed-head fallback and already-upstream with a different tree) now
  receive the same original-content audit charge through auditRound's existing `extra` seam.
  Auditors inspect both the original task diff and changes since approval, so an empty or partial
  integration diff cannot hide dropped work. The full configured roster and independent audit-pin
  resolution remain mandatory. Existing Minor disposition routing still runs on both outcomes.
  An admitted already-upstream candidate that receives fresh approval skips the empty content
  merge, after a second independent proof of its unchanged published destination. Both receipt
  and completion follow that proof; no new status, seat, permission or Git mutation was added.
- **Recursive evidence:** five real-Git graphs cover merge loss, linear revert loss, preserved
  merge content, identical linear content, and valid content beside sibling changes. The preserved
  merge graph intentionally has three task commits but two cherry rows and equal complete trees:
  its no-panel acceptance demonstrates why merge-history cardinality is unnecessary for content
  proof. Thirteen two-seat boundary fixtures cover approval, absent/malformed tree evidence,
  rejection, approve-with-blocker, missing/dead seats, invalid audit pins, missing/dead final Git
  reads and moved task/local/origin refs. Read-only deaths leave independent sibling work runnable;
  unexpected shared mutations hold publication. Three routing mirrors prove the content charge
  also reaches ordinary mismatch/error/transfer paths; a scoped standing/dispatched prompt test
  binds the original diff, changes-since-approval and acceptance-criteria obligations.
- **Guard discrimination:** all **15 new mutations** fail their intended assertions: tree equality,
  absent-tree bypass, re-audit flag/routing, full content charge and its two pinned diff commands,
  the final Git read, its death/missing/head-movement branches, empty-merge avoidance, both direct
  and fresh-panel continuation arms, and actual final-tree reading. Two before-source negatives
  reproduce false completion at 2fb21d09. Earlier 66 candidate-6 mutation results remain historical
  evidence at their documented SHA; they are not represented as freshly rerun controls here.
- **Consequence/residuals:** same-content work keeps the shortcut even with merge history; benign
  sibling changes spend a fresh read-only panel rather than force a phase hold. Lost work needs
  renewed acceptance and cannot inherit its old approval. Current Git trees and real history are
  independently measured in fixtures; auditor judgments and maintenance dispatches remain
  controlled responses, not a claim of live-model end-to-end execution. Schema/recovery/ADR and
  standing auditor/refiner prose are synchronized. The holder-diagnostic helper Minor stays
  deferred under the bounded integrity scope. No merge, release or protected-ref change occurred.

Final validation: **2,052 JS tests passed, 0 failed**, **31 shell files passed, 0 failed**,
redaction clean and release slots coherent at **0.21.13**. Actual staging is **340,580 /
524,288 bytes**. The first full run caught the missing census entries for three independently
validated Git SHAs; the classified entries and the additional standing-charge contract are
covered by the complete final rerun. Candidate-7-validation.json preserves source/log hashes,
15 fresh mutation results and the before-source negative results. All 17 protected refs remain
unchanged. Commit/push and exact-SHA Snipe follow. The PR body will hold the final report and
verdict without changing the reviewed SHA; the source ledger and manifests remain its durable
validation baseline. No merge or release is performed.
