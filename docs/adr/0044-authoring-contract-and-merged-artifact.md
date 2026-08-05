# The authoring contract and the merged plan artifact — one interview, one artifact

**Status:** accepted (design ratified 2026-08-04; implemented by the spec and plan below)

The WAR pipeline's front door was its only stage with no ratified discipline. The README named
Grill Me a "Required Auxiliary Plugin" and attributed to `/grill-with-docs` a design-tree walk
"until the result is unambiguous and cleanly phase-decomposable" — but the installed skill is a
7-line stub routing to a 5-sentence `/grilling` (verified 2026-08-04), and `/war-machine`'s grill
agent invoked "the full question tree grill-with-docs would have asked" — a tree defined nowhere,
reconstructed from training memory. Meanwhile the two-artifact pipeline (spec, then plan) made the
user run **two interviews** and paid a measured defect tax at the spec→plan conversion seam: across
the 10 newest red-team reports, a 57-finding classification measured ~40% *false repo facts*, ~35%
*under-specification*, ~19% *validations unprovable or vacuous at the base* (2026-08-04 fan-out
session) — the conversion invented what the interview never extracted, spec §10 criteria dropped
between files, and intent was drafted at conversion instead of elicitation. Spec→plan pairing is
1:1 in **100 of 116** `*-design.md` slugs (slug join at `94ee5b3`, 2026-08-05 — a dated snapshot
per D12, superseding the spec's pre-landing 99/116); the lone deliberate 1:N is modeled by the
roadmap layer, not the file split. The split bought nothing the roadmap layer does not already own.
Full mechanics: [the design spec](../specs/2026-08-04-interview-and-authoring-contract-design.md)
and [the plan](../plans/2026-08-04-interview-and-authoring-contract.md); adjudication record:
[the red-team report](../red-team/2026-08-05-interview-and-authoring-contract.md).

## Decision

**One interview runs to completion and produces one merged artifact — a plan whose Part 1 is the
ratified decision record and whose Part 2 is the decomposed phases — and that merged shape is the
uniform execution artifact on every path; the authoring output contract (evidence tags, done-when
law, unified tagged End states, single assumptions ledger) is template law; WAR owns the interview
doctrine in-repo.**

1. **The collapse (D15).** One interview to completion produces one merged artifact at
   `docs/plans/YYYY-MM-DD-<slug>.md`: Part 1 the ratified decision record (context, pivotal
   constraints, resolved design tree, assumptions ledger, non-goals, new domain terms ·
   recommended ADRs), Part 2 the decomposed phases. There is no separate spec interview and no
   conversion seam — what the interview extracts lands directly in the artifact `/red-team`
   attacks and `/war` executes. The doctrine
   ([`skills/war-strategy/references/plan-interview.md`](../../skills/war-strategy/references/plan-interview.md))
   terminates only on the merged plan; when rehearsal shows the work exceeds one plan (the rare
   1:N), the deliverable is N merged plans plus a roadmap — the roadmap layer, never a file split.
2. **Uniform reach (D16); vocabulary (D17).** The merged shape is the universal execution
   artifact: `/war-machine` conversion emits it too — Part 1 a decision digest distilled from the
   source spec, citing the spec and its issues — so `/red-team` and `/war` face exactly one
   artifact shape on every path, interactive and AFK. `/red-team`'s source-of-truth resolution
   carries the merged arm: a plan whose Part 1 holds the decision record is **its own source of
   truth** (`--spec` defaults to the plan itself; plan-vs-spec probes become Part-1→Part-2
   internal-coherence probes). Vocabulary (CONTEXT.md): a **plan** is the self-contained merged
   artifact; a **spec** is a standalone decision record valid as *input only* — `/survey-corps`'
   AFK ratification intermediate and external drafts.
3. **Extraction compatibility is a hard bound.** Part 1/Part 2 is prose framing, never heading
   nesting. Part 2 carries today's exact H2 headings — `## Commander's Intent` or
   `## AI-Commander's Intent` (the ADR 0014 either/or pair), `## Build order`,
   `## Phase N — <name>`, `## Deferred validations (backstops)` — and the tail stays two separate
   H2s (`## Notes / conscious deviations`, `## Open decisions`). Per-task fields are separate
   `- ` bullets: an extraction requirement, not a style choice — the red-team run's executed probe
   proved the campaign ledger's `extractFiles` ingests only the bullet form, while the compact
   one-line rendering either over-widens the footprint, yields an `unparseable footprint`, or
   silently replaces the footprint with slice paths. `/war` decompose, intent extraction (both
   ADR 0014 headings), backstop surfacing, and `extractFiles` run unmodified; the `/war` engine —
   `workflow-template.js`, hooks, floors, schemas, intake — is untouched by this contract.
4. **The authoring output contract (D4–D5, D18–D19).**
   - *Evidence tags (D4; source forms D11).* Every claim of fact in Part 1 carries one of
     `(user)` · `(verified: <source> at <base>)` · `[assumed: <default> — if wrong:
     <consequence>]`; issue-derived claims use the source form `(verified: issue #N (<date>))`.
     One CONTEXT.md glossary entry maps the tags onto [ADR 0007](0007-memory-provenance.md)'s
     provenance ladder while keeping distinct syntax — the
     [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md) collision-avoidance
     precedent: ladder tier names stay reserved for how a *memory fact* was established.
     Memory or training recall is never a `(verified:)` source. Literals are dated snapshots at a
     stated base, re-measured at the task's rebased base (D12). Under `--afk`, AI-authored
     rows/tags carry a per-row `AI-declared` marker (D14 — the
     [ADR 0043](0043-adjudicated-clear-distinct-terminal-verdict.md) row pattern, itself extending
     [ADR 0014](0014-ai-commanders-intent.md)).
   - *Done-when law and unified End states (D5, D18).* `Done when: <command>` is required iff
     `requiresTest: true`, and permitted (not required) elsewhere — otherwise `None — <basis>`.
     Spec-§10-style validation criteria and plan End states unify into one numbered End-state list
     in Commander's Intent — the criteria-carryover hole dies by construction — and every End
     state carries exactly one tag from the closed set `check:` | `gate:` | `HARD at audit_sha`
     (observable + judge seat) | `backstop:` row.
   - *Single ledger (D19).* One `## Assumptions ledger` lives in Part 1; conversion and AFK
     synthesis carry its rows forward or retire each with a stated reason.
5. **Enforcement posture (D6).** The assumptions ledger and `## Deferred validations (backstops)`
   are required sections with explicit `None` allowed — the
   [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) vehicle, never a prose
   waiver. Tags and the End-state form are template law for **new** artifacts, enforced by
   advisory lint plus red-team grading: `plan-literal-lint.mjs` stays ratified report-only — its
   merged-template shape rules (untagged claims and End states, done-when absences, a missing
   ledger, vague-trigger vocabulary) report and still exit 0 without `--strict`. Legacy artifacts
   are grandfathered; with-artifact conversion upgrades a legacy spec/plan pair into one merged
   doc on request, never retroactively.
6. **The placement reversal (D2; home D3).** WAR owns the interview doctrine in-repo:
   `skills/war-strategy/references/plan-interview.md` is the one home — the
   [ADR 0042](0042-prompt-surface-budgets.md) hot/cold shape, a `references/` file behind a
   trigger pointer — and bare `/war-strategy` runs the interview itself, self-sufficient with no
   other skill installed. The Grill Me family is demoted from required to a **recommended front
   door**, bound to the same merged deliverable via the HANDOFF DIRECTIVE when installed. This
   **supersedes the README's required-and-not-reimplemented stance** ("Required Auxiliary
   Plugin" / "Why it's required" / "`/war-strategy` … never authors one from scratch"): the stub
   reality inverted that stance's own drift rationale — the doctrine the README attributed to
   `/grill-with-docs` existed nowhere, so out-of-repo placement guaranteed drift instead of
   preventing it. The same plan rewrites the README section to Recommended (Task 6).

## Relationship to prior ADRs

- **[ADR 0007](0007-memory-provenance.md) / [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md).**
  Evidence tags map onto the provenance ladder in one glossary entry but never reuse its tier
  names — the same collision-avoidance move ADR 0024 made for `pin-mismatch`. The ladder is
  neither extended nor consumed.
- **[ADR 0013](0013-commanders-intent-and-disposition-routing.md) / [ADR 0014](0014-ai-commanders-intent.md).**
  Intent remains operator-authored and never invented; the merged template carries both intent
  headings as either/or alternatives, and AFK provenance rides per-row `AI-declared` markers at
  the granularity ADR 0043 established.
- **[ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md).** The required-sections
  mechanic (explicit `None`, red-team-graded, no prose waivers) is applied unchanged to the
  ledger and backstops sections.
- **[ADR 0025](0025-drift-guard-discipline.md).** Every ratified template internal and retired
  wording lands lock-step with its structure-test pin (presence + old-absent) in
  `war-strategy-structure.test.sh` / `war-pipeline-structure.test.sh` — the 0.15.1 pattern,
  including the guard-split deps-edge shape where file-disjointness forces a pin into a
  different task than its fact.
- **[ADR 0042](0042-prompt-surface-budgets.md).** The doctrine's placement (one `references/`
  home, trigger pointers on the operative surfaces) is a direct application of the hot/cold law.

