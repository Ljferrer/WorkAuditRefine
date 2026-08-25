# Authoring-side verification — verifier seat, run-history recon, ratified-pin ledger, prefetch (+ 11-issue wrap)

## Context — the gap / problem

During the `/war-strategy` interview for #1547, an external reviewer session falsified subtle-but-load-bearing
errors in six consecutive `Recommended:` beats; the interview's two recon subagents (~300k output tokens) made
zero reads outside the plugin worktree, and three operator-ratified pins leaked between beats of the single
interview (verified: issue #1548 (2026-08-20)). The interviewer is the one seat in the pipeline with no
adversarial counterweight, and ADR 0044's bare-assent rule makes the operator's cheapest action "accept"
(verified: `docs/adr/0044-authoring-contract-and-merged-artifact.md` at `9b5a80c`). Prior art riding this
record: run manifests in the recon corpus carry placeholder timestamps that render as plausible values
(verified: issue #1331 (2026-08-05)); an id channel defined without a lexical form or join key goes vacuous
(verified: issue #1333 (2026-08-05)); an independently evolved contract inventory — stable ids + owner +
reconciliation-at-a-gate — converges on the pin-ledger shape (verified: Leonxlnx/unlazy `templates/PLAN.md`
at `da0b00a3a6b7`) — cited as convergence evidence only, never efficacy (its own doctrine disavows its
headline claim).

This plan's interview is the first field trial of its own mechanisms and is part of the incident record: it
ran the run-history recon lane (95-open-issue sweep + per-candidate liveness verification at `9b5a80c`), kept
the ratified-pin ledger below, and its verification falsified two in-flight claims — the interviewer's own
"all six catches arm" citation (false against the incident table: beats 3 and 5 do not arm under the two-arm
draft) and a reviewer-asserted join-executor ("the coverage lens already reads the issue" — false for merged
self-sourced plans, `skills/red-team/references/lenses.md` at `9b5a80c`). Echo-back 1 shipped four
duty/fence-class pin leaks, caught by operator reconciliation; **echo-back 2 shipped with zero leaks under
the ledger machinery — the field trial is its own before/after** (user).

Wrapped defects, each liveness-verified at `9b5a80c` (verified: tip greps, 2026-08-24): #1494, #1498, #1503,
#1505, #1510, #1601 (guard half only — the "rules 5–8" literal is already correct), #1602, #1603, #1604,
#1605, plus #1628's three absorptions. #1408 was verified already fixed in both halves
(`skills/war/SKILL.md:66` states the JSONL format citing #1408; `war-memory.mjs` exits with a per-line
usage error) — it closes with an evidence comment at land, never a task.

## Pivotal constraints

- **Extraction surfaces untouched**: no new required H2, both intent headings recognized, per-task fields
  stay separate bullets — the ADR 0044 extraction-compatibility hard bound.
- **Engine fence**: exactly one engine surface moves — the filing-prompt addition in
  `workflow-template.js` (PIN-14); nothing else in that file.
- Both shell pin suites stay bash-3.2-safe and cwd-independent.
- `plan-literal-lint.mjs` stays exit-0 report-only by default (ADR 0044 ratified posture).
- Fail-open throughout: a missing corpus, CLI, gh auth, or Node < 24 never blocks an interview.
- All tasks superproject; no packaging.

## Resolved design tree

Rows carry the interview's ratified-pin ids (`PIN-<n>`) and a landing class per the ledger law this plan
itself lands (D1). Duty-class rows are marked ‡ (read twice at echo-back reconciliation, PIN-25).

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Pin-ledger form | design-tree rows; `PIN-<n>` token (non-substring join key); landing-class column; section-scoped advisory lint, anywhere-citation fallback for class-less pins | (user) · PIN-3 | guardrail + slice (T1.1, T1.3) |
| D2 ‡ | Lint/gate contradiction | inseparable pair: lint exit-0 report-only ↔ gate-1 hard enumerate-aloud over pin-rule and Evidence-consumed gaps, fix-or-waive on the record before the confirm counts | (user) · PIN-16 | guardrail |
| D3 | Verifier arming rule | "arm any beat whose wrong branch surfaces only at run time"; four arms: engine-semantics change (merge/resume/audit/budget/filing) · mechanism floored into guardrails · decomposition/skeleton beat (always, on engine-target plans) · placing or explicitly declining an enforcement layer | (user) · PIN-5 | guardrail + slice (T1.2) |
| D4 ‡ | Charter home | `skills/war-strategy/references/strategy-verifier.md`; war-machine grill consumption is a required deliverable (pointer + presence pin) — both authoring paths consume | (user) · PIN-6, PIN-17 | guardrail + slice (T1.2, T2.4) |
| D5 | Refute flow | successful refutation ⇒ amend + re-arm once (bounded); unresolved refute ⇒ live fork in the beat — never dropped, never looping | (user) · PIN-7 | guardrail + slice (T1.2) |
| D6 ‡ | Degraded modes | three stamps, inline on the armed beat: `verifier: corpus-empty — doctrine-only refutation` · corpus-partial naming the missing classes inline · `verifier: unavailable (<reason>)` on dispatch failure | (user) · PIN-4, PIN-8 | guardrail + slice (T1.2) |
| D7 ‡ | Skip posture | armed-by-rule, dispatch-without-asking; skips are operator utterances anytime, incl. class-scoped standing skips (scope + reason), all enumerated at gate 1; recorded as `WAIVE-<n>` in the fix-or-waive channel (`PIN-` prefix carries join keys only); each waive records the arming arm that fired; AFK runs armed-by-rule unwaived | (user) · PIN-22, PIN-23, PIN-24 | guardrail + slice (T1.2) + backstop row 1 |
| D8 ‡ | Evidence recon | mandatory third Stage-0 class (run manifests · epic phase reports · war-followup corpus · `docs/learnings/` · issue-linked artifacts); artifact-borne **Evidence consumed** block (placement latitude, never a new H2), read / unread-with-reason per linked artifact; doctrine gains the verbatim principle: "state that must survive to a gate lands in the artifact, not the transcript" | (user) · PIN-13 | guardrail + slice (T1.1) |
| D9 | Lens join | `coverage-vs-source` merged arm joins the Evidence-consumed block against each cited source issue's `## Evidence artifacts` section; section-absent ⇒ vacuous; issue-unreachable (gh/network/auth, incl. exogenous account flip) ⇒ named unverified note, never silent | (user) · PIN-13a | slice (T2.1) |
| D10 | Issue-side duty homes | normative home is the skill surfaces (issue authors don't read ADRs): `/survey-corps` synthesis template + the war-followup filing dispatch (duty-bearing producer, in-plan task) | (user) · PIN-11, PIN-14 | slice (T2.2, T3.2) |
| D11 | Decision record | dated amendment to ADR 0044, heading token `authoring-side verification`; one-line ADR 0014 cross-ref; residual recorded narrowed (read-without-comprehension; verifier partial net on armed beats) | (user) · PIN-9, PIN-10, PIN-15 | slice (T3.1) |
| D12 | Wrap set | 10 live issues + #1628 (omittability probe · oracle-duality bullet + advisory single-signal-oracle lint · contract-inventory prior-art line); #1408 closes with evidence comment | (user) · PIN-2, PIN-12 | slice (T1.1, T1.3, T2.3, T2.4) + Notes |
| D13 ‡ | Duty-pin law | every floored duty sentence lands lock-step with its own presence pin — ADR 0025 extended from literals to duties | (user) · PIN-18 | guardrail |
| D14 | Charter leak shapes | the checklist records: half-floored pair · ratified-but-homeless deliverable · unvalidated join-executor claim; duty-class pins are the twice-read class at echo-back reconciliation | (user) · PIN-19, PIN-21, PIN-25 | slice (T1.2) |
| D15 | Budget ruling | war-strategy surfaces stay unbudgeted **by decision** (zero rows in `prompt-surface-budgets.test.mjs`, verified at `9b5a80c`); budgeting, if ever, rides #1586 | (user) · PIN-20 | non-goal |
| D16 | Prefetch form | batched `--queries` JSONL mirroring the /war Lead's flag discipline (`--local` always, `--repo` when resolved, fail-open), one query per interview area | [assumed: one corpus walk + one pinnable literal, exercising the #1408-hardened path — if wrong: N plain queries, same task shape] | slice (T1.1) |
| D17 | Interview provenance | this plan authored by the bare-invoke `/war-strategy` interview in-skill (session of 2026-08-24), Grill Me front door declined | (user) · PIN-1 | context |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Batched JSONL prefetch is the right interviewer form | mirrors `skills/war/SKILL.md` Lead prefetch; #1408-hardened | rewrite one doctrine step + one pin to N plain queries | End state 1's suite run |
| A2 | A doctrine-file absence helper is expressible bash-3.2-safe in the war-strategy suite | the suite already bakes per-file helpers; the motivating campaign's own `mapfile` incident is the precedent for what bash-3.2 rejects | #1601's guard hosts in the war-machine suite instead (granted latitude) | End state 3's suite run |
| A3 | The interviewer context can dispatch a read-only verifier agent | interactive Claude Code sessions carry the Agent tool | degraded stamp `verifier: unavailable (<reason>)` fires — visible, fail-open | End state 2's charter pins |
| A4 | The four-arm arming rule is right-sized beyond the motivating incident | incident table maps all six catches to armed beats under the final four-arm rule | skip-rate-per-arm telemetry shows a consistently-skipped arm ⇒ narrow the checklist | backstop row 1 |

## Non-goals / deferred

- The war-strategy surfaces stay unbudgeted by decision (D15); if budgeting ever lands it rides #1586's
  budget-maintenance machinery, not this plan.
- No fail-closed authoring lint; no change to ADR 0044's bare-assent rule, question budget, or
  one-interview-one-artifact contract.
- #1550 (`ask` disposition) untouched — run-time channel, composes but shares no mechanism.
- No adoption of the unlazy skill, its ledger formats, checker, or Stop hook (verified: issue #1628 (2026-08-24)).
- #1408 is closed with an evidence comment at land — verified already fixed, never a task.

## New domain terms · Recommended ADRs

Terms for CONTEXT.md (Task 2.3): **strategy-verifier seat** · **run-history recon lane** ·
**ratified-pin ledger** (`PIN-<n>`) · **Evidence-artifacts duty** · **Evidence consumed block** ·
**WAIVE channel** · **omittability probe** · **oracle duality**.

Recommended ADRs: no new number — a dated amendment to ADR 0044 with the stable citation token
`authoring-side verification`, plus a one-line cross-reference amendment on ADR 0014 (D11).

## Commander's Intent

- **Purpose:** the `/war-strategy` interviewer's recommendations get the same adversarial counterweight
  every other WAR seat already has, and ratified interview state stops leaking between beats and gates.
- **Method:** thread memory prefetch and a run-history recon lane into Stage 0; make ratified state
  artifact-borne (design-tree pin rows, the Evidence-consumed block); dispatch a chartered strategy-verifier
  on armed beats with bounded refute flow and visible degraded modes; reconcile everything at the two
  echo-back gates backed by advisory lint; wrap the eleven ratified issues riding the same surfaces; record
  the contract as an ADR 0044 amendment both authoring paths consume.
- **Mechanism latitude:** the verifier charter's prose and length · the arming checklist's rendering in the
  doctrine · where the `PIN-<n>` id sits within a design-tree row (the landing-class column itself is
  floored) · the #1601 guard's vehicle (new doctrine-file absence helper vs war-machine-suite hosting) ·
  prefetch query composition per interview area · the lint heuristics' exact patterns · Evidence-consumed
  block placement · the filing prompt's exact emission wording — substituting any of these mechanisms while
  the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** the `PIN-<n>` token form and section-scoped lint semantics (PIN-3) · the
  inseparable pair: lint exit-0 report-only ↔ gate-1's hard enumerate-aloud duty over pin-rule and
  Evidence-consumed gaps, fix-or-waive on the record before the confirm counts (PIN-16) · the four-arm
  arming principle sentence and its enumeration (PIN-5) · refute flow bounds — amend + re-arm once,
  unresolved = live fork (PIN-7) · the three inline degraded-mode stamps: `corpus-empty`, corpus-partial
  naming missing classes inline, `unavailable (<reason>)` (PIN-4/8) · the artifact-borne-state principle,
  landed verbatim with its own pin: "state that must survive to a gate lands in the artifact, not the
  transcript" (PIN-13) · the Evidence-consumed block is never a new required H2; extraction surfaces and
  both intent headings untouched · ADR homes: 0044 amendment with the `authoring-side verification` token +
  0014 cross-ref (PIN-9/10/11) · the AFK-path consumption deliverable: war-machine grill charter pointer +
  presence pin (PIN-17) · `WAIVE-<n>` is the skip token; the `PIN-` prefix carries reconciliation join keys
  only; AFK runs armed-by-rule unwaived (PIN-22/23) · every floored duty sentence lands lock-step with its
  own presence pin (PIN-18) · fail-open posture throughout · **the engine footprint is exactly one surface:
  the filing-prompt addition (PIN-14) — nothing else in `workflow-template.js` moves.**
- **End state:**
  1. `plan-interview.md` carries the run-history recon lane (all four corpus classes + issue-linked
     artifacts), the batched prefetch step (old single-query literal asserted absent), the ratified-pin
     ledger law (`PIN-<n>` token, landing-class column, `WAIVE-<n>` channel, the gate-1 pair duty), the
     omittability probe in the Stage-1 falsifier list and the Stage-4 sweep, the verbatim principle
     sentence, and the verifier trigger pointer + arming principle — each duty sentence pinned ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh`
  2. `references/strategy-verifier.md` exists with the four arms, refute bounds, the three degraded stamps,
     the three leak shapes + duty-class twice-read rule, WAIVE semantics with arm recording, and the
     explicit AFK-unwaived statement — content-pinned ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh`
  3. `skills/war-strategy/SKILL.md`: #1494 fence fix, #1503 banner currency, #1505 HANDOFF latitude beat,
     #1602 trichotomy pins, #1604 gap-review pin, #1628 oracle-duality bullet, template-law additions
     (pin-id + landing-class in the design-tree slot), and the #1601 doctrine-side OLD-absent guard ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh`
  4. `plan-literal-lint.mjs` gains three advisory rules (section-scoped pin citation with anywhere
     fallback, Evidence-consumed form, single-signal oracle), exit 0 by default; its tests cite the floored
     `PIN-<n>` form from this plan's guardrails · check: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`
  5. war-machine: #1510 qualifier fix, #1605 trichotomy pins + honest comment, and the verifier-charter
     consumption pointer with presence pin · check: `bash skills/war-machine/war-pipeline-structure.test.sh`
  6. `lenses.md` merged arm carries the per-issue Evidence join with split absence arms ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh`
  7. CONTEXT.md: #1498 retired connectives asserted absent, #1603 touched-doc term covered, the eight new
     terms present and guarded · check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  8. `skills/survey-corps/SKILL.md` synthesis template carries the `## Evidence artifacts` duty ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh`
  9. The clustered filing prompt emits an `## Evidence artifacts` section (pinned SHA, seat lenses, audit
     round) with a drift row · check: `node --test skills/war/assets/workflow-template.test.mjs`
  10. ADR 0044 amendment present under the `authoring-side verification` token with the narrowed residual
      and the evidence-duty home note; ADR 0014 carries the cross-ref ·
      check: `grep -l 'authoring-side verification' docs/adr/0044-authoring-contract-and-merged-artifact.md docs/adr/0014-ai-commanders-intent.md | wc -l` prints `2`
  11. Release: all four slots + CHANGELOG bumped to the next free **minor** above the live base (expected
      0.19.0 at base `9b5a80c` — dated snapshot per D12, re-resolved at land) ·
      check: `node --test skills/war/assets/version-slots.test.mjs`
  12. At land, #1408 and each wrapped issue are closed, commits citing their issues range-level ·
      check: `gh issue view <n> --json state` per wrapped issue after land

## Build order (for /war)

Phase 1 (war-strategy core) → Phase 2 (cross-surface consumers) → Phase 3 (ADRs + the one engine surface)
→ Phase 4 (release).

## Phase 1 — Doctrine, charter, lint

### Task 1.2: The strategy-verifier charter
- Files: `skills/war-strategy/references/strategy-verifier.md`
- Plan slice: author the charter — the arming principle and four arms (D3); the refute charter ("Refute
  this recommendation… name what breaks on the wrong branch and which existing layer would catch it") with
  the `if wrong: <consequence> · caught by: <layer or NOTHING>` output contract; refute-flow bounds (D5);
  the three inline degraded-mode stamps (D6); WAIVE semantics — operator-utterance skips, class-scoped
  standing skips with scope + reason, arm-recording per waive, gate-1 enumeration, AFK-unwaived (D7); the
  three leak shapes + duty-class twice-read rule (D14), citing this interview's echo-backs as the
  motivating instances.
- Done when: None — content pins land in Task 1.1's suite additions (deps-edged there per rule 7)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Lint rules
- Files: `skills/war-strategy/assets/plan-literal-lint.mjs`, `skills/war-strategy/assets/plan-literal-lint.test.mjs`
- Plan slice: three advisory report-only rules — (a) section-scoped `PIN-<n>` citation (a pin id defined in
  the design tree must appear inside its declared landing-class section; anywhere-citation fallback for
  class-less pins; definition-without-citation reported), (b) Evidence-consumed block form (each linked
  artifact row is read or unread-with-reason), (c) single-signal oracle heuristic (bare `grep -q` /
  `test -f` `check:`/`Done when:` lines flagged for a decisive-token pair, #1628). Exit 0 without
  `--strict`. Tests cite the floored `PIN-<n>` literal from this plan's Binding guardrails so the
  lint↔doctrine pair shares the plan as its common anchor.
- Done when: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.1: Doctrine + SKILL.md + the war-strategy pin suite
- Files: `skills/war-strategy/SKILL.md`, `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: land End states 1–3. Doctrine: Stage-0 run-history recon lane (D8) + batched prefetch (D16,
  replacing the single-query literal — OLD-absent assert on the retired form); Stage-1 omittability probe
  beside delete-the-feature (#1628); Stage-2 verifier trigger pointer (`when a beat arms per the checklist,
  read references/strategy-verifier.md`) + arming principle sentence; pin-ledger law (D1) + `WAIVE-<n>`
  channel (D7) + the gate-1 pair duty (D2) + duty-class twice-read rule (PIN-25); Stage-4 sweep gains the
  omittability sentence and the Evidence-consumed enumeration duty; the verbatim principle sentence (D8).
  SKILL.md: the wrapped fixes #1494/#1503/#1505/#1602/#1604, the §2 oracle-duality bullet, template-law
  additions (pin-id + landing-class columns in the design-tree slot, Evidence-consumed block with placement
  latitude). Suite: lock-step presence pins for every duty sentence above (PIN-18), a doctrine-file absence
  helper (A2; on bash-3.2 failure, host the #1601 guard in the war-machine suite instead — granted
  latitude), charter content pins (a `$CHARTER` file var), banner currency restored (#1503).
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [1.2, 1.3]
- target repo: superproject

## Phase 2 — Cross-surface consumers

### Task 2.1: The lens join
- Files: `skills/red-team/references/lenses.md`
- Plan slice: extend `coverage-vs-source`'s merged arm per D9 — join the plan's Evidence-consumed block
  against each cited source issue's `## Evidence artifacts` section; section-absent ⇒ vacuous (the
  touched-doc-fact-coverage vacuity pattern); issue-unreachable ⇒ named unverified note, never silent,
  never vacuous.
- Done when: None — presence pins land in Task 2.4's suite (deps-edged there per rule 7)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: Survey-corps issue-side duty
- Files: `skills/survey-corps/SKILL.md`
- Plan slice: the issue-synthesis template gains a required `## Evidence artifacts` section (concrete
  paths/URLs the recon lane will read); memory-mined and swept-backlog synthesis both carry it (D10).
- Done when: None — presence pin lands in Task 2.4's suite (deps-edged there per rule 7)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: CONTEXT.md glossary + contracts suite
- Files: `CONTEXT.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: fix #1498 (retire the stale D4/D5 connectives; OLD-absent assert both directions); cover
  #1603 (guard row binding the **Touched-doc accuracy duty** entry to its canonical rule-8 statement); add
  the eight new glossary terms with guard rows; honor the `_Avoid_`-list "not the …" marker convention for
  any don't-confuse entries.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.4: War-machine surface + pipeline pin suite
- Files: `skills/war-machine/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: fix #1510 (re-scope the `under --afk,` qualifier to the AI-declared markers only); fix #1605
  (pin the trichotomy option names; make the coupling comment honest); land the verifier-charter
  consumption pointer in the grill charter + its presence pin (D4, PIN-17); presence pins over Task 2.1's
  lens arm and Task 2.2's Evidence-artifacts section (rule-7 edges); host the #1601 doctrine-side
  OLD-absent guard here iff Task 1.1's A2 assumption failed.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [2.1, 2.2]
- target repo: superproject

## Phase 3 — ADRs + the one engine surface

### Task 3.1: ADR 0044 amendment + ADR 0014 cross-ref
- Files: `docs/adr/0044-authoring-contract-and-merged-artifact.md`, `docs/adr/0014-ai-commanders-intent.md`, `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: dated amendment under the heading token `authoring-side verification` — the four mechanisms,
  the narrowed accepted-residual (read-without-comprehension; verifier as partial net on armed beats —
  the wider compliance residual is closed by the artifact-borne block, PIN-15), and the evidence-duty
  home note (the ADR records the decision; the skill surfaces carry the duty, PIN-11). ADR 0014 gains the
  one-line cross-ref ("authoring-side verification extends to the AFK drafter+grill path; see ADR 0044
  Amendment (2026-08-24)"). Presence pins for both in the pipeline suite (token present in both files).
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3.2: Filing-prompt Evidence-artifacts emission
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: **precondition (mechanical, PIN-14 ordering):** grep the task-base `workflow-template.js` for
  the #1547-landed clustered filing dispatch anchor (the clusters/corroboration filing prompt, #1566);
  absent ⇒ halt and escalate — never edit a pre-#1547 prompt shape. Then: the clustered filing prompt
  additionally instructs each filed issue to carry an `## Evidence artifacts` section — the finding's
  pinned `audit_sha`, file paths, seat lenses, and audit round, all in hand at filing time. Drift row in
  the template test binding the emission clause. No other change to the file (the engine fence).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Release

### Task 4.1: Version bump + changelog
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four slots in lock-step to the next free **minor** above the live integration base
  (expected 0.19.0 at base `9b5a80c`; re-resolve at land — the version-slots monotonic floor is the
  arbiter); replace the README `## Status` blurb in place; append the CHANGELOG entry. Land-time
  bookkeeping (Lead): close #1408 with the evidence comment (both fix halves cited); close each wrapped
  issue as its fix lands, commits citing issues.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Skip-rate per arming arm (`WAIVE-<n>` entries record the fired arm) · why deferred: the correction loop
  is cross-run by construction — a consistently-skipped arm is the measured narrowing signal (PIN-24) ·
  runner: `/war-review`, each pass over runs under a release carrying this plan.

## Notes / conscious deviations

- #1408 is closed, not fixed — both halves verified landed at `9b5a80c`; the close comment cites
  `skills/war/SKILL.md:66` and the `cmdQueriesBatch` usage error.
- The version literal 0.19.0 is an expected resolution, never authoritative — the directive form governs
  (task 4.1); red-team adjudication outranks it if the base moves.
- This plan dogfoods its own law: the design tree above carries `PIN-<n>` ids and landing classes; the
  Evidence-consumed record for its interview is the Context section's verified sweep + liveness reads.
- Echo-back incident record: echo-back 1 leaked four duty/fence-class pins (caught by operator
  reconciliation — the PIN-25 motivating instance); echo-back 2 shipped zero leaks under the ledger
  machinery.

## Open decisions

None.
