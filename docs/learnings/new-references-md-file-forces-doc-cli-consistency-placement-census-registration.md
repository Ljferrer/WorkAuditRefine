---
name: new-references-md-file-forces-doc-cli-consistency-placement-census-registration
description: "Creating a new skills/*/references/*.md file forces a registration touch in skills/_shared/doc-cli-consistency.test.mjs's default-deny placement census, even when the plan's Files list never names that test file"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-references-md-file-forces-doc-cli-consistency-placement-census-registration
  phase: 2026-09-03-in-band-absorb-default/phase-6 task 6.1
  keywords: 
    - doc-cli-consistency.test.mjs
    - EVICTION_DESTINATIONS
    - VERB_SCAN_EXCLUSIONS
    - placement census
    - D2 census
    - default-deny
    - new references file
    - verb-scan
    - skills references
    - cascade touch
    - forced off-plan touch
  tags: 
    - war
    - doc-guard
    - drift-guard
    - structural-test
    - cascade
  created: 2026-09-04
  originSessionId: 1db2f526-d0af-4dc0-b9c7-311770b477a8
  modified: 2026-09-04T21:48:22.057Z
---

# A new skills/*/references/*.md file forces a doc-cli-consistency.test.mjs touch, even off-plan

**Code-verified** at landed tip `d4793b14eae512c69c55c9fe9990f89b559baed3` on
`dev/2026-09-03-2026-09-03-in-band-absorb-default` (plan slug `2026-09-03-in-band-absorb-default`),
read via the `_refinery45` worktree whose `gitdir` physical path
(`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/.git`)
names this plan's slug and whose `HEAD` byte-equals the landed tip.

## What happened

Task 6.1 created `skills/war/references/sweep-exclusion.md`, a new references file. The plan's Files
list for the task never names `skills/_shared/doc-cli-consistency.test.mjs`. But that test's
`'verb-scan placement census (D2)'` default-denies every `skills/*/references/*.md` file the
directory scan (`referencesFiles()`) finds: the scanned set must exactly equal the union of two
hand-maintained arrays, `EVICTION_DESTINATIONS` and `VERB_SCAN_EXCLUSIONS`. A new, unplaced file reds
the suite immediately with an `UNPLACED:` message naming the file. Task 6.1 registered
`sweep-exclusion.md` into `EVICTION_DESTINATIONS` (it names `campaign-ledger.mjs` verbs three times),
confirmed present at the landed tip.

## The durable rule

Whenever a task creates a new file under any `skills/*/references/`, expect (and budget for) a
mandatory touch to `skills/_shared/doc-cli-consistency.test.mjs`, even though the plan's Files list
will rarely name it — it is a structural-test cascade, not a scope choice. Place the file in
`EVICTION_DESTINATIONS` if its prose names a scanned module's CLI verbs or exports, else in
`VERB_SCAN_EXCLUSIONS` with a reason comment (the file's own carve-out convention). Before closing
such a task, grep the new filename in both arrays to confirm it landed in exactly one.

## Locate-cue (verify still present before acting)

`skills/_shared/doc-cli-consistency.test.mjs`, the `'verb-scan placement census (D2)'` test
(~line 350), `EVICTION_DESTINATIONS` (~line 119) and `VERB_SCAN_EXCLUSIONS` (~line 150) arrays.

## Related

[[adr-0042-eviction-destination-creation-does-not-auto-register-in-qualified-headers]] — the sibling
registration gap: a new `skills/war/references/` eviction destination also needs a separate,
easy-to-skip touch to `reference-link-integrity.test.mjs`'s `QUALIFIED_HEADERS` list. Both lessons
name the same underlying shape: a hand-maintained registry over `skills/*/references/*.md` files that
a directory-scan-derived structural test enforces default-deny, but creating the file does not
auto-populate.
