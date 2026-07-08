# Failure diagnosis runs a self-confound gate before a hypothesis is promoted

**Status:** accepted (design ratified 2026-07-07; implementation tracked by the spec and plan below)

WAR institutionalizes adversarial verification of what agents *build* — Work produces a diff, an
independent read-only auditor roster judges it, the refiner re-runs the gate — but nothing of what they
*conclude about failures*. In #575 a diagnosing agent tore down its own cluster with back-to-back manual
**and** automated bring-up against the same shared state, read the resulting breakage as a systemic
coordination bug, and **promoted** that diagnosis into two durable artifacts — a memory lesson and a
fix-plan sub-agent fan-out — before reading the logs that proved there was no bug. The root cause of the
*misdiagnosis* was the diagnosing agent's own double mutation; the refute discipline WAR already applies
to built code was never turned **inward** on a conclusion. A future reader will ask why the fix is
prose-only standing instruction rather than a hook or floor, why the same clause is worded differently on
every surface instead of shared verbatim, and why the servitor gets a special write-side sentence. This
records those decisions. Full mechanics: [the design
spec](../specs/2026-07-07-diagnosis-preflight-self-confound-gate-design.md).

## Decision

**No failure is attributed to a systemic bug, and no hypothesis is promoted into a durable artifact,
until the diagnosing agent has ruled itself out as the cause.** This is the **self-confound gate** — a
four-part diagnosis pre-flight that turns WAR's existing refute discipline inward. The gate blocks
**promotion, never diagnosis or escalation**: an agent may always form a theory and always escalate; what
it may not do is bake an unproven root-cause claim into a durable artifact.

The four parts:

1. **Action-provenance first** — before attributing any observed failure (a red probe, a broken baseline,
   an unexpected sandbox or live-system state) to the plan, the repo, or a subsystem, enumerate your own
   and any concurrent actor's recent **mutating** actions against the observed state and explicitly rule
   each out. "Did I cause this?" is question #1.
2. **Single-path validation** — never validate or reproduce against the same shared mutable state through
   two paths back-to-back (manual **and** automated); pick one path and re-provision fresh state before
   switching. This is the incident's root act, named directly.
3. **Hypothesis promotion gated on primary evidence** — no durable artifact may encode a root-cause
   diagnosis until the mechanism is demonstrated from primary evidence (raw logs, a clean repro) **and**
   an inward refute pass has proven the cause is not your own action.
4. **State the falsifier** — before acting on a diagnosis, state the observation that would falsify it and
   go check it; evidence merely consistent with the theory is not proof.

The escape valve: when primary evidence is unobtainable (ephemeral state, no logs), record the diagnosis
as an explicitly-labeled **hypothesis** (a report/ledger note) and/or escalate, then proceed — the gate
never raises the price of escalating.

### (a) Standing doctrine on six surfaces; the gate is not code-enforced

The doctrine is **prose-only standing instruction** — no gate, floor, hook, `workflow-template.js`, or
`war-config.mjs` change. That is the deliberate group boundary with the sibling design
([ADR 0019](0019-target-derived-execution-values.md)), whose frictions were mechanical and got code;
diagnosis *judgment* is not mechanically checkable pre-merge (no fixture can exercise live diagnostic
behavior), so the enforcement is the same as every other WAR judgment invariant: prose the diagnosing
roles read, backed by a text-scan structure test that guards clause **presence**.

The canonical home is a new `## Diagnosis pre-flight (self-confound gate)` section in
`skills/red-team/SKILL.md`. Condensed, context-tailored clauses carry it to the five other surfaces that
actually reach each diagnosing role:

- `skills/red-team/assets/workflow-scaffold.js` — one sentence appended to the string-built `confirmStage`
  prompt, the **only** surface the runtime adversarial-confirm agents ever see (a prose-content string
  edit, not machinery).
- `skills/red-team/references/lenses.md` `## Safety` — the Lead's adjudication doctrine when weighing
  confirmed fails (this reference never reaches the runtime confirm agents; the scaffold string does).
