---
name: doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum
description: "Gate on the row marker (‡-marked rows), never on 'landing class is X' with X outside the ratified class enum. Resolved."
metadata: 
  promoted: claude/authoring-side-verification-600a79@phase-1
  node_type: memory
  type: project
  provenance: code-verified
  slug: doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum
  phase: "authoring-side-verification/phase-1 (tasks 1.1, 1.2 audits); resolved 2026-08-25-authoring-doctrine-and-lint-coherence/phase-1 (tasks 1.1-1.3)"
  keywords: 
    - landing class
    - duty or fence
    - class-to-section map
    - ratified enum
    - undefined class value
    - self-rescuing parenthetical
    - row marker vs column value
    - plan-literal-lint
    - CLASS_TOKEN
    - fail-open unknown token
    - PIN-25
    - twice-read rule
    - resolved
    - vocabulary settlement
    - double-dagger marker
    - orthogonal row marker
  tags: 
    - war
    - war-strategy
    - doctrine
    - plan-authoring
    - audit-findings
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-09-03T02:16:33.676Z
---

# A doctrine sentence's "landing class is X" can name a value outside the same doctrine's ratified enum

**Rule:** when a plan adds a row-level marker (here `‡` for duty or fence pins) alongside an existing closed enum (here the six landing classes), never phrase a gate as "landing class is `<marker-name>`". That is a category error even when the marker is real and defined elsewhere. Gate on the row axis ("pins on ‡-marked rows") and keep the enum vocabulary closed.

**Fixed in** `2026-08-25-authoring-doctrine-and-lint-coherence` phase 1 (vocabulary settlement). `‡` is now a normative, orthogonal, operator-applied row marker, defined once in `skills/war-strategy/references/plan-interview.md`'s ratified-pin ledger section (the "**The `‡` twice-read marker:**" bullet), and never a class token. Both twice-read clauses (`plan-interview.md`'s Stage-4 gate-1 sentence and `strategy-verifier.md`'s `## The three leak shapes + the ‡ twice-read rule` section) key on `‡` alone. The phrase "landing class is a duty" is absent from `plan-interview.md`, `strategy-verifier.md`, and `skills/war-strategy/SKILL.md`. `SKILL.md`'s Example A/B design trees carry a `Landing class` column with `‡`-marked rows such as `guardrail ‡`.

**What the defect looked like:** `plan-interview.md` floated the twice-read rule as "Pins whose landing class is a duty or fence (marked ‡ in the design tree) are read twice", while the same file's class-to-section map enumerated exactly `guardrail`, `slice`, `end-state`, `backstop`, `context`, `non-goal`. Neither `duty` nor `fence` was a member. Every ‡-marked row carried an ordinary class; ‡ was a row marker layered on top of the class cell.

**Why it did not break anything:** the parenthetical supplied the real marker, so a careful reader recovered. `plan-literal-lint.mjs`'s `CLASS_TOKEN` accepts only the six values and `parseClasses()` silently skips an unknown token, so a cell written `duty` degraded to class-less citation rather than an error. The imprecision verbatim-mirrored a higher-authority surface (`strategy-verifier.md`), so two audit seats graded it Nit-to-Minor as inherited, not invented.

**How to apply:** when a doctrine sentence gates on an enum value, check the value against the enum's ratified list in the same file. Nothing in the lint pipeline catches this class of error: the unknown-token skip is silent, and no test asserts every "landing class is X" sentence's `X` is a member.

**Locate-cue:** `skills/war-strategy/references/plan-interview.md`'s `## The ratified-pin ledger + the WAIVE channel` section, the "**The `‡` twice-read marker:**" bullet; `skills/war-strategy/references/strategy-verifier.md`'s `## The three leak shapes + the ‡ twice-read rule` section; `skills/war-strategy/SKILL.md`'s Example A/B design trees (`Landing class` column).

## Related

[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]]: a different doctrine/lint asymmetry class (case sensitivity, not enum membership) from the same structural-test family.
