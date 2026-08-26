---
name: doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum
description: "A doctrine sentence can gate on 'landing class is X' for a value X that the same doctrine's…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum
  phase: "authoring-side-verification/phase-1 (tasks 1.1, 1.2 audits)"
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
  tags: 
    - war
    - war-strategy
    - doctrine
    - plan-authoring
    - audit-findings
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T05:10:27.726Z
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

**Status at land:** unresolved — task 1.1's second gate-audit round graded this Minor with
`disposition: follow-up` (not absorbed pre-land); no fix landed in this phase.

**Locate-cue (verify still present before acting):**
`skills/war-strategy/references/plan-interview.md`, the Stage-4 gate-1 pair-duty paragraph
(the "landing class is a duty or fence" sentence), and the class→section map three lines below it
in the same file's `## The ratified-pin ledger + the WAIVE channel` section.

## Related

[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]] — a different doctrine/lint asymmetry
class (case sensitivity, not enum membership) from the same repo's structural-test family.
