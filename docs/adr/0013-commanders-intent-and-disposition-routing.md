# Commander's intent and disposition routing — licensed judgment over plan literalism; issues become affirmative acts

**Status:** accepted (2026-07-02 — design ratified in the clean-handoff review; implemented in `skills/war/assets/workflow-template.js` + the worker/auditor standing files by the clean-handoff plan's Phase 1; amended per the two-homes ruling, Decision 2; amended by [ADR-0014 — AI-Commander's Intent](0014-ai-commanders-intent.md) — Decision 2's never-invents rule gains its single sanctioned exception, the `## AI-Commander's Intent` block `/war-machine --afk` authors; coupled — not amended — by
[ADR-0032](0032-red-team-grades-by-artifact-kind.md) + friction D7 refine the finding-severity model (Decision 4) and
friction D8 adds the auditor-prompt adjudicationClause (Decision 3), noted inline below; amended
2026-08-05 — artifact-first verification and the `unverified` status supersede Decision 6's
judgment-path description for gate-audit End-state checks; see the amendment below; amended
2026-08-17 — the latitude-clause reading clarifies Decision 3: an explicit `Mechanism latitude:`
clause licenses in-band mechanism substitution bounded by the `Binding guardrails:` list; see the
amendment below; amended 2026-08-20 — ace bisection on regression, source-derivable absorb
eligibility, and the roundLimit 3→6 default flip; see the amendment below; amended 2026-08-25 —
the `ask` disposition: a fourth Minor/Nit-only member, the Checkpoint strike-list ruling gate, and
the third adjudication producer; see the amendment below; amended 2026-08-26 — N:1 clustered
filing and dedup-as-corroboration-comment supersede Decision 4's per-finding "files the issue"
description; see the amendment below)

WAR's agents had exactly one yardstick: the plan's literal text. The auditor's plan-faithfulness lens judged
work against the slice ("the plan did not authorize"), severity was the only routing signal (every Minor/Nit
→ a `war-followup` issue), and the ace path's sole enforceable judgment was a filename regex. The v0.9.0 run
made the cost concrete: 9 residual nit-issues from one clean phase, an auditor refusing an obviously-good
test widening, and a one-word doc fix refused because it lived in `README.md`. The military-doctrine framing
the operator supplied (MCDP 1) names the missing piece: intent exists *"to allow subordinates to exercise
judgment and initiative — to depart from the original plan when the unforeseen occurs — in a way that is
consistent with higher commanders' aims."* This ADR records where intent lives, who writes it, and how
findings route once judgment is licensed. Full mechanics:
[the design spec](../specs/2026-07-02-war-clean-handoff-design.md) §4.1–4.3, §4.6–4.7.

## Decision

1. **Intent is plan content.** A required `## Commander's Intent` section — **Purpose** (why), **Method**
   (how the commander envisions winning; the latitude bounds), **End state** (numbered, individually
   *checkable* conditions) — lives in the plan file itself. Intent travels with the order; `/red-team` and
   `/war` already read that file.
2. **Staff may draft; the commander confirms.** MCWP 5-1's verbatim-authorship rule is deliberately relaxed
   for this domain: in combat, personal accountability for lives demands the commander's own words; for
   agent-produced production code, the **operator's approval is the gate, not the operator's keystrokes**.
   The authoring skill (`/war-strategy`'s interview beat) may draft from operator answers and may propose a
   full block — it must echo it back and obtain explicit confirmation (provenance `user-confirmed`) before
   the plan is complete. It never silently invents intent; a `--afk` run with no intent section degrades to
   today's literal behavior rather than running on Lead-invented purpose. *(Amended — the two-homes ruling,
   2026-07-02: the interview beat lives in BOTH `/war-strategy` homes. On a bare invoke it ships as a
   handoff **directive** the downstream authoring skill executes — draft only from operator answers, echo
   the block back, obtain explicit confirmation; in with-artifact convert mode `/war-strategy` authors the
   war-shaped plan itself and runs the intent echo-back **inline**.)*
