# Disposition eligibility — the auditor's absorb / ask routing calls

Verbatim eviction from `agents/war-auditor.md` (ask-disposition Task 1.1, ADR 0042; the two
eligibility blockquotes below were byte-identical to their pre-eviction card text **at eviction
time** — the `> ` blockquote form kept intact). The card keeps the DISPOSITION RULE sentence (the
byte-mirror of the dispatched prompt) plus one fixed-shape trigger pointer to this file.
Positional words inside the moved blocks refer to their original card position — they sat in the
card's Verdict section, directly under the Cost-claim rule bullet. The Ask eligibility section
below is NEW prose (this plan's channel), not an eviction.

## Absorb eligibility (evicted card text)

> **`disposition:'absorb'` (for `--ace` and the phase-close sweep).** Set `disposition:'absorb'` on a `Minor`/`Nit` finding **only** when the fix is **mechanical, self-contained, single-file, non-load-bearing**, touches **no** version/release slot, and does **NOT** remove or edit a line carrying a `ponytail:`/deliberate-mirror rationale comment — otherwise route it honestly (`follow-up` with the why-not-absorbable, or `note`; fail-closed). You read the code, so you own these refusals; the orchestrator adds only a deterministic release-slot filename backstop (`plugin.json`/`marketplace.json`). Omitting `disposition` is always safe — the severity default applies. Absorbs are attempted as ONE ace batch commit; on a re-audit regression the engine's bounded ace bisection ladder (`aceBisect` in `workflow-template.js`) salvages what it can — you may be re-convened at batch or subset SHAs; only finally-failing subsets demote to `follow-up`, every demotion logged per subset. **`autoFixable` is DEPRECATED**: `autoFixable:true` reads as `disposition:'absorb'` for one release, then it is removed.
> **Source-derivable eligibility.** A doc fact deterministically re-derivable from a machine-readable in-repo source (a JSON field, an exported constant, an enum member) is **mechanical regardless of value count**; "single-file" reads on the fix's **write footprint** — the doc being corrected — never the source it reads from. Only the accompanying policy question (mirror the value vs point at the source) routes as an issue.

## Ask eligibility (`disposition:'ask'` — the operator's question channel)

Set `disposition:'ask'` on a `Minor`/`Nit` finding **only** when the finding is
**decision-shaped**: resolving it requires a policy or design ruling only the operator can make
(mirror the value vs point at the source, keep vs retire a contract, which of two lawful scopes),
and each branch of that ruling implies different work. An ask **must** carry the `ask` field —
`question` naming the decision needed, `fork` naming the two branches — or it is schema-rejected.
Asks are **Minor/Nit-only by construction**: a blocking decision gap is `escalate` territory
(name the missing plan decision in `escalate_reason`), never an ask. An ask is **parked unruled**
in the run artifact (the return's `asks[]` and the handoff's ninth `asks` key) and ruled at the
Checkpoint strike-list gate — it is **never filed unruled**, never demoted by machinery, and
never enters `--ace` or the phase-close sweep. A question you can answer yourself from the code
or the plan is not an ask — route it as absorb / follow-up / note honestly.
