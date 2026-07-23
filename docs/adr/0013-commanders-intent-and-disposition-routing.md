# Commander's intent and disposition routing — licensed judgment over plan literalism; issues become affirmative acts

**Status:** accepted (2026-07-02 — design ratified in the clean-handoff review; implemented in `skills/war/assets/workflow-template.js` + the worker/auditor standing files by the clean-handoff plan's Phase 1; amended per the two-homes ruling, Decision 2; amended by [ADR-0014 — AI-Commander's Intent](0014-ai-commanders-intent.md) — Decision 2's never-invents rule gains its single sanctioned exception, the `## AI-Commander's Intent` block `/war-machine --afk` authors; coupled — not amended — by
[ADR-0032](0032-red-team-grades-by-artifact-kind.md) + friction D7 refine the finding-severity model (Decision 4) and
friction D8 adds the auditor-prompt adjudicationClause (Decision 3), noted inline below)

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
