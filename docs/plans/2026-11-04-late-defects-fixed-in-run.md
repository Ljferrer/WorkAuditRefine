# A real defect found during a WAR run gets fixed during that run

Authored by `/war-strategy` (bare invoke, plan interview) for item 24 of [#2559](https://github.com/Ljferrer/WorkAuditRefine/issues/2559). Scope: [#2548](https://github.com/Ljferrer/WorkAuditRefine/issues/2548) with its pinned-mechanism addition, [#2379](https://github.com/Ljferrer/WorkAuditRefine/issues/2379), item 2 of [#2329](https://github.com/Ljferrer/WorkAuditRefine/issues/2329), the ace half of [#2150](https://github.com/Ljferrer/WorkAuditRefine/issues/2150), and the `aceBisect` sites of [#2555](https://github.com/Ljferrer/WorkAuditRefine/issues/2555). Measured base: `98e984c57372c05032f3478007f4eb6d6e825ebd` (origin/master, release 0.21.35 plus PR #2587).

**Evidence consumed** — one row per linked artifact:
- issue #2548 with comments (2026-10-31) · read, including the operator ruling and the pinned-mechanism addition
- issue #2379 with comments (2026-10-31) · read, F3 only (F1, F2 and F4 are other classes)
- issue #2329 with comments (2026-10-31) · read, item 2 only (items 1, 3 and 4 are other classes)
- issue #2150 with comments (2026-10-31) · read, the ace half (the polish-merge half shipped in PR #2584)
- issue #2555 · read via `gh issue list --search aceBisect` (title and residual only)
- issues #2442, #2530, #2373 · listed by the ace reader, unread in full: none changes a decision here
- Aligned run journal for campaign `2026-10-30-mobile-v1-corrections` · unread, private repo: the plan cites it through #2548's quoted evidence
- Obelisks run `6a05feee`, AutoIndex runs `f65e7e37` and `record-split-audit-step-2026-09-06` journals · unread, other repos: cited through the issue bodies, which quote the engine outcomes
- `skills/war/assets/workflow-template.js`, `land-decision.mjs`, `stage-workflow.mjs`, `assert-args-complete.mjs`, `prompt-surface-budgets.test.mjs`, `stage-workflow.test.mjs`, `workflow-template.test-harness.mjs` at `98e984c5` · read (three recon readers plus direct greps)
- `agents/war-auditor.md`, `agents/war-refiner.md`, `skills/war/references/schemas.md`, `fix-round-doctrine.md`, `sweep-exclusion.md`, `skills/war/SKILL.md` § Checkpoint at `98e984c5` · read
- ADRs 0005, 0012, 0013 (with its 2026-08-20 and 2026-09-04 amendments), 0017, 0042, 0051, 0054 at `98e984c5` · read
- `docs/learnings/` via a batched `war-memory` query (scope, ace, gate-audit, decomposition, release) · read
- run manifests under `.claude/war/runs/` · unread: every field case lives in another repo
- #2150 Evidence artifacts (AutoIndex journal `wf_cd682eb9-bff`, landed tip `41b5cc2c`, polish branch `war/record-split-audit-step/p2-polish` at `d9dc431c`) · unread, other repo: cited through #2150's body, which quotes the three logs
- `docs/red-team/2026-11-04-late-defects-fixed-in-run.md` (red-team round 1) · read: its findings patched this plan

**Trials run** — one row per trial:
bounds: wall 600 s · cmd 120 s · excerpt 20 · config: .claude/war/config.json (section absent) · overrides: none · trial tier: inherit/session (default)
tokens: n/a · wall: 1 min (source: n/a)
escape-guard: clean

- TRIAL-1 · fact · does the check form `out=$(node --test --test-reporter=tap --test-name-pattern=… <files>) && grep -qE '^ *ok [0-9]+ - <name>'` print its token only when a named test passes? · settles: the End-state check form · bound: wall 600 s · cmd 120 s · base: n/a (scratch fixture outside the repo) · sandbox: job tmp `taptry/` · guard: n/a (no repo touched) · cap: unenforced · result: settled — PASS for a passing named test, RED for no match and RED for a failing test, while the `# pass N` summary form went green on no match · removed: job tmp `taptry/` · wall: 1 min
    ```
    command: out=$(node --test --test-reporter=tap --test-name-pattern="^late-defect: a" '*.test.mjs') && printf '%s\n' "$out" | grep -qE "^ *ok [0-9]+ - late-defect: a" && echo PASS || echo RED
    observed: late-defect: a => PASS
    observed: late-defect: zz => RED
    observed: late-defect: bad => RED
    observed: summary form on no match: # tests 1 / # pass 1 / # fail 0 (the file itself counts)
    ```
- TRIAL-2 · pair · what runs a late fix after merge? · brief: a fix after merge needs a worker, the gate, an audit and fix rounds before land · criteria: no fail-open loss, budget on the origin task, sweep wording rows unchanged, smallest engine diff · candidates: A a new late-fix pass between the gate-audit and the sweep, B fix rounds inside the phase-close sweep · scores: A yes/yes/yes/medium, B partial/yes/no/large · chosen: A (user) Q7 · rejected: B, because the sweep discards on any failure, never runs on a held phase, and would mix wording and behavior fixes in one commit · grafts: A reuses the polish worktree's provision and fast-forward merge idiom
- TRIAL-3 · pair · how does the engine learn that an ace re-audit blocker predates the ace? · criteria: independent oracle (ADR 0051), cost, catches the Obelisks case · candidates: A a separate read-only probe seat, B re-audit seats self-mark `predates`, C an engine locator diff · chosen: A (user) Q5 · rejected: B grades its own claim, C misses Obelisks (the ace edited the same file) · grafts: none
- TRIAL-4 · sweep · base: 30b214ae28fc6660490f5aad07a94f2e0398ac2b · sandbox: job tmp `trial-4/` · bound: wall 600 s · cmd 120 s · cap: enforced · guard: snapshot 0 / baseline 0 · E1 · parse ok · exit 1 · token no · red · E3 to E12 · parse ok · exit 1 · token no · red (no `late-defect:` test exists, so no `ok` line prints) · E14 · parse ok · exit 1 · token no · red (version 0.21.35) · E2 HARD and E13 gate not run · reach: E1 and E2 → Task 1.1 · E3 → 2.1 · E4 and E5 → 3.1 · E6 → 4.1 · E7, E8, E9, E12 → 5.1 · E10 → 6.1 · E11 → 6.2 · E13 → every task · E14 → 7.1 · removed: job tmp `trial-4/` · wall: 3 min
- TRIAL-5 · sweep · re-run after the red-team round 1 check edits · base: 8d1b7b8b3256e216bed3b85ee9e5b13afea3a038 · sandbox: job tmp `trial-5/` · bound: wall 600 s · cmd 120 s · cap: enforced · guard: snapshot 0 / baseline 0 · E1, E2, E6, E12, E14, E15 · parse ok · exit 1 · token no · red · reach: E2 → Task 1.1 · E15 → 3.1 · removed: job tmp `trial-5/` · wall: 2 min

## Context — the gap / problem

WAR's objective today is to land the plan, and a real defect the run finds can leave as a `war-followup` issue while the phase lands green (verified: issue #2548 (2026-10-31)). Four field cases show four exits:

1. **Exclusion demote (Aligned t5-2).** A seat set `absorb` and `phaseClose: true` with a full fix. The sweep's exclusion set demoted it with `demote:exclusion-set`, because plan 2 lists the file, and the phase landed with the bug filed (verified: issue #2548 (2026-10-31)). The exclusion set is the union of `A.sweepExclude`, the files of every unsucceeded task this phase, and `RELEASE_SLOT_FILES` (verified: `sweepExcl` block in `workflow-template.js` at `98e984c5`). In the default stack-and-plow mode no parallel branch exists to conflict with (verified: issue #2548 (2026-10-31), ADR 0011).
2. **Slice-pinned note (Aligned T16).** A defect the task added was recorded as `note` at three SHAs because the slice prescribed the mechanism (verified: issue #2548 comment (2026-10-31)). The latitude rule blocks only "deviations that contradict the intent or the slice", and no sentence says a slice-pinned defect stays a defect (verified: `LATITUDE RULE` in `auditPrompt` and `agents/war-auditor.md` § Latitude and disposition at `98e984c5`). `intakeFloor` promotes a `note` to `absorb` only when it is in the diff and carries a fix (verified: `intakeFloor` at `98e984c5`).
3. **Ace re-audit blames the batch (Obelisks t1).** A Nit noted by the first panel came back as a Major at the ace re-audit. `aceBisect` names culprits by file name alone (`culpritFiles` from `blockingOf(regressionSeats)`), so every absorb was forward-reverted with `demote:absorb-regressed` and the Major survived only as a phase note (verified: issue #2379 (2026-10-31), `aceBisect` at `98e984c5`). No code compares a re-audit blocker to the pre-ace tip (verified: recon grep at `98e984c5`).
4. **Ace gate blames the batch (AutoIndex record-split).** A standing baseline red (a docker build step) made every ace gate red, so both ace batches were forward-reverted, and 0 absorbs landed in-run (verified: issue #2150 (2026-09-07)). `aceGateGreen` judges green only on `gate_green === true` at the ace tip and never runs the pre-ace tip (verified: `aceGateGreen` at `98e984c5`). A first-wave ace runs before any merge in its phase, so `baselineDebt` is empty when its gate runs (verified: `aceStage` comment "no longer runs inside the serial merge queue" (#1913) at `98e984c5`). The polish and terminal merges already proceed over named baseline debt through `sweepDebtClause` (PR #2584), but the `PHASE-CLOSE COHERENCE SWEEP` worker prompt says "keep the gate (<gate>) green" with no debt list, so a worker that meets a known red can stop and discard the sweep (verified: the sweep prompt and `sweepDebtClause` at `98e984c5`).
5. **Gate-audit Major holds (AutoIndex f65e7e37).** The post-merge gate-audit returned `request_changes` with one Major and a complete `suggested_fix`. `isHardGateEvidence` treats any Critical or Major as hard, the engine pushes `{ reason: 'gate-evidence' }` with no `fixRounds` and no `escalate_reason`, and the phase holds with zero fix rounds (verified: issue #2329 (2026-10-05), gate-audit pass at `98e984c5`). Only Minor and Nit gate-audit rows reach `routeGateAuditRows` (verified: same).

Today's carry seed `args.seededPhaseClose` feeds only the next sweep, which makes one commit with no fix rounds, and it cannot create a task (verified: `carryPhaseClose` and the seeded intake at `98e984c5`). `aceBisect`'s subset and re-entry dispatches already run through `dispatchSite`, so a dead infra dispatch is labeled `env-died` and a dead result abandons the ladder to the sweep. The residual of #2555 is that a resolved null reads "worker returned no result" instead of an `env-died` label, and a non-infra throw rethrows HARD by the D21 header (verified: `dispatchSite` and the `aceBisect` subset loop at `98e984c5`).

## Pivotal constraints

- **The staged template has about 1 KB of room.** The comment-stripped copy is 401,423 B. `SCRIPT_BYTE_CAP` is 524,288 B, and `stage-workflow.test.mjs` holds `ARGS_HEADROOM_BYTES` = 121,856 B for the campaign args class, which leaves 1,009 B (verified: measured with `stripFullLineComments` at `98e984c5`). Outside every prompt span the copy carries 17,707 B of leading indent and 3,788 B of blank lines (verified: measured with `ptSpanRanges` at `98e984c5`). `SCRIPT_BYTE_CAP` is the Workflow tool's own limit and cannot rise (verified: SKILL.md staging step at `98e984c5`). Phase 1 funds every later engine phase.
- **Prompt-literal budget.** `WORKFLOW_LITERAL_BUDGET` caps the template's prompt-literal share at 172,032 B hard (151,552 B advisory), and the share measures about 161,034 B, so about 11 KB of new prompt text fits (verified: red-team round 1 measurement at `633e9a7c`). New dispatched prompt text in Phases 2 to 6 stays inside it, and no task raises it.
- **Pass slot.** The land decision (`hardEscalation`, `landDecision`) is computed before the sweep, and a discarded sweep recomputes nothing (ADR 0012). The late-fix pass and the behavior-row sort run before that computation (verified: the land block and the sweep header in `workflow-template.js` at `98e984c5`).
- **Card budgets.** `agents/war-auditor.md` is 28,603 B against a 28,672 B hard line (69 B room). `agents/war-refiner.md` is 37,024 B against 37,888 B (864 B room). `skills/war/SKILL.md` is 69,863 B against 73,728 B (verified: `FILE_BUDGETS` in `prompt-surface-budgets.test.mjs` at `98e984c5`). New card text funds itself by an ADR 0042 eviction to a `references/` file, never a raise without the cite.
- **One file carries the engine.** Every engine change edits `workflow-template.js`, so each phase holds at most one template task (decomposition rule 1). Mirrors: `HARD_ESCALATION_REASONS` and `DEMOTE_REASONS` live in `land-decision.mjs` and are hand-mirrored in the template, with drift guards in `land-decision.test.mjs`, `war-config.test.mjs` and the `workflow-template.engine-1.test.mjs` mirror registry (verified: recon at `98e984c5`).
- **Prompt surfaces are split.** A change to auditor or refiner behavior edits the card and the dispatched prompt in the same commit (CLAUDE.md, ADR 0013). `DISPOSITION_RULE_CLAUSE` is one shared const consumed by `auditPrompt` and the three gate-audit dispatches (verified: `workflow-template.engine-1.test.mjs` at `98e984c5`).
- **ADR 0054's tree check is never relaxed.** `verifyPinTransfer`'s tree clause guards against merging a commit no panel judged (verified: ADR 0054 §1, its pin 25).
- **ADR 0005:** `run.roundLimit` is the one retry budget, a new knob is rejected, and `held:workflow-error` never joins `HARD_ESCALATION_REASONS` (verified: ADR 0005).
- **ADR 0017:** no check, gate, floor or backstop is waived in prose (verified: ADR 0017).

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Late behavior defect | gets a bounded fix before land, inside the shared round cap. Cap spent: carries to the next phase as a task, or holds the final phase for a Lead ruling. Filing is the last resort and needs a stated reason. | PIN-1 · (user) ruling on #2548, 2026-10-31 | guardrail ‡ |
| D2 | Slice-pinned defect | a behavior defect the task itself adds stays a finding even if the slice pins the mechanism, and routes as `absorb` or `ask`, never `note` | PIN-2 · (user) #2548 addition | slice (T2.1) |
| D3 | Pre-existing ace re-audit blocker | no regression: keep the absorbs and route the blocker as a late defect, never dropped | PIN-3 · (user) ruling on #2379 | slice (T5.1) |
| D4 | First-wave ace gate | compares a red gate to its own base, so only failures the ace adds count as red. Pre-existing reds go to later work with audit and fix rounds. | PIN-4 · (user) ruling on #2150 | slice (T5.1) |
| D5 | Gate-audit Major with a full fix | takes a bounded fix before land, never straight to a hold | PIN-5 · (user) ruling on #2329 item 2 | slice (T3.1) |
| D6 | Scope | fix bugs in the class in hand, avoid thrash, ask before widening past one bug class | PIN-6 · (user) | guardrail |
| D7 | Telling behavior from cosmetic | the auditor sets `findingClass: 'behavior' \| 'cosmetic'` on each Minor and Nit. A finding with no class keeps today's route. | PIN-7 · (user) Q1 | slice (T2.1) |
| D8 | Late-fix budget | the origin task's `fixRounds`, under `run.roundLimit`, shared with its fix and floor rounds | PIN-8 · (user) Q2 | guardrail |
| D9 | Carry route | a seeded task in the next phase: the engine returns `carriedTasks[]`, the Lead threads them as `args.seededTasks`. A seeded task whose file another task in that phase owns joins that task's slice. | PIN-9 · (user) Q3 | slice (T6.1) |
| D10 | Ace gate base | on a red ace gate only, one gate run at the pre-ace tip, cached per tip. A red whose failing ids are all red at the base counts as green for the revert decision. | PIN-10 · (user) Q4 | slice (T5.1) |
| D11 | Pre-ace existence test | a separate read-only probe seat per blocker returns `exists: yes \| no \| unknown` with evidence | PIN-11 · (user) Q5, after TRIAL-3 | slice (T5.1) |
| D12 | What fixes a pre-existing red | a `baseline` red becomes one behavior late-defect row per run. An `environment` red keeps today's backstop. The polish worker gets the debt list. | PIN-12 · (user) Q6 | slice (T5.1) |
| D13 | Late-fix vehicle | shape A, a new late-fix pass after the gate-audit and before the sweep | PIN-13 · (user) Q7, after TRIAL-2 | slice (T3.1) |
| D14 | #2555 | folded in, narrowed by PIN-23: a resolved null at the `aceBisect` subset and re-entry sites is labeled `env-died`, and a non-infra throw still rethrows HARD | PIN-14, PIN-23 · (user) Q8, red-team round 1 | slice (T5.1) |
| D15 | Names | `findingClass`, `seededTasks`, `carriedTasks`, the hard reason `late-defect`, the pass name late-fix pass and the probe name pre-ace probe are fixed, not worker choice | PIN-15 · (user) Q10 | guardrail |
| D16 | Template room | Phase 1 extends the stager's strip to drop leading indent on code lines outside every string and template literal | PIN-16 · (user) Q11 | slice (T1.1) |
| D17 | Line count | the strip keeps every line, so staged line N is template line N | PIN-17 · (user) Q12 | guardrail ‡ |
| D18 | Strip proof | the strip is tested to the operator's "super thoroughly" bar: four independent oracles plus a mutant per branch | PIN-18 · (user), mid-interview message | end-state |
| D19 | Exclusion narrowing | a `sweepExclude` entry carries `mode: 'stacked' \| 'parallel'`. The `sweep-exclusion.md` one-liner writes `mode: 'stacked'` on every ledger entry (PIN-22). A hand-built entry with no mode reads `parallel`. A behavior row on a stacked-owned or unowned file goes to the late-fix pass. Parallel-owned, task-owned and release-slot files keep the demote, with the reason stated. | PIN-19, PIN-22 · (user) red-team round 1 | slice (T4.1) |
| D20 | Final-phase hold | cap spent on the final phase holds the land under the new hard reason `late-defect` | PIN-20 · (user) ruling on #2548 + Q10 names | slice (T3.1) |
| D21 | Sort before the pass | before the late-fix pass and the land decision, every behavior row is sorted: stacked-owned or unowned files join the pass, other owned files demote with a stated reason. The sweep sees cosmetic rows only. A behavior row first raised by the sweep or terminal seat carries on a non-final phase, or on the final phase is filed with the reason "raised after the late-fix pass". ADR 0012's never-hold rule stands. | PIN-21 · (user) red-team round 1 | slice (T4.1) |
| D22 | Mode source | the `sweep-exclusion.md` one-liner emits `mode: 'stacked'` for every ledger entry. No ledger change. | PIN-22 · (user) red-team round 1 | slice (T4.1) |
| D23 | #2555 narrowed | null label only (see D14) | PIN-23 · (user) red-team round 1 | slice (T5.1) |
| D24 | Class enum home | `FINDING_CLASSES` is a canonical export in `land-decision.mjs`, mirrored in the template, with a mirror-registry row. Docs point at the export. | PIN-24 · (user) red-team round 1 | slice (T2.1) |
| D25 | Late-fix proof | each late-fix commit carries the trailer `Late-Fix: <task id>:<n>`. A relaunch rebuilds `fixRounds` from it, and `task-integrated.sh`'s owned-path rule accepts a single-parent commit whose trailer names the task. | PIN-25 · (user) red-team round 1 | slice (T3.1) |
| D26 | Strip mutant proof | committed `indent-strip: mutant <branch>` rows replace the commit-body mutant list | PIN-26 · (user) red-team round 1 | end-state |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Phases 2 to 6 grow the stripped template by less than the room Phase 1 frees, and their prompt text by less than the about 11 KB `WORKFLOW_LITERAL_BUDGET` room | estimate: about 15 KB of code and under 10 KB of prompt text across the late-fix pass, probe, base gate, seed intake and classes | a later engine task reds `stage-workflow.test.mjs` or `prompt-surface-budgets.test.mjs` and must compress in-task, since `SCRIPT_BYTE_CAP` cannot rise | both tests run in every phase gate |
| A2 | Retired, settled by PIN-22: the one-liner writes `mode: 'stacked'` on every ledger entry | red-team round 1 | none | End state 6's doc row |
| A3 | The ace gate check refiner can return `gate_failing_ids` as the merge gate does | the merge-task path already returns `gate_failing_ids` | D10 cannot compare ids, and the base arm reads every red as new | Task 5.1 fixture |
| A4 | An eviction funds the `findingClass` and slice-pin text on the 69 B auditor card | prior evictions under ADR 0042 | a cited raise instead | `prompt-surface-budgets.test.mjs` in the gate |
| A5 | The refiner card takes the late-fix worktree kind in 864 B, or an eviction funds it | same | a cited raise instead | same |
| A6 | An `environment` red has no in-repo fix | the AutoIndex docker step resolves only under CDK asset staging (issue #2150) | an environment red that a repo edit fixes stays a backstop | none, operator ruling Q6 |
| A7 | Engine tests that execute the template pass when the harness runs the staged form, while tests that read source text keep reading the raw template | red-team round 1 prototype: the strip keeps behavior, and all 30 stripped-form failures at base (21 need comments, 9 need indent) were source-shape tests | the stripped-execution run reds | End state 1 |

**Drift-guard coverage** — each machine-source fact a touched doc restates, and its guard, de-mirror or defer:

| Fact | Source | Choice | Owner |
|---|---|---|---|
| `late-defect` in `HARD_ESCALATION_REASONS` | `land-decision.mjs` | mirror-registry row and the `land-decision.test.mjs` census, docs point at the export | Task 3.1 |
| `FINDING_CLASSES` values | `land-decision.mjs` | mirror-registry row, docs point at the export | Task 2.1 |
| `run.roundLimit` default | `war-config.mjs` `DEFAULTS` | de-mirror: docs name the key, never the number | Tasks 3.1, 6.2 |
| `sweepExclude` `mode` values | the template entry validator | guard: `late-defect: exclusion mode doc` and the entry-shape pin | Task 4.1 |
| the staged-copy room after the strip | `stage-workflow.test.mjs` constants | dated snapshot that names the measuring command | Task 1.1 |
| version slots | `.claude-plugin/plugin.json` | guard: `version-slots.test.mjs` | Task 7.1 |

## Non-goals / deferred

- #2329 items 1, 3 and 4 (the INCOMPLETE gate, End-state binding, the unthreaded gate log): other classes.
- #2379 F1, F2 and F4 (the worktree fence, guard denials, the scriptPath refusal): other classes.
- #2555 outside `aceBisect`: the other null-return worker sites stay open.
- #2442 (dead ace gate reverts unaudited work) and #2373 (a re-raised parked ask): other classes.
- A raise of `run.roundLimit` or `run.absorbRounds`.
- Dropping blank lines from the staged copy (Q12).
- A docs-only Nit keeps today's route, so ace rounds never grow for wording.

## New domain terms · Recommended ADRs

- **late defect**: a `behavior`-class finding that the engine would otherwise demote, revert, hold or file after a task's own audit approved.
- **late-fix pass**: the post-merge, pre-sweep pass that fixes late defects in a worktree at the integrated tip, on the origin task's fix budget.
- **finding class**: the auditor-owned `findingClass` field, `behavior` or `cosmetic`, orthogonal to severity and disposition.
- **pre-ace probe**: the read-only seat that reports whether an ace re-audit blocker exists at the pre-ace tip.
- **seeded task** / **carried task**: a late defect that ran out of rounds, returned in `carriedTasks[]` and launched in the next phase from `args.seededTasks`.
- **ADR 0058 (recommended, Task 6.2):** late defects are fixed in the run. It passes the triad: it changes the land contract (hard to reverse), it reverses the fail-open filing default (surprising), and it trades phase time for in-run fixes (a real trade-off). It amends ADR 0012, 0013, 0026 and 0054 by reference.

## Commander's Intent

- **Purpose:** a real behavior defect that a WAR run finds gets fixed in that run, before land. Filing it for later is the last resort, and it needs a stated reason.
- **Method:** the auditor classes each Minor and Nit as `behavior` or `cosmetic`. A behavior defect that the engine would otherwise demote, revert or hold goes to a new late-fix pass on the origin task's fix budget. The ace gate and the ace re-audit stop blaming an ace for a defect that was there before it. A defect that runs out of rounds carries to the next phase as a seeded task, or holds the final phase for a Lead ruling. Cosmetic rows keep today's routes. Phase 1 first frees room in the staged template.
- **Mechanism latitude:** the probe seat's prompt text, the late-fix worktree's path, how the base-gate result is cached, how the late-fix pass orders several defects, which card or SKILL.md text moves to `references/`, and the source-shape census mechanism are implementer's choice; substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:**
  - the names in D15 are fixed (PIN-15);
  - a late fix spends the origin task's `fixRounds` under `run.roundLimit`, and no budget or `roundLimit` rises without the ADR 0042 cite (PIN-8);
  - the card and the dispatched prompt change in one commit, and both enum mirrors move with their drift guards in one commit;
  - cosmetic rows and rows with no `findingClass` keep today's routes, so ace rounds never grow for wording;
  - ADR 0054's `verifyPinTransfer` tree clause is never relaxed, and no branch is force-moved;
  - the strip keeps the line count, and every byte inside a string or template literal survives (PIN-17);
  - a late defect is never dropped: it is fixed, carried, held or filed with a stated reason (PIN-1);
  - fix bugs in the class in hand, and ask before widening past one bug class (PIN-6).
- **End state:**
  1. The stronger strip is proven by four independent oracles (PIN-18): (a) every line equals its original with only leading whitespace removed, and only on lines that start in the top-level code frame, outside every string, template literal, `${}` body and block comment; (b) every `pt` span and every plain template literal is byte-identical; (c) `strip(strip(x)) === strip(x)` and `node --check` passes; (d) with `WAR_TEMPLATE_STRIPPED=1`, the harness executes the staged form while source-reading tests keep reading the raw template, a row proves the executed bytes are the staged ones, and every `workflow-template.*.test.mjs` test passes. A test that still cannot pass is listed in a closed census, skips under the flag, and has an `indent-strip: census …` row proving it fails on the staged form. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^indent-strip: ' skills/war/assets/stage-workflow.test.mjs) && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - indent-strip: harness runs the staged form' && WAR_TEMPLATE_STRIPPED=1 node --test 'skills/war/assets/workflow-template.*.test.mjs' && echo PASS-E1` · red at base: TRIAL-5
  2. Committed mutant rows prove each scanner branch (PIN-26): one `indent-strip: mutant <branch>` row per branch (single string, double string, backslash continuation, template literal, nested `${}` template, regex literal with a backtick, block comment with a backtick, a `//` line inside a template, the `interp` frame) mutates the exported scanner in memory, loads it, and asserts an oracle row fails. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^indent-strip: mutant ' skills/war/assets/stage-workflow.test.mjs) && [ "$(printf '%s\n' "$out" | grep -cE '^ *ok [0-9]+ - indent-strip: mutant ')" -ge 9 ] && echo PASS-E2` · red at base: TRIAL-5
  3. The auditor card and `DISPOSITION_RULE_CLAUSE` define `findingClass` and the slice-pin rule, byte-mirrored. A behavior `note` with a fix becomes `absorb`, one with no fix becomes a parked ask, and neither stays a note. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: class' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: class' && echo PASS-E3` · red at base: TRIAL-4
  4. A gate-audit Critical or Major with a non-blank `suggested_fix` goes to the late-fix pass. An approved fix lands with `fixRounds` counted. A fix-less one keeps the `gate-evidence` hold. A fixture replays AutoIndex f65e7e37. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: gate-audit' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: gate-audit' && echo PASS-E4` · red at base: TRIAL-4
  5. If the late-fix cap runs out on the final phase, the phase holds as `held:escalation` with reason `late-defect`. On a non-final phase it lands and returns `carriedTasks[]`. Both mirrors carry `late-defect`. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='late-defect: hold' skills/war/assets/land-decision.test.mjs 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: hold' && echo PASS-E5` · red at base: TRIAL-4
  6. Before the late-fix pass, every behavior row is sorted (PIN-21): a row on a stacked-owned or unowned file joins the pass and is not filed, a row on a parallel-owned, task-owned or release-slot file demotes with a stated reason, and a cosmetic row on a stacked-owned file still demotes `demote:exclusion-set`. A behavior row first raised by the sweep or terminal seat carries on a non-final phase, or is filed with the reason "raised after the late-fix pass" on the final phase. A fixture replays Aligned t5-2. The `sweep-exclusion.md` one-liner emits `mode: 'stacked'` (PIN-22), bound by a doc-contract row. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: exclusion' skills/war/assets/skill-doc-contracts.test.mjs 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: exclusion mode doc' && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: exclusion t5-2' && echo PASS-E6` · red at base: TRIAL-5
  7. A red ace gate runs the gate once at the pre-ace tip. A red whose failing ids are all red there counts as green, and a new id still reverts. A fixture replays AutoIndex record-split. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: ace base' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: ace base' && echo PASS-E7` · red at base: TRIAL-4
  8. On a regressed ace re-audit, the pre-ace probe answers per blocker. Yes keeps the absorbs and sends the blocker to the late-fix pass. No reverts as today. Unknown reverts and still sends the blocker to the late-fix pass. A fixture replays Obelisks t1. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: probe' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: probe' && echo PASS-E8` · red at base: TRIAL-4
  9. A `baseline` red becomes one behavior late-defect row per run, an `environment` red stays a backstop, and the polish worker prompt carries the debt list. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: baseline' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: baseline' && echo PASS-E9` · red at base: TRIAL-4
  10. `args.seededTasks` is validated at entry and turns each row into a task. A row whose file another task owns joins that task's slice. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: carry' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: carry' && echo PASS-E10` · red at base: TRIAL-4
  11. `/war` doctrine states the objective, threads `carriedTasks` as `args.seededTasks`, and halts the DAG advance on a behavior follow-up until the Lead rules fix-now or accept-with-reason. · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: doctrine' skills/war/assets/skill-doc-contracts.test.mjs) && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: doctrine' && echo PASS-E11` · red at base: TRIAL-4
  12. A resolved null at the `aceBisect` subset and re-entry dispatch sites is labeled `env-died`, and a non-infra throw still rethrows HARD (PIN-23). · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: bisect guard' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: bisect guard' && echo PASS-E12` · red at base: TRIAL-4
  13. The repository gate is green at the final tip. · gate: `node skills/war/assets/repo-gate.mjs` · red at base: n/a, a gate row is green at base by design
  14. The release moves all four version slots to the next free patch above the live base. · check: `node --test skills/war/assets/version-slots.test.mjs && node -e "const v=require('./.claude-plugin/plugin.json').version.split('.').map(Number),b=[0,21,35];const gt=v[0]!==b[0]?v[0]>b[0]:v[1]!==b[1]?v[1]>b[1]:v[2]>b[2];process.stdout.write(gt?'PASS-E14':'RED-E14')" | grep -qx PASS-E14 && echo PASS-E14` · red at base: TRIAL-5
  15. Each late-fix commit carries `Late-Fix: <task id>:<n>`. A relaunch after a late fix rebuilds the origin task's `fixRounds` from it, and `task-integrated.sh` still proves the origin task merged (PIN-25). · check: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: charge' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: charge' && bash skills/war/assets/task-integrated.test.sh && echo PASS-E15` · red at base: TRIAL-5

## Build order (for /war)

Phase 1 (template room) → Phase 2 (finding class) → Phase 3 (late-fix pass, gate-audit route, hold) → Phase 4 (sweep-side routing) → Phase 5 (ace base, probe, baseline reds, bisect guard) → Phase 6 (carry intake and Lead doctrine) → Phase 7 (release). Every phase from 2 to 6 holds one template task, so the phases run in order. Phase 1 lands first because every later engine phase needs its room.

Audit rosters (Lead picks each seat's rung at decompose, ADR 0056): engine tasks (1.1, 3.1, 4.1, 5.1, 6.1) take `correctness` and `cascading-impact` on the high rung (opus) plus `test-fidelity` on the low rung. Doc tasks (6.2, 7.1) take `plan-faithfulness` on the low rung (sonnet). Task 2.1 edits the auditor card and a dispatched prompt, so its seats run high.

## Phase 1 — Room in the staged template

### Task 1.1: Strip leading indent outside literals, and prove it four ways
- Files: `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`, `skills/war/references/staged-script.md`
- Plan slice: extend `stripFullLineComments`' scanner (PIN-16) so a line that starts in the top-level `code` frame loses its leading spaces and tabs. A line that starts inside a string continuation, a template literal, a `${}` body or a block comment keeps every byte. Every line survives (PIN-17). Add test rows named `indent-strip: …` for: the line-for-line oracle (each changed line equals its original with only leading whitespace removed), the prompt-byte oracle over every `pt` span and every plain template literal, idempotence, `node --check`, the unchanged fallback-free interpolation census, the `NAME_ANCHOR` / `ARGS_FALLBACK_ANCHOR` substitutions on the staged form, and fixture arms for each scanner branch. Add the committed `indent-strip: mutant <branch>` rows of End state 2 (PIN-26). In `workflow-template.test-harness.mjs`, keep the exported `src` raw for source-reading tests and run the template from `stripFullLineComments(src)` when `WAR_TEMPLATE_STRIPPED=1`, with an `indent-strip: harness runs the staged form` row. Prefer making the harness extraction helpers accept zero indent. At base a prototype found 30 stripped-form failures (21 need comments, 9 need indent), all source-shape tests. Any test that still cannot pass joins a closed census, skips under the flag, and gets an `indent-strip: census …` row proving it fails on the staged form. Prove each new row red before the fix. Record the measured room after the strip in `staged-script.md`'s strip paragraph as a dated snapshot that names the measuring command.
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='^indent-strip: ' skills/war/assets/stage-workflow.test.mjs) && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - indent-strip: ' && WAR_TEMPLATE_STRIPPED=1 node --test 'skills/war/assets/workflow-template.*.test.mjs' && echo PASS-E1`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Finding class and the slice-pin rule

### Task 2.1: `findingClass` on the card, the dispatched prompt and intake
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`, `agents/war-auditor.md`, `skills/war/references/finding-class.md`, `skills/war/references/schemas.md`, `skills/war/assets/workflow-template.late-defect-1.test.mjs`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`
- Plan slice: add `FINDING_CLASSES = ['behavior', 'cosmetic']` as a canonical export in `land-decision.mjs`, its inline mirror in the template, and its mirror-registry row in `workflow-template.engine-1.test.mjs` (PIN-24). Add `findingClass` to the finding shape in `AUDIT_VERDICT` (its enum fed by the mirror) and to `normalizeFinding` (PIN-7). Rewrite the card's § Latitude and disposition and `DISPOSITION_RULE_CLAUSE` together, byte-mirrored: set the class on each Minor and Nit, and a behavior defect the task adds stays a finding even when the slice pins the mechanism, routed as `absorb` or `ask`, never `note` (PIN-2). Extend `intakeFloor`: a behavior `note` with a fix becomes `absorb` (in the diff, the task's ace, outside it, `phaseClose`), and one with no fix goes to `parkAsk`. A finding with no class keeps today's route. Fund the card text by moving cold card prose byte-identical to `skills/war/references/finding-class.md` with a `when <trigger>, read references/finding-class.md` pointer (ADR 0042), and register the new file in the references placement census and the link-integrity test. Document the field in `schemas.md` by pointing at the export, never by listing the values. Register the new topic test file in `war-config.test.mjs`'s `EXPECTED_MJES`. Tests named `late-defect: class …`; read the harness header first.
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: class' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: class' && echo PASS-E3`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — The late-fix pass, the gate-audit route and the hold

### Task 3.1: Late-fix pass, gate-audit Major route, `late-defect` hold, `carriedTasks[]`
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`, `skills/war/assets/war-config.test.mjs`, `agents/war-refiner.md`, `skills/war/references/late-fix-pass.md`, `skills/war/references/schemas.md`, `skills/war/references/fix-round-doctrine.md`, `skills/war/references/refiner-recovery.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/assets/task-integrated.sh`, `skills/war/assets/task-integrated.test.sh`, `skills/war/assets/workflow-template.late-defect-2.test.mjs`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`
- Plan slice: add the late-fix pass (PIN-13) after the post-merge gate-audit and before `hardEscalation` and `landDecision` are computed. Its queue holds late defects, each tied to its origin task. A defect raised by the integrated-tip or end-state-only seat belongs to the task whose `Files:` hold its file, else to the lowest-id merged task of the phase. Per defect, the refiner cuts a late-fix worktree at the integrated tip, a `spawnWorker('fix')` worker commits with `FIX_ROUND_DOCTRINE_CLAUSE`, `FIX_ROUND_SCOPE_CLAUSE` and `fixRoundFenceClause` (no chain clause), the gate runs, the origin task's roster re-audits at the new tip, and the refiner fast-forwards the branch in `_refinery`. Each late-fix commit carries the trailer `Late-Fix: <task id>:<n>` (PIN-25), and each fix charges the origin task's `fixRounds` (PIN-8). A relaunch rebuilds `fixRounds` from the highest `n` on first-parent single-parent commits after the task's merge commit. Extend `task-integrated.sh`'s owned-path rule to accept a single-parent commit whose `Late-Fix` trailer names the task, with a `task-integrated.test.sh` case, and explain the shape in the resume Class C table and `refiner-recovery.md`. Loop until unanimous approve or `fixRounds >= roundLimit`. At the cap, drop the branch (the pre-fix tip lands) and route the defect: on a non-final phase, one row in the new top-level `carriedTasks[]` return; on the final phase, `escalated.push({ task, reason: 'late-defect', fixRounds, detail })` (PIN-20). Add `late-defect` to `HARD_ESCALATION_REASONS` in `land-decision.mjs` and its template mirror in this commit, with the drift guards. `KNOWN_LAND_DECISIONS` and `DEMOTE_REASONS` do not change. Route the gate-audit pass (PIN-5): a Critical or Major with a non-blank `suggested_fix` joins the late-fix queue instead of `escalated.push({ reason: 'gate-evidence' })`. A fix-less one, or an `escalate` verdict, keeps the `gate-evidence` hold. The integrated-tip and end-state-only seats follow the same rule. Register the late-fix build in the harness fix-applying builds list and in `fix-round-doctrine.md`'s list of builds. Add the late-fix worktree kind to the refiner card and its dispatched provision prompt in one commit, funded by an eviction to `late-fix-pass.md` if the card is short, and register that file in the placement census and link-integrity test. Document `carriedTasks[]`, the hold, the trailer and the pass in `schemas.md`, pointing at `land-decision.mjs` for the reason list. Register the topic test file in `EXPECTED_MJES`. Tests named `late-defect: gate-audit …` (a replay of f65e7e37), `late-defect: hold …` (both phase arms) and `late-defect: charge …` (a relaunch recovers the charge).
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='late-defect: (gate-audit|hold|charge)' skills/war/assets/land-decision.test.mjs 'skills/war/assets/workflow-template.*.test.mjs') && for n in gate-audit hold charge; do printf '%s\n' "$out" | grep -qE "^ *ok [0-9]+ - late-defect: $n" || exit 1; done && bash skills/war/assets/task-integrated.test.sh && echo PASS-T31`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Sweep-side behavior routing

### Task 4.1: Behavior rows leave the sweep's demote and discard arms
- Files: `skills/war/assets/workflow-template.js`, `skills/war/references/sweep-exclusion.md`, `skills/war/references/schemas.md`, `skills/war/references/disposition-eligibility.md`, `skills/war/references/backward-chain-examples.md`, `CONTEXT.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/workflow-template.late-defect-3.test.mjs`
- Plan slice: before the late-fix pass and before the land decision, sort every `behavior` row in `phaseCloseQueue` (PIN-21). A row whose file a `sweepExclude` entry with `mode: 'stacked'` owns, or that no entry, unsucceeded task or release slot owns, joins the late-fix queue (PIN-19). A row on a parallel-owned, task-owned or release-slot file demotes with a reason that names why it cannot be fixed here. An absent mode reads `parallel`, and entry validation refuses a `mode` outside `stacked` and `parallel`. The sweep then receives cosmetic rows and rows with no class only, so today's sweep routes are unchanged for them. A `behavior` row first raised by the sweep's re-audit or the terminal seat carries as a `carriedTasks[]` row on a non-final phase, or is filed on the final phase with the reason "raised after the late-fix pass". ADR 0012's never-hold rule stands. `DEMOTE_REASONS` does not change: the new reasons ride the existing `exclusion-set`, `sweep-discarded` and `terminal-pass` prefixes. Update the `sweep-exclusion.md` one-liner to emit `mode: 'stacked'` on every ledger entry (PIN-22), and the entry-shape pin in `skill-doc-contracts.test.mjs`, with a `late-defect: exclusion mode doc` row that reds if the one-liner drops `mode`. Update the `sweepExclude` row in `schemas.md`, the Exclusion set and Terminal pass entries in `CONTEXT.md`, item 1 of `disposition-eligibility.md`, and the sibling-owned example in `backward-chain-examples.md` so a behavior row on a stacked-owned file is never taught as a note. Register the topic test file in `EXPECTED_MJES`. Engine tests named `late-defect: exclusion …`, including `late-defect: exclusion t5-2` (a replay of Aligned t5-2) and a cosmetic row on the same file that still demotes.
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: exclusion' skills/war/assets/skill-doc-contracts.test.mjs 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: exclusion mode doc' && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: exclusion t5-2' && echo PASS-E6`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 5 — The ace stops blaming itself for what was there before

### Task 5.1: Ace base gate, pre-ace probe, baseline reds, polish debt list, bisect guard
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `agents/war-auditor.md`, `skills/war/references/finding-class.md`, `skills/war/references/schemas.md`, `skills/war/assets/workflow-template.late-defect-4.test.mjs`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: (a) The ace gate check returns `gate_failing_ids` on red. On a red, `aceGateGreen` runs one gate check at the pre-ace tip (`preAce` / `ev.pre`), cached per pre-ace sha, so subsets and re-entry reuse it. Red ids that are all in the base set count as green for the revert decision, and the log names the proceed-over. Any new id keeps today's forward-revert (PIN-10, PIN-4). A dead base dispatch keeps today's red arm. Refiner card and dispatched prompt change together. (b) On a regressed ace re-audit, before `aceBisect` names culprits and before the multi-commit range revert, dispatch one read-only pre-ace probe seat per blocker at the pre-ace tip, returning `{ exists: 'yes' | 'no' | 'unknown', evidence }` (PIN-11). Yes: keep the absorbs, record the seats as approving that blocker for the batch, and queue the blocker as a late defect (PIN-3). No: today's arms. Unknown or dead: today's revert, and the blocker still joins the late-fix queue as `behavior`. ADR 0054's whole-range rule applies only to blockers the probe did not clear. The auditor card gets a one-line pointer to the probe rules in `finding-class.md`, funded by the Phase 2 eviction. (c) When a per-task merge records a `baseline` class, queue one `behavior` late defect per run for those ids (PIN-12). A `baseline` class first recorded at the land gate runs after the late-fix pass, so it carries as a `carriedTasks[]` row on a non-final phase, or is filed on the final phase with the reason "found at the land gate after the late-fix pass". An `environment` class keeps its backstop. Thread the existing `debtList` / `namedDebt` helpers into the `PHASE-CLOSE COHERENCE SWEEP` and `TERMINAL PASS` worker prompts, so a known red never blocks the sweep worker. The polish and terminal merges already carry `sweepDebtClause` and stay as they are. (d) At the `aceBisect` subset and re-entry dispatch sites, which already run through `dispatchSite`, label a resolved null `env-died` instead of "worker returned no result". A non-infra throw still rethrows HARD per the D21 header (PIN-14, PIN-23). Register any new dispatch labels in the engine-1 and harness label lists, and the topic test file in `EXPECTED_MJES`. Tests named `late-defect: ace base …` (a record-split replay with a standing docker red), `late-defect: probe …` (an Obelisks replay with all three answers), `late-defect: baseline …` and `late-defect: bisect guard …`.
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: (ace base|probe|baseline|bisect guard)' 'skills/war/assets/workflow-template.*.test.mjs') && for n in 'ace base' probe baseline 'bisect guard'; do printf '%s\n' "$out" | grep -qE "^ *ok [0-9]+ - late-defect: $n" || exit 1; done && echo PASS-T51`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 6 — Carry intake and Lead doctrine

### Task 6.1: `args.seededTasks` entry check, task synthesis and collision fold
- Files: `skills/war/assets/workflow-template.js`, `skills/war/references/schemas.md`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/workflow-template.late-defect-5.test.mjs`
- Plan slice: validate `args.seededTasks` at entry the way `args.seededPhaseClose` is validated (row shape, the #1413 provenance floor, a refused row holds at entry with zero spawns). Each row carries the defect, its fix text, its file, its origin task and its class. The engine turns each row into one task: `Files:` is the defect's file, the slice is the defect and its fix, `requiresTest: true`, and the roster is the origin task's roster. If another task in the phase owns the file, the defect joins that task's slice as a carried defect instead, so the phase stays file-disjoint (PIN-9). A seeded task that runs out of rounds follows Phase 3's cap rule. Document the seed and the row shape in `schemas.md`. Register the topic test file in `EXPECTED_MJES`. Tests named `late-defect: carry …`, including the round trip from a `carriedTasks[]` return to a seeded task.
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: carry' 'skills/war/assets/workflow-template.*.test.mjs') && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: carry' && echo PASS-E10`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 6.2: The objective, the carry thread and the follow-up floor in `/war` doctrine
- Files: `skills/war/SKILL.md`, `skills/war/references/late-defects.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`, `CONTEXT.md`, `docs/adr/0058-late-defects-are-fixed-in-the-run.md`
- Plan slice: state the objective in `/war` doctrine (PIN-1). Thread the prior phase's `carriedTasks` as `args.seededTasks` at every launch, next to the `seededPhaseClose` sentence. Extend the follow-up filing floor: a `behavior` row in `handoff.followUps[]` halts the DAG advance until the Lead rules fix-now (a seeded task) or accept-with-a-written-reason; a non-null `issue` alone no longer passes for it. Keep SKILL.md under its hard line by placing the detail in `references/late-defects.md` behind a trigger pointer. Give each surface that still teaches a behavior `note` as informational the behavior carve-out (the disposition sentences in `SKILL.md`, `design.md`, `gastown-design-params.md` and `CONTEXT.md`), with OLD-absent rows. Register `late-defects.md` in the placement census and link-integrity test. Add the glossary terms from this plan to `CONTEXT.md`, pointing at `land-decision.mjs` for `FINDING_CLASSES` and the reason list. Write ADR 0058, which amends ADR 0012, 0013, 0026 and 0054 by reference. Tests named `late-defect: doctrine …` bind the objective, the thread and the floor sentences, and assert the old "non-null `issue`" floor no longer covers a behavior row.
- Done when: `out=$(node --test --test-reporter=tap --test-name-pattern='^late-defect: doctrine' skills/war/assets/skill-doc-contracts.test.mjs) && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - late-defect: doctrine' && echo PASS-E11`
- requiresTest: true
- requiresPackaging: false
- deps: [6.1]
- target repo: superproject

## Phase 7 — Release

### Task 7.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: move all four slots to the next free patch above the live base. The README `## Status` block stays a byte twin of the CHANGELOG lead entry. The entry names the late-fix pass, the finding class, the ace base gate, the pre-ace probe, the carry route and the stronger strip, and counts nothing it does not enumerate.
- Done when: `node --test skills/war/assets/version-slots.test.mjs && node -e "const v=require('./.claude-plugin/plugin.json').version.split('.').map(Number),b=[0,21,35];const gt=v[0]!==b[0]?v[0]>b[0]:v[1]!==b[1]?v[1]>b[1]:v[2]>b[2];process.stdout.write(gt?'PASS-E14':'RED-E14')" | grep -qx PASS-E14 && echo PASS-E14`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The first live `/war` dispatch of an indent-stripped staged script runs in the Workflow tool · why deferred: the gate cannot run the Workflow tool · runner: the Lead, at the first phase launch on the release, confirms the staged script dispatched and its first agent spawned.
- A live late-fix pass on a real late defect, with its `fixRounds` charge and its land or carry · why deferred: needs a field run that finds a late defect · runner: `/war-review` of the first run on the release that reports a late defect.
- A live pre-ace probe on a regressed ace re-audit · why deferred: needs a field regression · runner: `/war-review` of the first `--ace` run on the release that regresses an ace.

## Notes / conscious deviations

- Task 1.1 lands before any engine phase, so the engine phases measure their room on the stripped form.
- Task 3.1 is large because the pass, the gate-audit route, the hold and both enum mirrors share `workflow-template.js` and the mirror rule keeps them in one commit.
- Phase 5 runs after Phases 3 and 4 because its arms route into the late-fix queue they build.
- `findingClass` is a new name beside the existing escalation-only `defectClass: 'plan'` metadata, so the two never collide.
- Red-team round 1 moved the behavior-row sort ahead of the late-fix pass (PIN-21), so End state 6 replaces its first wording, and End state 2 is now a committed check (PIN-26).

## Open decisions

None.