3. **The plan slice is the floor; the intent is the ceiling.** Threaded as `args.intent` into worker,
   auditor, ace/sweep, gate-audit, and servitor prompts. For auditors: work beyond the literal slice that
   serves the intent is APPROVE (judged on its own correctness), never a plan-faithfulness violation; only
   deviations that contradict intent or slice block. For workers: license to resolve ambiguity toward the
   Purpose, noting the deviation in the result. *(Coupled — the red-team spec's friction D8,
   [ADR-0033](0033-executed-probes-behind-escape-guard.md)'s sibling: `auditPrompt()` gains an
   `adjudicationClause` appended alongside this `intentClause` construct — a guarded-invariant addition, no
   new ADR — so auditor version-scoring keys on task instruction > red-team adjudication > plan body literal;
   mirrored VERBATIM into `agents/war-auditor.md` under the same both-surfaces duty as this decision.)*
4. **Findings route by auditor-owned `disposition`, orthogonal to severity.** `absorb` (mechanical,
   intent-consistent → ace or phase-close sweep; `phaseClose:true` when the fix needs the integrated tip or
   a shared file), `follow-up` (substantive work beyond the phase — must state why it is not absorbable;
   files the issue), `note` (report + servitor feed, never an issue). Defaults when omitted: Minor →
   follow-up, Nit → note; `absorb` is never a default. Critical/Major blocking is untouched. *(Coupled —
   [ADR-0032](0032-red-team-grades-by-artifact-kind.md) refines *what counts as a finding at all* when
   `/red-team` grades a plan against a not-yet-mutated repo: a `deliverableAbsence`-flagged finding is a
   non-defect the red-team gate never blocks on. The red-team spec's friction D7 pins that gate's pass-only
   demotion set with a drift-guard — a guarded-invariant addition to the finding-severity model here, no new
   ADR. This routing/severity model is otherwise unchanged.)*
5. **The ace string backstop narrows to the two pure version-slot JSONs** (`plugin.json`,
   `marketplace.json`) — the only files where a filename alone is sufficient evidence for a sandbox that
   cannot read code. README and other shared files route to the phase-close sweep instead of being refused.
   Version-number literals stay protected by the prompt prohibition + mandatory re-audit + forward-revert/
   discard on every polish path.
6. **End state is verified before land.** The existing post-merge gate-audit pass additionally checks this
   phase's claimed End-state conditions at the confirmed tip: provably unmet → HARD (holds the land);
   anything short of provable → SOFT note. `/red-team` gains an `intent-vs-plan` spine lens grading
   checkability, phase mapping, and sufficiency before any run consumes the intent.

## Considered options

- **A standalone `/commanders-intent` skill (deferred).** The artifact is three blocks of plan prose;
  authorship, storage, and consumption are covered by a template section + an interview beat + two gate
  reads. A dedicated PME-style interview skill remains cheap to add later if the beat proves too thin.
- **Verbatim-only operator authorship (rejected — operator decision).** Correct for combat accountability;
  needless friction here. Approval-as-gate keeps the accountability property that matters (the operator has
  read and owns the intent) without demanding their keystrokes.
- **Severity-only routing, status quo (rejected).** Severity says how bad, not who owns it next; it
  structurally cannot express "fix this now, in-phase" or "record, don't file," which is why 9 observations
  became 9 issues.
- **Dropping the orchestrator's ace backstop entirely, auditor-consent-only (rejected).** One hallucinated
  `absorb` on `plugin.json` could ace a version slot; a deterministic string check the sandbox CAN do stays
  on the two files where filename = proof.
- **Lead-synthesized intent when the section is missing (rejected).** The Lead inventing purpose inverts the
  command relationship; degradation to literal behavior is fail-conservative.

## Consequences

- **Intent quality is load-bearing.** A vague Purpose or uncheckable End state makes every downstream gate
  mushier. Mitigations: the checkability rule at authoring, the red-team lens before any run, Method bounds
  on latitude, and null-intent degrading to current behavior.
