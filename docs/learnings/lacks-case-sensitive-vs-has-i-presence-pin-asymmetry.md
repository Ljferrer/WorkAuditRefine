---
name: lacks-case-sensitive-vs-has-i-presence-pin-asymmetry
description: "A shell structural test's case-insensitive has_i() presence pin paired with a case-sensitive lacks() OLD-absent assert is asymmetric — the absence half silently passes on a benign re-case of the guarded prose"
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
  tags: 
    - testing
    - structural-test
    - shell
    - gotcha
  created: 2026-08-03
  related: "[[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]"
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T08:23:45.594Z
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
