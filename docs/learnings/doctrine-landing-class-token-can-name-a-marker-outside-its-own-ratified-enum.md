---
name: doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum
description: "A doctrine sentence can gate on 'landing class is X' for a value X that the same doctrine's…"
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

**Found (code-verified — landed tip `d29d06eee9dee1d7ba57681650c608df02204f30` on
`claude/authoring-side-verification-600a79`, read via the `_refinery25` worktree,
gitdir physical path `<repo-root>/.claude/war-worktrees/authoring-side-verification-2026-08-24/_refinery/`,
`HEAD` byte-equal to the landed tip):** `skills/war-strategy/references/plan-interview.md` lines
121-122 float the duty-class twice-read rule as "Pins whose landing class is a duty or fence
(marked ‡ in the design tree) are read **twice** at echo-back reconciliation." Three lines later
(145-147) the SAME file's own ratified class→section map enumerates exactly six landing-class
values: `guardrail`, `slice`, `end-state`, `backstop`, `context`, `non-goal`. Neither `duty` nor
`fence` is a member. An interviewer reading the twice-read sentence literally, looking for a
design-tree cell that reads `duty`, finds none — every ‡-marked row in the plan under audit
carries an ordinary class like `guardrail` or `slice`; ‡ is a **row-level** marker layered on top
of an ordinary landing-class cell, not itself a landing-class value.

**Why it doesn't break anything today:** the sentence is self-rescuing — the parenthetical `(marked
‡ in the design tree)` supplies the operative, actually-defined marker, so a careful reader
recovers correctly. Downstream, `plan-literal-lint.mjs`'s `CLASS_TOKEN` accepts only the six
ratified values and `parseClasses()` silently skips an unrecognized token (fail-open by design),
so a cell literally written `duty` would degrade to class-less anywhere-citation rather than error
— consistent with this plan's own "fail-open posture throughout" guardrail. Two independent
auditor seats (task 1.2's charter audit, task 1.1's doctrine audit) both flagged the same
imprecision independently and both graded it Nit-to-Minor, never a blocking defect, because the
doctrine's own sibling surface (`strategy-verifier.md`) mirrors the identical phrasing — an
imprecise claim that verbatim-mirrors a higher-authority surface reads as inherited, not invented.

**Pattern to watch for:** when a plan floors a NEW row-level marker (here: ‡ for duty/fence-class
rows) alongside an EXISTING closed enum (here: the six landing classes), a doctrine sentence
gating on "landing class is `<marker-name>`" is a category error even when the marker itself is
real and well-defined elsewhere. The fix is cheap and mechanical once spotted — phrase the gate on
the row/marker axis ("pins on ‡-marked rows"), never smuggle a row-level attribute into
column-level (enum) language — but nothing in the authoring/lint pipeline currently catches this
class of error: the lint's unknown-token skip is silent, and no test asserts every "landing class
is X" sentence's `X` is a member of the ratified enum.

**Status at land:** RESOLVED (code-verified — landed tip `1582717d008b08e0e56e7951c27720efc0c21cfe`
on `dev/2026-08-25-authoring-doctrine-and-lint-coherence`, read via the `_refinery39` worktree,
gitdir physical path `<repo-root>/.claude/war-worktrees/2026-08-25-authoring-doctrine-and-lint-coherence-2026-09-02-r3/_refinery/`,
`HEAD` byte-equal to the landed tip): plan `2026-08-25-authoring-doctrine-and-lint-coherence`'s
Phase 1 ("Vocabulary settlement (doctrine only)") settled `‡` as a normative, orthogonal,
operator-applied row marker — never a landing-class value — defined once in
`plan-interview.md`'s ratified-pin ledger section ("**The `‡` twice-read marker:** `‡` is
appended to the pin id, or to the landing-class cell of the design-tree row... The marker is
orthogonal to landing class: `‡` is never a class token, and the class vocabulary stays the
closed six-class set above."). Both twice-read clauses (`plan-interview.md`'s Stage-4 gate-1
sentence and `strategy-verifier.md`'s `## The three leak shapes + the ‡ twice-read rule`
section, "**‡-marked twice-read rule**: the operator marks a pin ‡ in the design tree...") now key
on `‡` alone; the phrase "landing class is a duty" is confirmed absent from
`plan-interview.md`, `strategy-verifier.md`, and `skills/war-strategy/SKILL.md` at the landed
tip. `SKILL.md`'s Example A/B design trees also gained a `Landing class` column with `‡`-marked
rows (e.g. `PIN-1→guardrail ‡`, `guardrail ‡`) and Evidence-consumed blocks. The fix matches this
lesson's own predicted shape exactly: "phrase the gate on the row/marker axis... never smuggle a
row-level attribute into column-level (enum) language."

**Locate-cue (verify still present before acting):**
`skills/war-strategy/references/plan-interview.md`'s `## The ratified-pin ledger + the WAIVE
channel` section, the "**The `‡` twice-read marker:**" bullet; `skills/war-strategy/references/strategy-verifier.md`'s `## The three leak shapes + the ‡ twice-read rule` section; and
`skills/war-strategy/SKILL.md`'s Example A/B design trees (`Landing class` column).

## Related

[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]] — a different doctrine/lint asymmetry
class (case sensitivity, not enum membership) from the same repo's structural-test family.