- **Issues become affirmative acts.** A `war-followup` issue now exists only because an auditor argued it
  should; nit-litter dies by default-routing, while genuine debt (the CLI-wrapper class) still files.
- **Auditor scope creep risk shifts to the worker.** The latitude rule could license over-building;
  bounded by Method constraints, the audit's correctness lenses (extra work is still judged), and
  plan-slice drift surfacing as notes.
- **One release of dual-reading:** `autoFixable:true` honored as `disposition:'absorb'`, then retired.
- Both standing (.md) and dispatched (template) auditor surfaces change **in the same commit** — the known
  coverage-split trap (memory `standing-instruction-vs-dispatched-prompt-coverage-split`).

## References

- Design spec: [`docs/specs/2026-07-02-war-clean-handoff-design.md`](../specs/2026-07-02-war-clean-handoff-design.md)
  §3 (design tree), §4.1–4.3, §4.6–4.7, §10 criteria 1–3, 7–11.
- [ADR-0012 — Intra-phase visibility and the phase-close sweep](0012-intra-phase-visibility-and-phase-close-sweep.md)
  — the mechanism that consumes `phaseClose`-routed absorb findings.
- MCDP 1 *Warfighting* / MCWP 5-1 *Marine Corps Planning Process* — purpose-method-end-state framing
  (operator-supplied, 2026-07-01 design review).
- Reference run: epics #416/#417, follow-up litter #422 — the 9-finding replay yardstick (spec §10.12).

## Addendum (2026-07-10): the deliberately-unwired marker is an audit-lens finding-class exemption

Decision 4 makes findings route by auditor-owned `disposition`. This addendum records one narrow
finding-class exemption on the auditor's side: a construct whose adjacent `ponytail:` /
`deliberately-unwired:` comment names *why* it is intentionally uncalled (an invariant it documents, a
deliberate ceiling) is **not** a dead-code finding — re-flagging it is out of scope. Absent such a
comment, dead-code findings proceed as usual.

