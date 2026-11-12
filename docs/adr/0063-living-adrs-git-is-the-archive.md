# Living ADRs: git is the archive

**Status:** accepted (2026-11-11; plan `docs/plans/2026-11-08-doc-truth-drift-and-adr-hygiene.md`,
D2, D37, PIN-2, PIN-27 and PIN-37; issue #1850)

## Context

Until now an ADR was append-only. A change to a decision landed as a dated `## Amendment (…)`,
`## Addendum (…)` or `## Correction (…)` section, or as a bold dated run-in paragraph, below the
text it changed. The body above kept the old text. A reader had to replay every amendment in order
to learn the current law, and a test that pinned a fact had to anchor on an amendment heading.
At `a3511c79` 32 ADRs carried an amendment heading and 45 carried no `## Decision log`.

The old text is not lost when a body is rewritten. Git keeps every version of every file. The
unrun plan `docs/plans/2026-09-06-doc-truth-drift-guards-and-authoring-doctrine.md` ruled this law
(its D1, PIN-2, PIN-26 and PIN-28). This ADR carries that ruling. The operator added the
`failed because:` field on 2026-11-09, so a decision that did not work stays readable.

## Decision

1. **Living ADR.** An ADR body carries current law. A change rewrites the body in place. Git is
   the archive: the retired text stays reachable at the commit that held it. No ADR adds a dated
   amendment, addendum or correction section, and no ADR adds a bold dated run-in paragraph.
2. **Decision log.** Every ADR keeps a `## Decision log` section. Each change adds one line in
   this form: `- YYYY-MM-DD · <what flipped> · <driving issue>`. When the line retires text, it
   ends with `· retired: docs/adr/<file> @ <sha>`.
3. **The `retired:` sha.** The sha is the commit that introduced the retired text, never the commit
   that last held it. Find it as the oldest hit of
   `git log --reverse -S'<retired literal>' --format=%h -- <file> | head -1`.
4. **The `failed because:` field.** It is optional. A Decision-log line that reverses or narrows
   an earlier decision carries `· failed because: <one clause>` after the driving issue and before
   `retired:`. A line that only extends a rule carries none. The clause says why the old decision
   did not work. It never restates the old text, because git holds that text behind the `retired:`
   sha.
5. **Considered options.** `## Considered options` is a record. A rewrite may add to it and never
   trims it, because a rejected option records what was tried.
6. **Three citation forms.**
   - A bare citation (`ADR 0013`) means current law.
   - A dated citation (`ADR 0013 (2026-08-25)` or `ADR 0013 amendment 2026-08-25`) resolves to
     that date's Decision-log line.
   - A Sha-pinned citation (`docs/adr/<file> @ <sha>`) means the file at that commit. Cite a
     retired text this way.
7. **Folds.** A fold rewrites a dated section into the body as current law. Its Decision-log line
   carries the folded heading's date and title. An older "ADR NNNN Amendment (YYYY-MM-DD)" citation
   then resolves under the dated citation form. A fold restates current law. It never changes a
   decision.
8. **Policy lifecycle versus record.** Policy surfaces are rewritten in place: `docs/adr/`,
   `docs/plans/`, `docs/roadmaps/`, `skills/*/references/`, `skills/*/SKILL.md`, `agents/*.md`,
   `CONTEXT.md`, `README.md`, `CLAUDE.md` and the `hooks/reply-standard/` cards. Records are written
   once and never rewritten: `docs/red-team/` reports, run manifests, `docs/learnings/` frontmatter,
   consumed `docs/specs/` and released `CHANGELOG.md` entries.
9. **Retired literals.** A drift guard asserts a retired literal absent on every policy home, ADRs
   included. No ADR is exempt from an absence guard because it was once append-only.

## Consequences

- Phase 2 of the plan migrates the corpus in one task on one branch. It folds every amendment,
  addendum and correction section, every `Amendments` container and every bold dated run-in into
  its ADR body. It adds a Decision-log line for each fold and a `## Decision log` to every ADR
  that lacks one. It re-anchors every test that extracts by an amendment token, and it adds a guard
  row that reds on any amendment heading in `docs/adr/0*.md`.
- Until that migration lands, older ADRs still carry dated sections. A dated citation of one of
  them still resolves to its section.
- The `living-adr-terms` row in `skills/war/assets/skill-doc-contracts.test.mjs` finds this ADR by
  slug, so its number may change at land time. Two files with this slug red the row.
- `skills/war/references/glossary-cold.md` defines **Living ADR**, **Decision log** and
  **Sha-pinned citation**. `GLOSSARY.md` carries one pointer row to them.

## Considered options

- **Keep append-only amendments.** Rejected: a reader must replay every amendment to learn current
  law, and tests anchor on dated headings that each new amendment moves.
- **Move retired text to an `archive/` file.** Rejected: git already archives every version, and a
  second copy can drift from the history it claims to hold.

## Decision log

- 2026-11-11 · ADR authored in the living form; adopts the living-ADR law, the three citation forms and the optional failed-because field · issue #1850 (plan 2026-11-08-doc-truth-drift-and-adr-hygiene, Task 1.1, #2872)
