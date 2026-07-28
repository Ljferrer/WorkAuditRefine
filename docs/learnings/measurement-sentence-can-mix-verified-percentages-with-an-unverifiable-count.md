---
name: measurement-sentence-can-mix-verified-percentages-with-an-unverifiable-count
description: "A spec/ADR growth claim can pack a verified per-surface percentage (+33%, +24%) alongside an unverifiable aggregate count ('22 patch releases') in the same sentence — the percentages reproducing exactly does not vouch for the count; fix by pinning the concrete window rather than hand-correcting the count"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: measurement-sentence-can-mix-verified-percentages-with-an-unverifiable-count
  phase: "prompt-surface-simplification/phase-1 (Governance), landed dev/2026-07-28-prompt-surface-simplification @ fca6160f88a40ff141a91d10edcb9305e54e1cc5, 2026-07-28"
  keywords: 
    - half-true measurement
    - growth claim
    - patch release count
    - version window
    - percentage reproduces
    - pin the window not the count
    - ADR 0042
    - measurement verification
  tags: 
    - war-execution
    - audit
    - measurement-verification
    - documentation
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-07-28T23:45:06.138Z
---

# A measurement sentence can be half true — verified percentages do not vouch for an adjacent unverifiable count

**The pattern.** A single sentence reporting a growth/regression measurement can bundle multiple
independently-falsifiable clauses — some numeric literals that reproduce exactly against a fixture
or `git log`, and one aggregate count that corresponds to no real base at all. A reviewer who
spot-checks the reproducing clauses and generalizes "the measurement is solid" to the whole
sentence misses the one that isn't — the percentages being right is not evidence the count is
right; each clause needs its own reproduction.

**This phase's instance (code-verified at the landed tip, `fca6160`).** The design spec's growth
claim read "grown monotonically across 22 patch releases with zero shrink events" alongside two
per-surface percentages, `skills/war/SKILL.md` +33% and `CONTEXT.md` +24%. Audit reproduced the
percentages exactly, but "22 patch releases" corresponded to **no candidate base** — the real
version window between the cited measurement points was `0.14.38` → `0.14.67`, i.e. 29 versions,
not 22. The fix was not to correct the count to "29" (a moving target that would go stale at the
next release) but to **drop the count and pin the concrete window** instead:
`docs/adr/0042-prompt-surface-budgets.md` now reads "grew monotonically across the `0.14.38` →
`0.14.67` release window (measured at `fa3c838`) with zero shrink events" — the percentages are
unchanged and still reproduce.

**How to apply:** when a growth/regression claim mixes a percentage (or other directly-fixturable
number) with a derived aggregate (a release count, an elapsed-time claim, "N of M"), reproduce each
clause independently — do not let one clause's clean reproduction stand in for the others. When an
aggregate count is the unreliable part, prefer replacing it with the concrete bounds it was derived
from (the version window, the commit range, the date range) over hand-correcting the count, since a
literal count silently drifts at the next release/commit while a pinned window or SHA does not.

Related: [[bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands]]
(adjacent family: a *correctly-scoped* window measurement that a later release commit itself
falsifies by entering the window — this lesson is the sibling case where the count was wrong from
the start, not invalidated later); [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]]
(another count-vs-content mismatch, in release prose rather than a design spec).