The engine-hardening spec's §7 offered a fork — amend ADR 0002 (scope by `agent_type`) *or* ADR 0013 —
and the operator ratified 0013: the marker is a **lens-calibration** rule (which findings the auditor
raises at all), the disposition model's home, not a capability-confinement rule (ADR 0002's domain). The
convention lives in `agents/war-auditor.md`'s standing card only — a pure lens-calibration clause reaches
every seat including the inline gate-audit passes through the standing surface, so no `auditPrompt()`
mirror is needed (the same standing-surface-only precedent as this ADR's own D7 checklist). See
[ADR-0034 — engine ingest guards & provision exit-code contract](0034-engine-ingest-guards-and-provision-exit-codes.md)
§Decision, whose plan lands this clause. This addendum leaves the ratified body above unchanged.

## Addendum (2026-07-22): a second adjudication producer, and an adjudication-match confirmation-note rule

Decision 3 introduced `adjudicationClause` with one producer: the red-team report's `## Adjudications`
block. This addendum records a second, coequal producer — the Lead's own scope rulings, assembled at
the decompose gate and at held-escalation adjudications and threaded as `args.adjudications` rows per
`skills/war/SKILL.md` — so a ruling the Lead has already made reaches every audit seat instead of being
re-litigated on a later relaunch. The clause also gains a producer-agnostic ADJUDICATION-MATCH sentence:
a finding whose substance matches an adjudicated row is a confirmation note, never an escalation; a
candidate deviating from both the plan and the row is still judged normally. Both are guarded-invariant
widenings of the existing channel — no new ADR — emitted at the roster-seat `auditPrompt()` and, newly,
at the three gate-audit-family prompt sites, and mirrored VERBATIM into `agents/war-auditor.md` under the
same both-surfaces duty as Decision 3. This addendum leaves the ratified body above — including Decision
3's byte-identical version-precedence sentence — unchanged. See
[the design spec](../specs/2026-07-22-audit-adjudication-threading-design.md) §4, §6–§7, §10 criteria 5–8.

## Amendment (2026-08-05): artifact-first End-state verification and the `unverified` status

Decision 6 described the gate-audit End-state check as a judgment pass at the confirmed tip —
"provably unmet → HARD (holds the land); anything short of provable → SOFT note." The precision-chain
plan supersedes that judgment-path description for gate-audit End-state checks:

- **Execution is refiner-side, artifact-first.** A claimed `check:`-tagged End-state condition is
  executed by the land-barrier endstate-check dispatch — once per phase at the integrated tip,
  between serial-merge completion and the gate-audit pass, unconditionally — teeing one artifact per
  condition (`_refinery/.war/endstate-<phaseId>-<n>.log`), each stamped with the tip SHA it ran at.
  Auditors stay read-only ([ADR-0002](0002-scope-by-agent-type.md)): seats read the artifacts, never
  run commands.
- **Attestation is a positive channel.** Every gate-audit-family seat returns one
  `endStateAttestations` row per claimed condition — the condition verbatim, status
  `met` | `unmet` | `unverified`, and the evidence the seat actually read: a `check:`-tagged
  condition from its teed artifact, a `gate:`-tagged condition from the gate evidence as actually
  captured, a judged (untagged) condition from named observables at the confirmed tip.
- **Silence is `unverified`, never `met`.** The handoff End-state status set gains `unverified`: a
  condition no seat attests — or whose artifact is missing, unreadable, or stale (its stamped tip
  SHA mismatching the confirmed tip) — lands `unverified`. Whole-pass absence stays all-`deferred`,
  and findings stay defect-only (attestation rides the rows, never a finding).

Decision 6's severity mapping is unchanged — a provably unmet condition is still HARD and holds the
land — and its second sentence (the `/red-team` `intent-vs-plan` lens) is untouched. What this
amendment retires is the judgment path as the *verification* mechanism for gate-audit End-state
checks: verification is by executed artifact and positive attestation, and a condition NO seat
attests — including one whose artifact is missing, unreadable, or stale — lands the typed
`unverified` status instead of being read as `met` by silence. The defect-only findings channel
keeps its three cases unchanged, including the SOFT cannot-verify note — attestation and findings
are two channels, and the seat records both. Ratified by
[the precision-chain & loop-breaker plan](../plans/2026-08-05-precision-chain-and-loop-breaker.md)
(D2/D8, Tasks 1.2/3.1/3.2; red-team F5/F7, operator-ratified 2026-08-05). This amendment leaves the
ratified body above — beyond the Status currency line — byte-unchanged.

## Amendment (2026-08-17): the latitude-clause reading

Decision 3 made the plan slice the floor and the intent the ceiling, but left the ceiling's shape
implicit: every mechanism a plan slice named read as pinned, so a forced mechanism substitution —
the named idiom cannot work as specced while an equivalent one can — routed as a deviation to
adjudicate or a follow-up issue even when the operator never cared which idiom won. This amendment
records the latitude-clause reading (#1431):

- **Authored intent may enumerate implementer's-choice mechanisms.** The intent block's optional
  `Mechanism latitude:` sub-bullet names the mechanisms that are reference realizations, and its
  paired `Binding guardrails:` sub-bullet names the bounds that stay blocking. The clause is
  authored intent — operator-confirmed per Decision 2, or AI-declared under
  [ADR-0014](0014-ai-commanders-intent.md)'s `--afk` exception, never Lead-invented — offered by
  the authoring surfaces (the merged-plan template, the interview beat, the war-machine drafter
  duty).
- **The guardrails list is the blocking floor.** Both runtime seats read a threaded intent carrying
  an explicit `Mechanism latitude:` clause as licensing in-band mechanism substitution: the worker
  treats a substitution that satisfies the binding guardrails and the End states as in-band work —
  noted in its result, never a follow-up issue; the auditor reads "contradicts the slice" against
  the binding guardrails, not against every pinned mechanism literal in the slice — a substitution
  inside the enumerated latitude that holds the guardrails and End states is APPROVE, never a
  plan-faithfulness finding, while one that breaches a guardrail or an End state blocks exactly as
  before. Both standing cards and their dispatched twins carry the arm under the same
  both-surfaces duty as Decision 3.
- **The clause never waives a check, gate, or backstop**
  ([ADR-0017](0017-packaging-floor-docker-gate-ratified-backstops.md)). End states pin outcomes and
  each stays checkable as written; a clause-less intent produces the same adjudication outcome as
  before this amendment, and an intent-absent run still dispatches byte-identical worker prompts.

This amendment leaves the ratified body above — beyond the Status currency line — byte-unchanged.

## Amendment (2026-08-20): ace bisection on regression, source-derivable absorb eligibility, and the roundLimit 3→6 flip

The realized-absorb-rate campaign (#1547 items 1–4) changed how the routing this ADR records plays
out at the per-task ace path and on the standing auditor card. This amendment ratifies three
already-landed mechanisms:

- **Bisection on regression.** An ace batch that regresses the re-audit no longer discards
  wholesale: the engine's bounded `aceBisect` ladder (`workflow-template.js`) excises named
  culprits first and re-applies the remainder as ONE subset, reserving blind halving for ambiguous
  attribution — applied serially at the tip, depth ≤ 2, same-file findings never split across
  subsets. Only finally-failing subsets demote to `follow-up` (the remainder demotes on budget
  exhaustion), every demotion logged per subset. The ace path still never turns a mergeable task
  into a hold or escalation, and Critical/Major blocking is untouched.
- **Source-derivable absorb eligibility (lens calibration).** The standing auditor card's
  `disposition:'absorb'` block now clarifies: a doc fact deterministically re-derivable from a
  machine-readable in-repo source is **mechanical regardless of value count**, and "single-file"
  reads on the fix's **write footprint** (the doc being corrected), not the source it reads from —
  only the accompanying policy question (mirror the value vs point at the source) routes as an
  issue. This is a calibration of the auditor's judgment card only; the mirrored DISPOSITION RULE
  sentences and `auditPrompt()` are unchanged.
- **roundLimit 3→6.** The operator ratified flipping the fix-round budget default
  `DEFAULTS.run.roundLimit` from 3 to 6 (`war-config.mjs`, with `workflow-template.js`'s fallback
  literal drift-guarded to it) — the bisection ladder consumes slots from the same budget
  (batch = 1 slot, +1 per subset commit, revert uncharged), so the old default starved recovery.

This amendment leaves all pre-existing body text above — beyond the Status currency line —
byte-unchanged.

## Amendment (2026-08-25): the `ask` disposition — park the finding, rule at the Checkpoint

The ask-disposition plan (#1550; `docs/plans/2026-08-25-ask-disposition.md`) widens the routing
Decision 4 records by one member and adds a Checkpoint ruling gate. Decision-shaped Minor/Nit
findings previously had no lawful channel — a policy question filed as a `follow-up` issue is a
decision made by whoever closes the backlog, not by the operator while the context is live. This
amendment records the contract:

- **A fourth disposition member: `ask` — Minor/Nit-only, in plain sight.** The disposition set is
  now `absorb` · `follow-up` · `note` · `ask`. An `ask` carries a mandatory question + fork (the
  decision needed and its two branches) and delivers a decision-shaped Minor/Nit finding to the
  operator with its fork intact. The Minor/Nit-only scope holds **by construction**:
  `dispositionOf` is reachable only through the severity filter — Critical/Major findings route
  via `blockingOf` and never carry a disposition. `demote()` refuses an ask loudly and
  unconditionally: log() + re-route onto the `asks[]` record — never into `minorsFiled`/`notes`,
  never a throw (a throw would destroy the parked records the refusal exists to protect).
- **Never filed unruled.** Unruled asks park in the artifact — the top-level return's `asks[]`
  beside `minorsFiled`, plus a lossy ninth handoff key — and are excluded from in-phase
  consolidation and issue filing. Ruling happens at ONE Checkpoint strike-list gate: a single
  pass rules all parked asks, behind an **absolute advance floor** — the DAG never advances over
  an unruled ask. The floor binds interactively; under `--afk` a standing-adjudication match
  resolves by citation, a no-match demotes to follow-up with the question preserved (visibly not
  loss-free), and a suppression row is minted only from an operator ruling, provenance-marked.
  Ruled asks then file Lead-side with filing parity (Evidence-artifacts duty + dedup against
  engine-filed rows).
- **The adjudication producer set widens two → three.** Checkpoint ask rulings join the two
  producers the 2026-07-22 addendum records — the red-team report's `## Adjudications` block and
  the Lead's own scope rulings — as `args.adjudications` rows, so a ruling made at the
  strike-list gate reaches every later audit seat instead of being re-asked.
- **Channel 2 — the blocking-class round-grinding valve — is deferred to #1664, not enacted
  here.** The premise that framed the 2026-08-20 amendment's `roundLimit` 3→6 flip as a
  stuck-decision valve was falsified in mechanical form: `escalate` already exits the fix loop at
  round 1, and the rounds that grind are `request_changes` rounds by construction. The boundary
  move waits on the measured grind backstop, so the `roundLimit`=6 ceiling's justification is
  **backstop-dependent** until #1664's measurement lands.

This amendment leaves all pre-existing body text above — beyond the Status currency line —
byte-unchanged.

## Amendment (2026-08-26): N:1 clustered filing and dedup-as-corroboration-comment

Decision 4 describes the `follow-up` disposition per-finding — "`follow-up` (substantive work
beyond the phase — must state why it is not absorbable; files the issue)" — a 1:1 finding→issue
reading. The landed filing shape is N:1 (drift recorded as issue #1577; ratified by the
engine-reliability-and-filing-fidelity plan, Phase 5 Task 4). This amendment supersedes the
per-finding "files the issue" description with the filing shape as it actually runs:

- **Engine-side consolidation precedes filing.** Before the filing dispatch sees anything, the
  engine collapses `follow-up` rows keyed on same file + line within a bounded window
  (`FOLLOWUP_LINE_WINDOW` in `workflow-template.js`; normalized-title fallback when line is
  absent) and a distinct raising seat — two rows from one seat never collapse (a collapse is
  cross-seat corroboration): merged-away rows survive on the surviving row with their title,
  rationale, and seat+task corroboration (`seats[]` plus a `merged[]` sub-list), and the
  consolidation is logged (N rows → M candidates).
- **Dedup is a corroboration comment, never a duplicate issue.** The filing dispatch lists open
  `war-followup` issues once; a candidate row matching an open issue (exact title, or same file +
  same root cause) posts this batch's finding as a **corroboration comment** on the existing
  issue — carrying the same evidence lines a filed body would — and reuses that issue number for
  the row. No new issue is created on the dedup arm.
- **Filing is one issue per cluster.** Remaining candidate rows are clustered by file + root
  cause, and ONE `war-followup` issue is filed per cluster: title from the cluster's lead row;
  body carrying, per member row, the why-not-absorbable reason, the task id, its seats as
  corroboration, each merged-away finding's title and rationale when the row carries merged
  corroborations, and the `## Evidence artifacts` section (values copied verbatim; `unrecorded`
  stays `unrecorded`). Members share one issue number.

Decision 4's routing semantics are otherwise untouched: `follow-up` still means substantive work
beyond the phase, still must state why it is not absorbable, and still becomes issue-tracked —
what this amendment changes is the recorded issue *cardinality* (N findings : 1 issue) and the
dedup arm's comment channel, not who owns a finding or how it routes. The Consequences bullet
"Issues become affirmative acts" holds a fortiori: clustering and dedup further suppress
issue-litter without dropping any finding's record. This amendment is about **filing shape
only** — the 2026-08-25 ask amendment above (the fourth `disposition` member and its Checkpoint
ruling gate) is left byte-untouched, and ruled-ask Lead-side filing keeps parity with this shape
per `skills/war/references/file-followups.md`.

This amendment leaves all pre-existing body text above — beyond the Status currency line —
byte-unchanged.
