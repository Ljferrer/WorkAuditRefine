---
name: gospel-new-present-pin-self-satisfied-by-status-blurb-prose
description: "A README `## Status` blurb narrating a doc rename can itself independently satisfy that rename's structural-test NEW-present pin, because the presence helper (has/has_i) greps the raw file while the absence helper (lacks/lacks_i) strips the Status section first"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: gospel-new-present-pin-self-satisfied-by-status-blurb-prose
  phase: "2026-08-04-interview-and-authoring-contract/phase-3 (Release, task 10)"
  keywords: 
    - has_i
    - lacks_i
    - strip_prose
    - gospel pin
    - new-present pin
    - Status blurb
    - war-pipeline-structure.test.sh
    - presence guard asymmetry
    - section rename guard
    - structural test blind spot
    - README Status section
  tags: 
    - testing
    - structural-test
    - shell
    - gotcha
    - release-blurb
  relates: 
    - "[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]]"
    - "[[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]]"
    - "[[release-blurb-overstates-guard-semantics]]"
    - "[[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]]"
  created: 2026-08-05
  originSessionId: 67745971-e7bc-4d1f-87e7-038430dd13ab
  modified: 2026-08-05T16:10:57.505Z
---

# A Status-blurb sentence describing a doc rename can self-satisfy the rename's own NEW-present pin

## The gotcha

`skills/war-machine/war-pipeline-structure.test.sh` ships two helper families:
- `has()` / `has_i()` — `grep -qF` / `grep -qiF` against the **raw file**, no prose stripping.
- `lacks()` / `lacks_i()` — pipe through `strip_prose()` first, which drops the README `## Status`
  and `## Changelog` sections before grepping.

The asymmetry is deliberate on the OLD-absent side: `strip_prose` exists precisely so a `## Status`
blurb can *narrate* a retirement (quote the old wording while describing that it's gone) without
re-tripping the old-absent guard — this is the resolved case already recorded at
[[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]].

But the mirror direction is unguarded: a NEW-present pin built with `has()`/`has_i()` reads the
**whole file**, `## Status` section included. If a release blurb happens to describe the new
wording — quoting or closely paraphrasing the literal the pin checks for — the pin goes green from
the blurb sentence alone, independent of whether the actual section/heading the pin exists to prove
still carries that wording. A NEW-present pin's job is to prove a doc surface landed the new
phrasing; a blurb mention is not that proof, but `has_i()` cannot distinguish the two sources.

## Concrete instance (code-verified, live at `2026-08-04-interview-and-authoring-contract` land,
tip `3b1287111098120ae5dce1057548cd725bc00005`)

Read at the `_refinery` worktree whose `HEAD` equals the landed tip (gitdir physical path containing
the plan slug:
`<repo-root>/.claude/war-worktrees/2026-08-04-interview-and-authoring-contract-2026-08-05/2026-08-04-interview-and-authoring-contract-2026-08-05/_refinery/`).

`skills/war-machine/war-pipeline-structure.test.sh` pins (verify still present before acting):
```
has_i "$README"    'recommended auxiliary plugin'
```
`README.md`'s `## Status` blurb (line 361) contains the sentence "...the README section now reads
Recommended Auxiliary Plugin" — a case-insensitive hit for that exact pin, all by itself. The pin
already had three independent hits before the blurb landed — the `### Recommended Auxiliary Plugin`
heading (`README.md:61`) and the link text plus `#recommended-auxiliary-plugin` fragment
(`README.md:103`) — so in this instance the pin was never a precise single-section guard and the
blurb is a fourth redundant hit, not the first non-section one. Gate-audit rated it Nit on that
evidence, not Minor.

## The durable rule

When a structural-test suite gives its absence-direction helper (`lacks`/`lacks_i`) a
`strip_prose`-style Status/Changelog exclusion so a blurb can safely *describe* a retirement, the
presence-direction helper (`has`/`has_i`) is left asymmetrically strong: it can be satisfied by the
blurb's own description of the change, not just by the actual target surface. This degrades a
NEW-present pin from "the target section carries the new wording" to "the new wording appears
*somewhere* in the file, possibly only in prose about the change" — a real coverage loss whenever
the pin has no other independent hit outside the blurb (unlike this instance, which had three).

**Before trusting a NEW-present `has`/`has_i` pin as proof a specific section/heading landed:**
check whether the pinned literal could plausibly also appear in the `## Status`/`## Changelog`
blurb describing the very change being pinned — if the pin has no hit outside the blurb, it is not
proving what it looks like it proves. Fix options: (a) phrase the blurb to avoid reproducing the
pinned literal contiguously, or (b) give the presence side a `strip_prose`-aware variant (a
`has_i_stripped()` mirroring `lacks_i()`) so NEW-present pins that must prove a section survived
independent of blurb narration route through it.

Related: [[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]] (a different has/lacks asymmetry
in the same file — case-sensitivity, not prose-stripping); the release-blurb-narrating-the-rename
class is generically covered as an aside in [[release-blurb-overstates-guard-semantics]]'s Task 8
gospel-pin family, but this presence-direction mechanism deserved its own entry since it is the
structural mirror-image of the already-resolved absence-direction guard.
