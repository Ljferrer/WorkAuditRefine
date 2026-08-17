---
name: lacks-case-sensitive-vs-has-i-presence-pin-asymmetry
description: "has_i presence pin is case-insensitive but lacks() absence assert is not; a benign re-case evades it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: lacks-case-sensitive-vs-has-i-presence-pin-asymmetry
  phase: 2026-08-02-redteam-doctrine-and-guards/1.5
  keywords: 
    - shell structural test
    - has_i
    - lacks
    - case sensitivity
    - case-insensitive grep
    - default-flip guard
    - OLD-absent assert
    - sentence-case revert
    - war-pipeline-structure.test.sh
    - doc drift guard
    - lacks_i
    - positive control
    - -i flag load-bearing
  tags: 
    - testing
    - structural-test
    - shell
    - gotcha
  created: 2026-08-03
  updated: 2026-08-05
  related: "[[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]"
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-05T12:39:55.410Z
---

# A case-insensitive presence pin paired with a case-sensitive absence assert is an asymmetric guard — and the unsafe direction is the absence half

## The gotcha

`skills/war-machine/war-pipeline-structure.test.sh` ships two related helpers:
- `has_i()` — `grep -qiF`, case-**insensitive** — documented as reserved "For PROSE tokens that a
  benign re-casing (sentence case) must not false-negate".
- `lacks()` — `strip_prose | grep -qF`, case-**sensitive** — used for OLD-absent asserts (proving a
  retired phrase is gone).

When a default-flip drift guard's NEW-content presence pins use `has_i()` (correctly tolerant of
re-casing) but its paired OLD-phrase-absent assert reuses `lacks()`, the pair is asymmetric. On a
**presence** pin, case-sensitivity produces a false RED (noisy, but safe — a reviewer notices). On an
**absence** pin, case-sensitivity produces a false GREEN: a revert that re-cases the retired phrase
(e.g. "two authoring rules" reverted to "Two authoring rules") is invisible to `grep -qF`, so the
absence assert stays green while the doctrine it exists to guard is actually wrong — exactly the
regression a default-flip OLD-absent assert exists to catch.

## Concrete instance (code-verified, live and unfixed at 2026-08-02-redteam-doctrine-and-guards land)

`skills/war-machine/war-pipeline-structure.test.sh`'s count-word flip for `skills/war-strategy/SKILL.md`
§3 ("two authoring rules" → "three authoring rules") pins the new rule's content with `has_i()` calls,
but the paired retirement asserts are:
```
lacks "$WAR_STRATEGY" "$retired_count_a rules"
lacks "$WAR_STRATEGY" "$retired_count_b rules"
```
— routed through case-sensitive `lacks()`. No `lacks_i()` helper exists in the file. The gate-audit
flagged this as Minor with `disposition: absorb, phaseClose: true` (intended to be fixed at phase
close); the phase-close polish task's landed diff did not add it, and it is still absent at the
phase's landed tip.

Locate cue: verify still present before acting — found at
`skills/war-machine/war-pipeline-structure.test.sh`: `has_i()` definition, `lacks()` definition, and
the count-flip `lacks "$WAR_STRATEGY" "$retired_count_a/b rules"` call sites.

## The durable rule

Whenever a structural-test helper library ships a case-insensitive presence-pin variant specifically
to tolerate benign re-casing of prose, any **paired absence assert over the same prose family** must
use an equally case-insensitive helper (a `lacks_i()` mirroring `has_i()`'s `grep -qiF`) — otherwise
the absence half is strictly weaker than the presence half it is meant to mirror, and the weaker
direction is precisely the one that hides a regression rather than merely being noisy about one.

## RESOLVED (2026-08-05, phase `2026-08-04-interview-and-authoring-contract`/1, Task 3) — `lacks_i()` now exists, cited by slug in its own header comment

Code-verified at the landed tip (`378b868a5bab995f86c74ec8aad0d50d11516199` on
`dev/2026-08-05-2026-08-04-interview-and-authoring-contract`, read via the `_refinery` worktree
whose `gitdir` physical path contains this plan's slug): `skills/war-machine/war-pipeline-structure.test.sh`
now defines `lacks_i()` (line 100 at this pin) — `strip_prose < "$1" | grep -qiF -e "$2"`, body
byte-identical to `lacks()` except the `-i` flag — with a header comment that explicitly names this
lesson: `"the recorded asymmetry class ([[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]])"`.
The helper landed one plan/task earlier than its own plan's slice assigned it to (Task 3, not the
plan's Task 8) because Task 3's own case-insensitive old-absent pins needed it immediately — a
required-by-construction landing, not scope creep; downstream dispatch should treat the helper as
already present rather than re-declaring it. The original concrete instance this lesson named (the
`skills/war-strategy/SKILL.md` §3 count-word flip's `lacks()` calls) was not itself examined this
pass — the resolution is the helper's existence and reuse pattern, not necessarily that specific
call site's migration; verify that instance separately before citing it as fixed too.

**New residual nuance surfaced by the SAME landing, not yet closed:** the phase's gate-audit
(disposition `follow-up`, Minor) flagged that `lacks_i()`'s distinguishing `-i` flag, while now
proven load-bearing by a committed positive control (a re-cased fixture asserted to be caught
case-insensitively and missed by plain `grep -qF`), is proven **through a duplicated inline
pipeline** (`printf ... | strip_prose | grep -qiF/-qF`) rather than **through the helper function
itself** — so a future mutation scoped only to `lacks_i()`'s own body (e.g. accidentally dropping
its `-i`) would leave the committed control green while the helper silently regressed to
`lacks()`'s behavior. The suggested repair is to route the control through `lacks_i()` itself (e.g.
a shared stdin-reading inner function both the real call sites and the control invoke) rather than
re-implementing its pipeline as a parallel literal. Recorded here as the natural continuation of
this lesson's asymmetry class: closing "does the absence-check exist" can still leave open "is the
absence-check's own load-bearing flag *itself* regression-proof."
