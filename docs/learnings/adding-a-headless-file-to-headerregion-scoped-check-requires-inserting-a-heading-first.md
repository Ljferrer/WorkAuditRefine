---
name: adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first
description: "Adding a single-topic, heading-less file to a headerRegion()-scoped check requires inserting a `## ` heading, not just editing existing prose"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first
  phase: "2026-08-25-doc-truth-and-drift-guard-debt/phase-2 task 2.1 (plan-faithfulness lens, disposition note)"
  keywords: 
    - headerRegion
    - QUALIFIED_HEADERS
    - fail-closed heading check
    - docker-gate.md
    - Evicted heading
    - reference-link-integrity.test.mjs
    - single-topic file
    - eviction destination
    - heading-less document
  tags: 
    - war
    - doc-guard
    - drift-guard
    - reference-link-integrity
  created: 2026-09-03
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-09-03T19:13:04.168Z
---

# Widening a `headerRegion()`-scoped check onto a headless file forces a heading insertion

## What happened (code-verified at the landed tip)

Verified at `6a7a46d7f2262575bf624a78be47f4dc5042ce28` on
`dev/2026-08-25-doc-truth-and-drift-guard-debt` (read via the `_refinery` worktree, `HEAD`
byte-equal to this tip).

`skills/war/assets/reference-link-integrity.test.mjs`'s `headerRegion()` helper fails closed: it
returns `null` for a document with no `## ` heading at all, and a `null` header means a
header-scoped check simply cannot run over that file (see the test's own synthetic-fixture case,
"headerRegion fails closed on a heading-less document"). Task 2.1 widened `QUALIFIED_HEADERS`
(the array of files whose header region must carry the five-card D3 sentence) from nine members to
eleven, adding `setup.md` and `docker-gate.md`. At the task's base commit, `docker-gate.md` carried
**zero** `## ` headings — it is a single-topic reference file with no section structure. The plan's
own Notes section anticipated only "two header-text edits," not a heading insertion. The worker
correctly added a new heading, `## Evicted: § Setup step 3 — the opt-in docker gate block`
(confirmed present at the landed tip), matching the `## Evicted: § ...` idiom other multi-block
eviction files already use — this created the header/body boundary `headerRegion()` requires before
any header-scoped assertion over the file can be non-vacuous.

## The durable rule

Before adding any file to a `headerRegion()`-scoped (or similarly fail-closed heading-delimited)
check, grep the target file for `## ` headings first. A single-topic file that has never needed
section structure will have none, and the mechanical necessity is not "edit existing header text"
but "author a new heading to create the region at all." A plan that anticipates only text edits for
such a file undercounts the actual diff; this is a correct, plan-silent mechanical requirement, not
a deviation worth escalating (the audit routed it `note`, not `absorb`).

## Locate-cue (verify still present before acting)

`skills/war/assets/reference-link-integrity.test.mjs`, the `headerRegion()` function (~line 86) and
the `QUALIFIED_HEADERS` array (~line 315); `skills/war/references/docker-gate.md`'s
`## Evicted: § Setup step 3 — the opt-in docker gate block` heading (its only `## ` heading).

## Related

[[new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file]] — a sibling class about
region-scoping idioms; this file is specifically about a file that has **no** region at all yet.
