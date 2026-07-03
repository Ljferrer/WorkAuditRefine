# AI-Commander's Intent — the sanctioned synthetic-intent exception

**Status:** accepted (2026-07-02 — design ratified in the pipeline-skills review; amends
[ADR-0013 — Commander's intent and disposition routing](0013-commanders-intent-and-disposition-routing.md))

ADR 0013 made intent plan content and drew a hard line: staff may draft, the commander confirms, and the
Lead **never** invents intent — a `--afk` run with no intent section degrades to literal plan behavior.
That absolute makes the pipeline's autonomous middle step impossible: `/war-machine --afk` converts specs
to plans unattended, and every plan it authors would either carry no intent (degrading every downstream
judgment gate ADR 0013 built) or an intent the operator never saw. The trade-off is real on both horns:
an un-cronable pipeline (intent requires a human in the loop) vs. Lead-invented intent (the doctrine
violation ADR 0013 rejected by name). Full mechanics:
[the design spec](../specs/2026-07-02-war-pipeline-skills-design.md) §4.2, §4.4, §7.

## Decision

1. **One authoring surface, provenance-marked by heading.** `/war-machine --afk` — and only it — may
   author a synthetic intent block, under its own heading: `## AI-Commander's Intent`. The heading *is*
   the provenance record: no config value, no sidecar metadata — any consumer reading the plan file sees
   the intent was machine-authored. Interactive `/war-machine` still runs the ADR 0013 echo-back confirm
   and emits `## Commander's Intent`.
2. **Predecessor-consistency bounds what a synthetic intent may claim.** Before committing to an
   AI-Commander's Intent, the machine reads prior intent blocks (`## Commander's Intent` /
   `## AI-Commander's Intent` across `docs/plans/*.md`) and checks the synthetic block is in line with
   its predecessors (tone, scope, standing constraints); a divergence is recorded in the plan's
   deviations log, never silently shipped.
3. **Downstream, either heading is intent-present and judged identically.** All heading-extraction
   surfaces (`/war`'s plan-read step, `/red-team`'s `intent-vs-plan` probe and lens, the schema and
   design contract mirrors) recognize both headings; an `## AI-Commander's Intent` plan is never treated
   as intent-missing. `/red-team` adds a Minor note recommending the human upgrade path.
4. **The upgrade path is human confirmation, in place.** `/war-strategy <plan>` interviews the operator
   and replaces `## AI-Commander's Intent` with a confirmed `## Commander's Intent` — synthetic intent
   is a waypoint, not a terminal state.

## Considered options

- **No intent under `--afk`, degrade to literal behavior (rejected).** ADR 0013's fallback exists for
  hand-authored plans missing a section, not as the *designed* output of an autonomous authoring step —
  it would make the pipeline's own plans second-class in every judgment gate the intent doctrine feeds.
- **Lead-invented intent under the existing heading (rejected).** Indistinguishable downstream from
  operator-confirmed intent; inverts the command relationship ADR 0013 preserved and destroys the
  provenance property the auditors and post-mortems rely on.
- **A provenance config value instead of a heading (rejected).** Intent travels with the plan file;
  sidecar provenance separates the claim from the artifact and dies the moment a plan is copied or read
  outside the run.

## Consequences

- **Hard to reverse:** plans in the wild carry the heading; retiring it means a migration across every
  machine-authored plan and every surface that recognizes it.
- **Every heading-extraction surface must recognize both forms** — a surface added later that greps only
  the original heading silently demotes machine-authored plans to intent-missing (the spec §4.4
  enumeration plus a fresh grep at implementation time guards today's five surfaces).
- **The never-invents rule survives, narrowed:** the Lead (of a `/war` run) still never invents intent;
  `/war-machine --afk` is the sole authoring surface allowed to, and only under the marked heading.

## References

- Design spec: [`docs/specs/2026-07-02-war-pipeline-skills-design.md`](../specs/2026-07-02-war-pipeline-skills-design.md)
  §4.2 (authoring + predecessor check), §4.4 (recognition surfaces), §7.
- [ADR-0013 — Commander's intent and disposition routing](0013-commanders-intent-and-disposition-routing.md)
  — the doctrine this amends (Decision 2's never-invents rule gains its single exception).
