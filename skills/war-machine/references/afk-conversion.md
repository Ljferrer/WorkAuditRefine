# --afk conversion

   **`--afk`:** triad survivors are self-adjudicated into the deviations log. The plan carries
   **`## AI-Commander's Intent`** instead. It is the one sanctioned Lead-invented intent block
   (ADR 0014, amending [ADR 0013](../../../docs/adr/0013-commanders-intent-and-disposition-routing.md)),
   and the heading itself marks its provenance. The **same ADR 0014 provenance rule applies to
   waivers:** when the drafter authors the plan's backstop section, it uses the AI-declared heading
   variant **`## Deferred validations (backstops — AI-declared)`**. It never uses the plain
   operator-ratified `## Deferred validations (backstops)`, because an `--afk` plan has no operator
   to ratify its deferrals. The marker survives extraction (`aiDeclared: true`), so an AI-declared
   waiver is never surfaced as operator-ratified. **Predecessor-consistency check:** before committing
   to a synthetic intent, read the prior intent blocks across `docs/plans/*.md`. Read either
   heading, `## Commander's Intent` or `## AI-Commander's Intent`. Check that the new block is in
   line with its predecessors (tone, scope, standing constraints). A divergence is **recorded in the
   deviations log, never silently shipped**. A spec that cannot be converted without an operator
   decision is **skipped and reported**, never stalled on.

   **Per-row `AI-declared` markers (D14, ADR 0014):** the heading variants above mark the two
   whole blocks. Some rows and tags come from the unattended conversion alone. Examples are an
   `## Assumptions ledger` row it carries forward or retires, and an End state it synthesizes.
   A triad survivor it self-adjudicates into the deviations log is another. Each such row or tag
   carries a per-row `AI-declared` marker inline, so no AI-invented row is ever read as
   operator-ratified.

   **Trials under `--afk` (D5, [`fork-trials.md`](../../war-strategy/references/fork-trials.md) §AFK):**
   the drafter writes `AI-declared` on every `TRIAL-<n>` row. A pair-beat pick's Source cell reads
   `PIN-n · AI-declared [assumed: picked on the frozen criteria, TRIAL-n — if wrong: <losing candidate>]`
   with no pipe character inside the cell.
