# Agent-card pointer skeleton is plugin-root-anchored

**Status:** accepted (ratified by
[the plan](../plans/2026-08-06-references-pointer-integrity.md), 2026-08-18; auditor-seat scope
set by /red-team 2026-08-18. Originating issue: #1364)

The five agent cards (`agents/war-*.md`) route evicted doctrine to `skills/war/references/` (and
`skills/_shared/`) files via markdown links. Plan
[`2026-08-02-references-pointer-link-truth`](../plans/2026-08-02-references-pointer-link-truth.md)
ratified adjudication O over that family: **O(1)** — a references/ pointer is best-effort
enrichment, never the sole carrier of a blocking rule (decisive rules stay inline on the card);
**O(2)** — the agent-card skeleton is the owner-relative `(skills/war/references/<file>.md)`
form; **O(3)** — no plugin-root anchor is introduced. A dispatched seat's cwd, however, is the
target repo's task worktree, so the owner-relative form resolves only when WAR runs on the plugin
repo itself (issue #1364): on a foreign target repo the link resolves to nothing and the seat
loses the anti-false-block enrichment, biasing dispatched seats toward wrongly blocking
legitimate work. This ADR supersedes the **anchor half** of O(2)/O(3) — the skeleton is now
`${CLAUDE_PLUGIN_ROOT}/`-anchored — while **O(1) remains the invariant mitigation, untouched**.
The supersession is recorded here, never as silent drift.

## Decision

**The agent-card references/ pointer skeleton is the plugin-root-anchored form
`](${CLAUDE_PLUGIN_ROOT}/skills/…)`, superseding the owner-relative skeleton of adjudication
O(2)/O(3); adjudication O(1) — pointer as best-effort enrichment, decisive rules inline —
stands.**

1. **Supersession scope: agent cards only.** The anchor supersession applies to dispatched-seat
   surfaces (`agents/*.md`). `skills/*/SKILL.md`'s own owner-relative `references/<file>`
   pointer skeleton is untouched — skill surfaces are read in-plugin — and
   the **trigger-grammar half** of [ADR 0042](0042-prompt-surface-budgets.md)'s pointer doctrine
   (the `when <trigger>, read references/<file>` shape; a pointer without a trigger is a defect)
   is unchanged by this ADR. Its **path half** on agent cards is the anchored form above, as for
   O(2)/O(3). Backticked non-link citations and the refiner card's `../docs/adr/`
   link are outside the family (the plan's D2 scope).

2. **Seat-capability matrix.** Resolution of the anchored form is per-seat:
   - **Bash-capable seats** (the worker and refiner) expand the placeholder in their own
     shell — the landed Provision-barrier precedent: every `hooks/hooks.json` hook command is a
     `${CLAUDE_PLUGIN_ROOT}/hooks/<script>` string, and the `SCRIPT` const in
     `skills/war/assets/workflow-template.js`
     (`'${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh'`) is expanded by the
     refiner seat's shell on every landed Provision barrier (assumption A1 in the plan's
     ledger).
   - **The auditor seat** cannot expand it — its fail-closed read-only git guard
     (`hooks/validate-auditor-git.sh`) denies `$`/`{`/`}` outright. The D3 resolution line
     each card carries (placeholder arrived unexpanded AND the repo under review is the plugin
     itself ⇒ strip the `${CLAUDE_PLUGIN_ROOT}/` prefix and resolve repo-relative) is a
     **plugin-repo-only** path: it fires only when the repo under review is the plugin itself.
     On a foreign target repo the auditor seat has no D3 resolution at all: resolution rests on
     harness substitution of the placeholder in card body text, recorded
     **unverified-by-construction** — no card-injection probe path exists (agent dispatch is by
     registry type name only; cards come from the installed plugin), per the /red-team
     2026-08-18 discharge of probe A2 — and O(1)'s inline decisive rules are the operative
     carrier. On a foreign repo an auditor that resolves nothing is never worse off than under
     the prior unresolvable owner-relative form — the decisive rules stay inline (O(1)).
   - **Seats with no shell at all** (the servitor's confinement denies Bash entirely —
     [ADR 0002](0002-scope-by-agent-type.md); the setup-scout's card declares
     `tools: Read, Grep, Glob`) reach the D3 resolution line only on the plugin repo. On a
     foreign target repo they fall straight through to O(1)'s inline decisive rules.

   The D3 line is the ratified default (assumption A3). Had /red-team vetoed it, the accepted
   residual would be recorded explicitly in the plan's backstops — never waived in prose
   ([ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md)'s ratified-backstops
   rule).

3. **Corrected precedent attribution.** The mined lesson
   [`agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo`](../learnings/archive/agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo.md)
   names "the `${CLAUDE_PLUGIN_ROOT}/skills/war/references/<file>.md` form already used in hook
   error output"; **no hook script emits that form in error output** — the live precedents are
   the `hooks/hooks.json` command strings and the `workflow-template.js` `SCRIPT` const
   (verified at conversion). The lesson's attribution is stale and stays as written per the
   RESOLVED-stamp convention (the stamp freezes the body); **this ADR is the corrected record.**

4. **OLD-shape-absent gate discipline.** A family shape flip lands with a **mechanical
   OLD-shape-absent assert** — here: no bare `](skills/` link target on any card, in
   `skills/war/assets/workflow-template.test.mjs` — never a new-present count alone. The
   new-present count-pins prove the anchored form arrived; only the OLD-absent assert proves the
   old shape extinct. The flip and both assert families land in one diff
   ([ADR 0025](0025-drift-guard-discipline.md): the guard travels with the fact).

## Consequences

- The glossary term **Plugin-root-anchored pointer** (GLOSSARY.md, beside **Trigger pointer**)
  names the new family shape; future pointer work on agent cards uses the anchored skeleton and
  re-pins the per-card counts in the same diff as any legitimate addition.
- `worker-servitor-edges.md`'s header does not claim "no path form resolves this file" on a
  foreign repo, and it does not present the D3 line as a foreign-repo resolution path.
  Resolution is established for Bash-capable seats ("expand the placeholder in their own shell …
  even on a foreign target repo") and recorded as a residual for the auditor seat, per the matrix
  above.
- A future plan reverting to a repo-relative or owner-relative card skeleton must supersede this
  ADR explicitly and flip the OLD/NEW assert families in the same diff — the same discipline
  this ADR records.

## Decision log

- 2026-09-03 · D3 scope, and the scope of item 1's "unchanged" · #1981, #1537, #1545, #1678 (plan `2026-08-25-doc-truth-and-drift-guard-debt` Task 1.3) · failed because: the "fallback-first" framing presented the plugin-repo-only D3 line as a foreign-repo resolution path · retired: docs/adr/0047-agent-card-pointer-skeleton-plugin-root-anchored.md @ 4ddce544
- 2026-11-05 · the glossary moved to GLOSSARY.md · #2636 · retired: docs/adr/0047-agent-card-pointer-skeleton-plugin-root-anchored.md @ b31d2203
- 2026-11-11 · adopted under the living-ADR law · #1850 (ADR 0063)
