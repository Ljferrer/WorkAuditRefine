# Specs are posterity; live surfaces cite maintained homes

**Status:** accepted (operator-ratified F7 + README extension, 2026-08-05; ratified and
guarded by [the plan](../plans/2026-08-05-precision-chain-and-loop-breaker.md), Task 5.4)

A design spec (`docs/specs/`) is an *input shape*: it exists to be consumed — by
`/war-strategy` conversion into a merged plan, or as the decision digest a merged plan's
Part 1 absorbs ([ADR 0044](0044-authoring-contract-and-merged-artifact.md)). Once landed,
a spec is a historical record of what was proposed, and it is **never updated**: the
2026-08-05 red-team sweep found retired wordings (a four-status enum, the judgment-path
description, a one-sentence step 3) surviving verbatim in landed specs that live skill
surfaces still cited as authority. Every live citation into a spec is a link whose target
rots by design — the doctrine moves on (into ADRs, `references/` files, agent cards,
code, memories) while the spec freezes, so the citation eventually asserts stale doctrine
with a straight face.

## Decision

**`docs/specs/` files are posterity — never updated, and never cited by skill doctrine
surfaces or by `README.md`. Live surfaces cite only maintained-truthful homes: ADRs,
`references/` files, agent cards, code, and memories.**

- **Posterity means frozen.** A landed spec is never edited to track reality — not even
  to fix a wording a later plan retires. Retired wordings inside `docs/specs/` are
  sanctioned historical survivors; OLD-absent sweeps are scoped to live surfaces only.
- **Reach includes the README** (the README extension, operator-ratified 2026-08-05,
  superseding a skill-surfaces-only scope): the README's five "Design notes:
  `docs/specs/…`" citations are retired, each repointed at its maintained home or
  deleted where the doctrine already lives inline. The same retire-or-repoint rule
  applied to the skill-surface citations (`skills/war/references/design.md`,
  `skills/war-campaign/SKILL.md`, `skills/aftermath/SKILL.md`,
  `skills/lessons-learned/references/seeding.md`).
- **Input-shape mechanics are carved out.** Describing *how specs arrive* is not citing
  one: path-shape examples (placeholder tokens such as `<slug>`, `YYYY-MM-DD`, a
  trailing ellipsis), glob patterns, the survey-corps output directory (`docs/specs/` as
  a bare path), and fenced command/template examples all stay. The carve-outs are
  pattern-matched, case-insensitively.
- **The guard.** `skills/_shared/doc-cli-consistency.test.mjs` asserts no file in its
  scanned corpus cites a concrete `docs/specs/` path, with the carve-outs above; its
  corpus is widened to the retired-citation homes the hand-enumerated list could not see
  (`skills/lessons-learned/references/seeding.md`, `skills/war/references/design.md`)
  and — for this rule — `README.md`.
- **Code comments and ADRs are out of scope.** A code comment citing the spec it
  implemented is provenance, not doctrine a reader is told to trust as current; ADRs are
  themselves records and may cite the spec that motivated them. The rule binds the
  surfaces a reader consults for *current* behavior: skill doctrine surfaces and the
  README.

## Considered options

- **Update specs in place (rejected).** Editing landed specs to track reality erases the
  historical record and doubles every doctrine home — the exact drift this repo's
  merged-plan artifact exists to prevent ([ADR 0044](0044-authoring-contract-and-merged-artifact.md)).
- **Retire citations without a guard (rejected).** The red-team sweep found these
  citations precisely because nothing red-lined them; an unguarded rule regrows the
  problem one convenient "Design notes:" link at a time.
- **Guard every file in the repo (rejected).** Plans, red-team reports, ADRs, and code
  comments legitimately cite specs as provenance; a repo-wide ban would force dishonest
  rewording of honest history. The corpus is the doctrine surfaces readers trust as
  current.

## Relationship to prior ADRs

- [ADR 0044](0044-authoring-contract-and-merged-artifact.md) — the merged plan is the
  execution artifact and a spec is an input shape only; this ADR adds the temporal
  consequence: consumed input shapes are posterity, so live surfaces must not cite them.
- [ADR 0042](0042-prompt-surface-budgets.md) — doctrine placement (hot/cold law) names
  the maintained homes new doctrine goes to; this ADR requires citations to point at
  those homes rather than at frozen specs.
- [ADR 0025](0025-drift-guard-discipline.md) — the citation rule ships with its own
  drift guard, per the standing discipline.
