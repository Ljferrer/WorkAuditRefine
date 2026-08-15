# ADJUDICATED is a distinct, gate-emitted terminal verdict — findings are stamped, never removed

**Status:** accepted (design ratified 2026-08-02; implemented by the spec and plan below; corrected 2026-08-15 — the Context paragraph's Step-5 exclusivity claim over-claims, a probe re-run was also offered; see the correction below)

`verdict()` in `skills/red-team/assets/red-team-gate.mjs` knew only four outcomes —
`CLEARED` / `CLEARED-WITH-NOTES` / `BLOCKED` / `INCOMPLETE` — with no outcome for the operator's
ratified standing rule (2026-07-28 directive, recorded in the Verdict section of
[`docs/red-team/2026-07-28-prompt-surface-simplification.md`](../red-team/2026-07-28-prompt-surface-simplification.md)
as the restamped `OPERATOR-ADJUDICATED CLEAR`; local memory lesson
`redteam-blocked-is-advisory-once-patched-and-adjudicated`): once every root finding is patched
and carries an adjudication row, a `/red-team` `BLOCKED` verdict is advisory to the Lead and the
run proceeds to `/war` without a mandatory probe re-run. Lacking a gate-emitted outcome for that
rule, the Lead had to invent prose — "CLEARED by adjudication" — indistinguishable downstream from
a probe-proven clear. Worse, the *only* mechanic Step 5 offered for closing a blocker (the grill
loop "removes resolved findings") had nothing stopping it from being applied to a finding that was
merely **patched**, never re-proven: remove a patched-but-unverified finding and re-run `verdict()`
and the result is a literal `CLEARED` that overstates the evidence — the fake clear this ADR
closes. This ADR **implements** the 2026-07-28 directive; it does not reopen or re-litigate it.
Full mechanics: [the design spec](../specs/2026-08-02-redteam-doctrine-and-guards-design.md) and
[the plan](../plans/2026-08-02-redteam-doctrine-and-guards.md). Originating issue: #1207.

## Decision

**`ADJUDICATED` is a fifth, distinct, gate-emitted terminal verdict — never a `CLEARED` synonym,
never Lead-invented prose — and a patched finding is stamped, never removed.**

1. **Verdict precedence.** `INCOMPLETE` (coverage gap — unchanged, never waivable) >
   `BLOCKED` (any blocker/`needsDecision` not stamped `adjudicated`) > `ADJUDICATED` (at least one
   stamped blocker/`needsDecision`, zero unstamped) > `CLEARED-WITH-NOTES` (minors only) >
   `CLEARED` (nothing outstanding). A run with zero blockers/`needsDecision` can never emit
   `ADJUDICATED` — back-compat is byte-for-byte wherever no finding carries the flag. Mechanics
   live in `verdict()` (`skills/red-team/assets/red-team-gate.mjs`); `classify()`'s bucketing is
   unchanged by this ADR.
2. **Stamp, never remove.** A blocker or `needsDecision` a re-run probe proves resolved is
   *removed* — probe-proven, so `CLEARED` stays reachable. A blocker that is patched but not
   re-verified is *stamped* `adjudicated: true` on the finding object and **stays listed** in the
   report's `blockers`/`needsDecision` sets — it is never deleted, discounted, or hidden.
   Removal-as-resolution applied to an unproven patch is exactly the mechanic that produced a fake
   `CLEARED`; stamping keeps the evidence trail honest and re-readable at any later audit.
3. **The two-arm re-verify trigger.** Patch-and-adjudicate is the default close for a finding. A
   probe re-run is owed on a patched blocker only when **both** arms hold: (a) an **executed**
   probe proved the finding by running something, **and** (b) the patch changes what that same
   probe would measure. Every other resolved finding — `needsDecision` policy calls, stale
   literals, prose precision, analyzed-probe findings — is adjudicated and closed without a
   re-run. This codifies the rule as practiced in the 2026-07-28 run
   ([`docs/red-team/2026-07-28-prompt-surface-simplification.md`](../red-team/2026-07-28-prompt-surface-simplification.md)),
   where "no root here meets both arms" and every one of the 13 patched roots closed without a
   probe re-run.
4. **The [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) boundary.** ADR 0017
   forbids waiving a validation in prose outside the gate, a floor, or the ratified backstops
   section. An adjudication is not that kind of waiver: **an adjudication waives re-verification
   of a patch, never the validation itself.** The finding is not deleted, discounted, or excused —
   it is patched, stamped, and remains fully visible in the report and to every downstream
   gate/audit read; only the probe *re-run* is waived, and only under trigger 3 above.
5. **The [ADR 0014](0014-ai-commanders-intent.md) per-row provenance marker.** ADR 0014 marks
   provenance by heading so a consumer can tell machine-authored intent from operator-confirmed
   intent at a glance; adjudications need the same property at a finer grain, because one run can
   mix operator rulings with Lead self-adjudication (`--afk`) inside the same report. Each row of
   a report's `## Adjudications` block therefore carries its **own** provenance token —
   `operator-ratified (<date>)` or `AI-declared` — never a block-level marker.

### Carve-out granularity — resolving #1224

Adjudication G of the 2026-07-28 report excluded "registry / both-surfaces-pinned spans" from a
literal shrink; two landed tasks read that ruling at two different granularities (one held the
whole pinned span verbatim, the other shrank the prose surrounding a pinned anchor), and nothing
in the live tree recorded which reading was canonical. **The extraction's read is the carve-out**:
the carve-out covers exactly the bytes a registry/both-surfaces row's drift-guard extraction
actually reads — nothing more, nothing less.

- **Ordered/positional-key regions are atomic** (adjudication J precedent: "a region pinned by a
  single ordered/positional key is ATOMIC (moves whole or stays whole)"). When a guard's anchor is
  a single ordered or positional key rather than individually-named tokens, the whole region moves
  whole or stays whole — there is no partial-shrink reading of an atomic region.
- **Unread residue is shrink-eligible** (adjudication G precedent: registry spans "are EXCLUDED
  from the literal shrink ... the residue is the shrink set"). Prose inside the same construct
  that no extraction reads is not covered by the carve-out and remains ordinary shrink material;
  negligible residue is reported, never forced.
- **Bounded to runtime prompt strings.** The carve-out's rationale — "no file re-anchor exists" —
  is literally true only for a registry row pinning a *runtime dispatched prompt string* (the
  string is emitted inline, never read from a file). It does **not** transfer to a standing-doc
  card span, which always has a file re-anchor available
  ([[registry-carveout-rationale-cannot-justify-retaining-a-card-span-inline]]); citing this
  carve-out to justify retaining a card section inline is a scope-confused rationale, even when
  the retention is independently defensible on tier grounds.

Adjudications G and J of
[`docs/red-team/2026-07-28-prompt-surface-simplification.md`](../red-team/2026-07-28-prompt-surface-simplification.md)
are cited here as precedent, read-only — that report is never edited; this ADR is the canonical,
forward-looking restatement of the rule it left as a one-run ruling.

## Relationship to prior ADRs

- **[ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md).** This ADR's boundary
  sentence (Decision 4) is a direct application of ADR 0017's "never waive a validation in prose"
  rule to the adjudication mechanic — cited, not restated. ADR 0017's own text is untouched.
- **[ADR 0014](0014-ai-commanders-intent.md).** This ADR's per-row provenance marker (Decision 5)
  extends ADR 0014's heading-level provenance discipline to a finer grain (per adjudication row,
  rather than per document/section); the underlying rule — a consumer must always be able to tell
  operator-ratified from AI-declared — is unchanged.
- **[ADR 0025](0025-drift-guard-discipline.md).** A different mechanism, the same posture: both
  ADRs reject prose-only closure of an obligation in favor of something mechanically checkable — a
  drift guard there, a typed gate flag here.

## Considered options

- **A `CLEARED` synonym or free-text report marker (rejected).** Indistinguishable downstream from
  a probe-proven clear — exactly the fake-`CLEARED`-by-removal failure this ADR exists to close.
- **Always require a probe re-run before any proceed verdict (rejected).** The operator directive's
  own cost analysis: red-team severity skews high (the 2026-07-28 run scored 23 blockers out of 40
  findings, mostly stale byte literals and imprecise phrasing), and a full re-verify round per
  blocker costs more than the defects are worth — the repeated-rounds failure mode the directive
  exists to prevent.
- **NLP or free-text classification of "resolved" findings (rejected).** Violates the gate's
  pure/typed posture (the existing `deliverableAbsence`/`envGap` typed-flag pattern in
  `classify()`); `adjudicated` is a strict `=== true` flag read by `verdict()` alone, never parsed
  from finding text.
- **Span-only or anchor-only carve-out reading for adjudication G (rejected, in favor of the
  extraction's-read rule above).** Span-only re-freezes every registry-adjacent paragraph verbatim
  (near-zero shrink); anchor-only lets a guard's surrounding prose drift invisibly under a change
  the guard cannot see. "The extraction's read is the carve-out" is the reconciling middle position
  both landed tasks' outcomes already satisfy.

## Consequences

- `verdict()` gains a fifth outcome and a strict-flag input; `classify()`'s bucketing,
  `summarize()`, the envelope unwrap, the zero-probe refusal, and the coverage/fingerprint layers
  are unchanged — `ADJUDICATED` is additive to the existing pipeline, not a replacement for any
  part of it.
- A report's `## Adjudications` rows are no longer free-text-only: each row's provenance token is a
  first-class, greppable fact, and the gate can be asked (by re-piping the stamped finding set
  through `--stdin`) to reproduce the verdict at any later time.
- **Acknowledged residual risk: proceeding on an adjudication without a probe re-proof is not
  risk-free.** `docs/red-team/2026-07-26-standing-doc-and-remedy-truth-sweep.md`'s own
  adjudication 5 ruled that a guard task sharing a wave with — but carrying no `deps` edge onto —
  its mirror-authoring task was a safe split: "the two tasks are in the same phase and wave, so
  mirror and guard still land together." That ruling — an adjudication like any other — was
  **wrong**: the same report's own "Execution outcome (2026-07-27)" section records that the guard
  task's worker hit the exact base-mismatch the ruling missed and had to escalate ("Adjudication
  5's 'same wave' reasoning was insufficient, and it cost the run an escalation"). `ADJUDICATED`
  accepts exactly this class of risk by design — an adjudicated ruling can later prove wrong once
  executed, and stamping instead of re-proving means the plan proceeds without a probe catching it
  early. The mitigation is the trigger in Decision 3, not its elimination: a probe re-run still
  fires whenever an executed probe's own measurement would change, and every stamped finding stays
  visible in the report for a later seat to reopen.
- The carve-out granularity rule is a bound, not a license: it resolves #1224's anchor-vs-span
  ambiguity for registry/both-surfaces rows only, and citing it for a standing-doc card-eviction
  decision is out of scope by this ADR's own Decision text.

## References

- Design spec:
  [`docs/specs/2026-08-02-redteam-doctrine-and-guards-design.md`](../specs/2026-08-02-redteam-doctrine-and-guards-design.md)
  — §1 (context), §3 decisions 1, 4, 6, 8 (design tree), §4 mechanics, §6 (domain terms), §10
  (validation criteria).
- Implementation plan:
  [`docs/plans/2026-08-02-redteam-doctrine-and-guards.md`](../plans/2026-08-02-redteam-doctrine-and-guards.md)
  — Task 1 (gate mechanics), Task 3 (this ADR), Task 4 (SKILL.md/lenses.md prose + drift guards).
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — the "never waive a
  validation in prose" rule this ADR's boundary sentence applies to adjudications.
- [ADR 0014](0014-ai-commanders-intent.md) — the heading-level provenance-marking precedent this
  ADR extends to per-row granularity.
- Precedent report (read-only, quoted, never edited):
  [`docs/red-team/2026-07-28-prompt-surface-simplification.md`](../red-team/2026-07-28-prompt-surface-simplification.md)
  — adjudications G and J (carve-out granularity), the Verdict section (the operator directive as
  restamped `OPERATOR-ADJUDICATED CLEAR`), and findings roots 7 and 10.
- Precedent report (residual-risk record):
  [`docs/red-team/2026-07-26-standing-doc-and-remedy-truth-sweep.md`](../red-team/2026-07-26-standing-doc-and-remedy-truth-sweep.md)
  — adjudication 5 and its "Execution outcome (2026-07-27)" correction.
- Memory lessons: `redteam-blocked-is-advisory-once-patched-and-adjudicated` (local-root lesson —
  the 2026-07-28 operator directive, ratified, not mere precedent; its in-repo record is the
  restamped Verdict section of `docs/red-team/2026-07-28-prompt-surface-simplification.md` above),
  [[registry-carveout-rationale-cannot-justify-retaining-a-card-span-inline]] (the carve-out's
  bound), [[guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient]] (the
  same-wave precedent this ADR's residual-risk record cites).
- Originating issue: #1207 (`ADJUDICATED` verdict); related: #1224 (carve-out granularity).

## Correction (2026-08-15, #1268)

The Context paragraph above over-claims Step 5's mechanics: it presents the grill loop as the sole
mechanic Step 5 offered for closing a blocker. Step 5 as it stood when this ADR was written
(`skills/red-team/SKILL.md` before this ADR's implementation landed — revision `8e065b7`) also
offered a **probe re-run** — "re-run only the affected probe to confirm it is resolved" — the very
mechanic this ADR's own Decision 3 two-arm re-verify trigger depends on. The paragraph's argument is
otherwise unaffected: nothing stopped removal-as-resolution from being applied to a finding that was
merely **patched**, never re-proven, which is exactly the fake clear this ADR closes. The Context
paragraph's prose is left **byte-unchanged** as a point-in-time record; this correction note carries
the fix.