## Considered options

- **Keep the two-artifact pipeline (rejected).** Two files bought a separation of concerns
  (decision record vs dispatch structure) at the price of two interviews and a conversion seam
  the measurements condemn: 100/116 pairing is 1:1, the seam's defect classes dominate red-team
  findings, and the one structural win (1:N decomposition) is owned by the roadmap layer. The
  Dry-Run Interview meta-prompt's own deliverable was already the merged shape — the split was
  WAR's deviation.
- **Total collapse — `/survey-corps` emits merged plans directly (rejected).** AFK synthesis
  keeps its ratification intermediate: a spec the operator can veto before conversion commits
  the pipeline. Specs stay valid as the input shape; survey-corps instead gains the D4/D11
  claim-tagging directive so synthesis invention is visible and vetoable.
- **Fail-closed authoring lint (rejected).** `plan-literal-lint.mjs` is ratified report-only;
  nothing fails closed at authoring or intake. Mandatory tags already invite box-ticking — the
  pre-mortem's delete-the-feature probe and backstop-legitimacy's `judge:`-tag grading rule are
  the mitigations — and a fail-closed gate would break every grandfathered legacy artifact.
- **Upstream the doctrine into Grill Me (rejected).** Keeps the pipeline's only undisciplined
  stage outside the repo, dependent on a third-party stub that demonstrably did not carry it;
  upstream PRs stay a non-goal.