- `skills/war/SKILL.md` `## Invariants (never violate)` — one bullet binding the classifier-less diagnosis
  moments (live validation, resume anomalies, `held:*` adjudication, the Lead's own manual operations); for
  merge/land gate reds the sibling's `gate_failure_class` base re-run **is** the action-provenance evidence.
- `agents/war-worker.md` `## Stop and escalate instead of guessing` — the worker (and fix-worker, which is
  `war-worker`-seated and reads the same standing file) names in its `blocked_reason` what it ruled out
  when attributing an observed failure to plan/code/env; mandatory instant blocks stay immediate.
- `agents/war-servitor.md` verify-on-write block — **operator-ratified** as a sixth surface (see (d)).

### (b) Hypothesis promotion is a closed list of four channels

"Promoting" a diagnosis means encoding it in a **durable artifact**, and the set of such channels is a
**closed list of four**: a memory/lesson write, a `war-followup` issue, a fix plan or spec, a sub-agent
fan-out. Enumerating the channels makes the gate concrete — "don't promote without evidence" is otherwise
unfalsifiable prose. A compaction-surviving hypothesis is a **labeled ledger/phase-report note, never a
memory lesson**: durability of a *note* is not durability of a *claim*.

### (c) Mirroring policy — shared anchor, deliberately not byte-identical

Every surface clause is **tailored to its context and self-contained** — never a verbatim mirror
(lesson `verbatim-mirror-directive-context-mismatch-at-destination`: a copied directive carries
wrong-context prose to its destination). What the clauses share is the single greppable literal
**`self-confound`**. `skills/red-team/diagnosis-preflight.test.sh` asserts **presence** per surface and
per canonical part, not byte-identity; wording drift across surfaces is the **accepted residual** (lesson
`gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity`: a presence gate on a mirrored
clause cannot catch future wording drift, by construction).

### (d) Corrected relationship to ADR 0007 — the ladder does not bound this

[ADR 0007](0007-memory-provenance.md)'s provenance ladder is a **recall-side** bound, and it bounds
*unverifiable-referent* lessons only. The servitor's verify-on-write checks that a named file/flag/symbol
**exists** — referent existence, not causal truth. So a plausible misdiagnosis that names a **real**
subsystem passes the existence check and would enter `code-verified` — exactly the #575 failure mode. The
ladder therefore does **not** catch this class, and it was a design error to assume it would. The
write-side defense is instead the gate itself plus one servitor sentence: a lesson asserting a failure's
**root cause** must carry the gate's **evidence trail** (primary evidence plus an inward refute pass); a
root-cause lesson lacking it is written as an explicitly-labeled hypothesis note,
`metadata.provenance: agent-unverified`. This is why the servitor — the only in-run role that writes
lessons, and the write site of the incident's worst artifact — is an operator-ratified sixth surface.

### (e) Not code-enforced; the write-side hook is the named follow-up

The gate is standing-instruction prose, guarded for presence only. Whether a diagnosing agent actually
*runs* the gate before promoting — versus merely carrying the clause — is not pre-merge checkable. The
named follow-up is a **write-side hook** that would refuse a root-cause memory write lacking an evidence
trail; per [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) it carries an explicit
activation trigger (recorded in the plan's backstop section): the first post-land recurrence — any
promoted diagnosis later falsified as self-caused (a memory lesson retracted, a `war-followup` closed as
self-confound, a fix plan abandoned as no-bug) — constitutes "prose proved insufficient," at which point
the operator files the hook follow-up. Until then, the per-channel human backstops (redaction lint +
`docs(learnings)` PR review, issue triage, `/red-team` on any fix plan) plus operator observation are the
enforcement.

## Considered options

- **One ADR versus per-surface records (chosen: one).** The doctrine is a single decision expressed on
  six surfaces; recording it once, with the surface list and mirroring policy, keeps the "why prose, why
  drift-tolerant" rationale in one place.
- **Code enforcement (a hook or floor) now (rejected, deferred).** Live diagnostic behavior has no
  pre-merge fixture, and a write-side hook is only justified once prose is *shown* insufficient. Building
  it speculatively would enforce a shape the first real recurrence might contradict; it is the named
  follow-up with a concrete trigger instead.
- **Verbatim-mirrored clauses with a byte-identity test (rejected).** A shared verbatim block reads wrong
  in five of six contexts and a byte-identity test is fragile to any single-surface reword (lessons
  `verbatim-mirror-directive-context-mismatch-at-destination`,
  `gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity`). Presence-per-surface with a
  shared `self-confound` anchor accepts drift as the residual and stays robust.
- **Leaning on ADR 0007's ladder for the write side (rejected — it does not bind this).** See (d): the
  ladder bounds unverifiable-referent lessons, not plausible misdiagnoses of real subsystems.

## Consequences

- Six surfaces gain a `self-confound` clause; `skills/red-team/diagnosis-preflight.test.sh` presence-locks
  each part and each surface. The red-team frontmatter `description:` is byte-untouched;
  `workflow-scaffold.test.mjs` and `red-team-gate.test.mjs` stay green (string-literal-only scaffold edit).
- `CONTEXT.md` gains a `### Diagnosis discipline` subsection defining **self-confound gate** and
  **hypothesis promotion**; this file's ADR range in the repo `CLAUDE.md` is extended to include it.
- The doctrine ships to marketplace-pinned users via a version bump of the four release slots.
- Deliberate residuals, named: `/war-campaign` and `/aftermath` Leads also diagnose and can promote, but
  are outside the ratified surface set — the greppable term makes each a one-clause future extension; and
  ambient post-run sessions with no WAR skill loaded reach no prose surface at all.

## References

- Design spec:
  [`docs/specs/2026-07-07-diagnosis-preflight-self-confound-gate-design.md`](../specs/2026-07-07-diagnosis-preflight-self-confound-gate-design.md)
  — the incident, the four-part gate, the surface set, and the validation criteria.
- Implementation plan:
  [`docs/plans/2026-07-07-diagnosis-preflight-self-confound-gate.md`](../plans/2026-07-07-diagnosis-preflight-self-confound-gate.md).
- Issue **#575** — the self-induced misdiagnosis promoted to a memory lesson and a fix-plan fan-out before
  primary evidence was read (the originating incident).
- [ADR 0007](0007-memory-provenance.md) — the provenance ladder whose recall-side bound covers
  *unverifiable-referent* lessons only; the corrected relationship is decision (d).
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — the ratified-backstop /
  named-activation-trigger vehicle the deferred write-side hook uses.
- [ADR 0019](0019-target-derived-execution-values.md) — the sibling (mechanical) design this doctrine
  draws its prose-only / code boundary against.
- In-repo precedent lessons: `redteam-executed-probe-cwd-reset-hits-real-remote` (a recorded self-confound
  — a sandbox probe's cwd reset hit the real remote), `verbatim-mirror-directive-context-mismatch-at-destination`,
  `gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity`.
