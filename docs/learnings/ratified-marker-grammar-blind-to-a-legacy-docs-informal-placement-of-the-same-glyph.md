---
name: ratified-marker-grammar-blind-to-a-legacy-docs-informal-placement-of-the-same-glyph
description: "A new ‡-marker grammar only reads its ratified cell location, missing a pre-existing plan's informal decision-id-column placement of the same glyph"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: ratified-marker-grammar-blind-to-a-legacy-docs-informal-placement-of-the-same-glyph
  phase: "2026-08-25-authoring-doctrine-and-lint-coherence/phase-2 task 2.1 (D3, D3-inventory)"
  keywords: 
    - marker grammar migration
    - informal convention
    - decision-id column
    - twice-read-inventory
    - PIN_MARKED
    - double-dagger
    - grandfathered document
    - grammar ratification blind spot
    - legacy plan
    - backward compatibility gap
  tags: 
    - war-strategy
    - plan-literal-lint
    - doctrine
    - authoring-contract
  created: 2026-09-02
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-09-03T05:12:00.886Z
---

# A newly-ratified marker grammar can be blind to an older document's informal placement of the same glyph

**Found (code-verified — landed tip `abb1f1515977b54fe9153ec178b21153ec04ff4a` on
`dev/2026-08-25-authoring-doctrine-and-lint-coherence`, read via the `_refinery39` worktree,
gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-08-25-authoring-doctrine-and-lint-coherence-2026-09-02-r3/_refinery/`,
`HEAD` byte-equal to the landed tip; `skills/war-strategy/assets/plan-literal-lint.mjs` line 146,
`const PIN_MARKED = /\bPIN-(\d+)‡/g;`, the report-only ‡ inventory rule (D3/D3-inventory)):**
Phase 2 Task 1 ratified the `‡` twice-read marker's grammar as living in the Source cell (a
`PIN-<n>‡` id) or the landing-class cell (leading, trailing, or arrow-pair form), per Phase 1's
prior settlement (see [[doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum]]).
`plan-literal-lint.mjs`'s new inventory rule reads exactly those two locations. A pre-existing
plan in the same repo — `docs/plans/2026-08-24-authoring-side-verification.md` — carries its own
preamble claim, "Duty-class rows are marked ‡", and places the glyph in the **decision-id column**
instead (e.g. `D2 ‡`, `D4 ‡`, `D6 ‡`, `D7 ‡`, `D8 ‡`, `D13 ‡` — six rows by the plan's own count).
`parseDesignTree()` never reads the decision-id column at all, so re-linting that historical plan
under the new rule reports **zero** inventory rows despite its own prose claiming six.

**Why it doesn't break anything today:** the historical plan predates the ratified grammar and is
outside this task's file list and Non-goals — the gap is a pre-existing informal convention the
new grammar was never asked to retrofit, not a regression this task introduced. Disposition was
`note`, never a hold.

**The durable pattern:** when a plan ratifies a NEW placement grammar for a marker/glyph that
already appears informally somewhere else in the repo's own historical documents, the new
parser/lint will not recognize the old placement by default — a closed-set grammar (Source cell
or landing-class cell here) is, by construction, blind to any column/location outside that set.
This is a distinct failure shape from [[legacy-arm-checked-first-cannot-discriminate-a-degenerate-new-format-plan]]
(that lesson is about a coarse presence/absence *signal* being unable to tell "old regime" from
"degenerate new regime"; this one is about a *parser's read locations* being a closed set that
never widens to catch an informal precedent elsewhere in the same repo).

**How to apply:** when ratifying a new marker/glyph placement grammar, grep the repo's own
existing documents (not just the target authoring surface) for prior informal uses of the same
glyph before assuming a report-only inventory rule's zero-count on an old document means "nothing
to report" rather than "the parser can't see it." If a historical document's own prose claims N
marked rows and the new rule's inventory reports 0, that is itself the signal that a
grandfathered convention exists and was not (and may not need to be) migrated.

**Locate-cue (verify still present before acting):** `skills/war-strategy/assets/plan-literal-lint.mjs`,
`PIN_MARKED` at line 146 and its sole use inside the `twice-read-inventory` rule (~line 505-517);
`docs/plans/2026-08-24-authoring-side-verification.md`'s preamble sentence "Duty-class rows are
marked ‡" and its decision-id-column `‡` marks (e.g. `D2 ‡`).

## Related

[[doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum]] — the same ‡
marker's grammar settlement this rule implements.
[[legacy-arm-checked-first-cannot-discriminate-a-degenerate-new-format-plan]] — a different but
adjacent "the new regime can't see the old one" shape (coarse absent-signal vs. closed-set parse
location).