- **Part 2 nested under a wrapper heading (rejected).** Any heading nesting or rename breaks the
  extraction greps the engine-untouched constraint protects; prose framing costs nothing and the
  structure tests pin the exact heading set.

## Consequences

- The artifact shape ripples through every downstream consumer — `/war-strategy`'s templates and
  gap review, `/war-machine`'s conversion and grill charter (the training-memory question-tree
  wording is retired), `/red-team`'s source-of-truth arm and coverage lens, `/survey-corps`'
  claim tagging, and the README / CLAUDE.md / war-help / CONTEXT.md gospel — which is exactly why
  this passes the ADR triad: hard to reverse, surprising without context (it reverses both the
  README stance and the spec-is-not-a-plan gospel), a genuine trade-off.
- Zero engine change: extraction, hooks, floors, and schemas are untouched. Engine consumption of
  the new slots (`Done when:` parsing, gate-log verification) is explicitly deferred to the
  precision-chain spec; round telemetry for the D7 adoption bet ("authoring weight is borne on
  both paths") rides `/war-review` rows, to be ratified in the loop-breaker spec.
- Merged documents run ~1.5–2× today's plans; red-team fingerprints headings (unaffected) and
  human navigation rests on the fixed section order.
- The retired gospel ("a spec is not a plan" as current doctrine; required-Grill-Me framing) is
  enforced absent on the five live doc surfaces by committed case-insensitive pins, both
  directions (new-present + old-absent). `docs/adr/`, `docs/plans/`, and `docs/red-team/` are
  deliberately outside the pin sweep's scope — this ADR quotes the retired wording above as its
  historical record, which is legitimate exactly because decision records are excluded.
- The first field trial is the implementing plan itself: it was authored in the merged shape one
  phase before the template ratified that shape, and its red-team run fed two shape rulings back
  into the template as ratified law — the separate-bullet task fields extraction-proven by the
  executed `extractFiles` probe, the two-H2 tail operator-ratified (2026-08-05, Q2).

## References

- Design spec:
  [`docs/specs/2026-08-04-interview-and-authoring-contract-design.md`](../specs/2026-08-04-interview-and-authoring-contract-design.md)
  — §1 (measured context), §3 (the D1–D19 design tree), §4 (mechanics), §10 (validation
  criteria). Its own shape is the legacy input shape — it predates the merged template it
  ratifies, and deliberately retains the superseded 99/116 pre-landing literal.
- Implementation plan:
  [`docs/plans/2026-08-04-interview-and-authoring-contract.md`](../plans/2026-08-04-interview-and-authoring-contract.md)
  — the first merged-shape plan (self-hosting field trial); Task 9 is this ADR.
- Red-team record:
  [`docs/red-team/2026-08-05-interview-and-authoring-contract.md`](../red-team/2026-08-05-interview-and-authoring-contract.md)
  — ADJUDICATED per [ADR 0043](0043-adjudicated-clear-distinct-terminal-verdict.md); the
  superseding 100/116-at-`94ee5b3` row; the `extractFiles` separate-bullet executed proof.
- Live constructs:
  [`skills/war-strategy/references/plan-interview.md`](../../skills/war-strategy/references/plan-interview.md)
  (the doctrine), `skills/war-strategy/SKILL.md` §2 (the merged plan template and its two example
  documents), `skills/war-machine/SKILL.md` (merged-output directive + grill charter),
  `skills/red-team/SKILL.md` Step 1 (the merged arm).
- Originating task issue: #1314.
