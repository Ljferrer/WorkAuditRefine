# --afk conversion

   **`--afk`:** triad survivors are self-adjudicated into the deviations log. The plan carries
   **`## AI-Commander's Intent`** instead — the one sanctioned Lead-invented intent block
   (ADR 0014, amending [ADR 0013](../../../docs/adr/0013-commanders-intent-and-disposition-routing.md)),
   provenance-marked by the heading itself. The **same ADR 0014 provenance rule applies to
   waivers:** when the drafter authors the plan's backstop section, it uses the AI-declared heading
   variant **`## Deferred validations (backstops — AI-declared)`** — never the plain
   operator-ratified `## Deferred validations (backstops)` — because an `--afk` plan has no operator
   to ratify its deferrals; the marker survives extraction (`aiDeclared: true`) so an AI-declared
   waiver is never surfaced as operator-ratified. **Predecessor-consistency check:** before committing
   to a synthetic intent, read the prior intent blocks — either heading, `## Commander's Intent`
   or `## AI-Commander's Intent` — across `docs/plans/*.md` and check the new block is in line
   with its predecessors (tone, scope, standing constraints); a divergence is **recorded in the
   deviations log, never silently shipped**. A spec that cannot be converted without an operator
   decision is **skipped and reported**, never stalled on.

   **Per-row `AI-declared` markers (D14, ADR 0014):** the heading variants above mark the two
   whole blocks; every other row or tag the unattended conversion authors on its own — an
   `## Assumptions ledger` row it carries forward or retires, an End state it synthesizes, a
   triad survivor it self-adjudicates into the deviations log — carries a per-row `AI-declared`
   marker inline, so no AI-invented row is ever read as operator-ratified.
