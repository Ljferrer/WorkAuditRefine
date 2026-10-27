---
name: release-blurb-flattens-a-plan-slice-list-and-attaches-a-property-to-the-wrong-surface
description: "A blurb flattening a plan slice's comma list can attach a property to a surface that lacks it"
metadata:
  node_type: memory
  type: project
  keywords:
    - release blurb
    - plan slice transcription
    - dropped comma
    - misattached modifier
    - shared verb
    - heterogeneous surfaces
    - _Avoid_ line
    - preset lists
  provenance: agent-unverified
  slug: release-blurb-flattens-a-plan-slice-list-and-attaches-a-property-to-the-wrong-surface
  phase: "2026-10-26-interview-fork-trials-and-pair-beats/phase-2 (Release, task 2.1)"
  tags:
    - war
    - release
    - docs
    - audit
    - prose-precision
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T03:53:58.778Z
---

# Write the blurb from the landed bodies, not from the plan row

**Status of this note.** Both audit findings were resolved in one fix round before land. Audit finding resolved in a fix round before land, recorded as pattern, not live instance. I confirmed only that the corrected wording is present in the landed README `## Status` and CHANGELOG head entry.

**Instance (a), a dropped comma (Minor, `disposition: absorb`).** The plan's D14 row and task 1.4 slice read: "each with an `_Avoid_:` line, naming `fork-trials.md`". The comma separates two properties of the entry. The first Release draft dropped the comma: "each with an `_Avoid_:` line naming `fork-trials.md`". That reads as if the `_Avoid_:` line names the doctrine file.

The landed bodies disagree. In `skills/war/references/glossary-cold.md`, the doctrine file is named on a separate line: a `Doctrine:` line under `## Fork trial` and `## Pair beat`, and a `Grammar:` line under `## Trials run block`. None of the three `_Avoid_:` lines names it. The fix: "each with an `_Avoid_:` line and naming `fork-trials.md`". The plan row itself was ambiguous. A participial phrase after a comma can attach to the entry or to the nearest noun.

**Instance (b), one verb over unlike surfaces (Nit, `disposition: absorb`).** The draft said "ADR 0050, `README.md` and `design.md` name the tier in their preset lists". The `design.md` change was one clause in §8: the red-team, snipe and trial tiers are enumerated by neither matrix helper. That is a helper-coverage note, not a preset list. The fix split the verb: ADR 0050 and `README.md` name the tier in their preset lists, and `design.md` §8 names it among the tiers no matrix helper enumerates.

**Rule.**
1. Transcribe the landed artifact, not the plan row. A plan row can be ambiguous or can predate the final shape.
2. A comma in a plan slice often separates two properties. Keep both properties on their own noun.
3. When one verb covers a list of surfaces, open each surface and check that the verb is true of it. If two surfaces differ in kind, give each its own verb.

**Auditor method.** For each surface a blurb names, open it and confirm the property the blurb attaches to it. A grep for the surface name is not enough.

Related: [[release-blurb-overstates-guard-semantics]] (its Recurrences 3 and 6 are the umbrella-clause and appositive-attachment cases), [[a-new-agents-tier-leaves-adr-0050-readme-and-design-md-tier-lists-stale]] (the tier lists that instance (b) describes), [[release-blurb-that-restates-a-code-comment-inherits-its-overclaim]].

**Locate-cue (verify still present before acting).** `skills/war/references/glossary-cold.md` headings `## Fork trial`, `## Pair beat`, `## Trials run block`. Grounded at the landed tip via the run-scoped `_refinery` worktree (rung 2).
