---
name: a-near-remint-folded-onto-an-aced-record-never-reaches-handoff-absorbed
description: A nearby finding folded onto an aced record is lost from the handoff
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-1
  node_type: memory
  type: project
  keywords:
    - remintNear
    - near re-mint
    - acedKeys
    - handoff absorbed
    - "merged[] dropped"
    - corroborateSurvivor
    - FOLLOWUP_LINE_WINDOW
    - D25
  provenance: code-verified
  slug: a-near-remint-folded-onto-an-aced-record-never-reaches-handoff-absorbed
  phase: 2026-11-08-engine-findings-ace-and-late-fix/phase-1 (task 1.1)
  tags:
    - war
    - findings-pipeline
    - handoff
    - provenance-loss
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T22:18:24.859Z
---

# A near re-mint folded onto an aced record is lost from the handoff

Plan D25 made `remintNear` treat a finding on the same task and file, within `FOLLOWUP_LINE_WINDOW` lines, as a re-mint.
It does not compare titles inside the window.
So a distinct finding from another seat folds into the first record as corroboration.

`remintNear` checks four registries: `acedKeys`, `revertedKeys`, `filedKeys`, `queuedKeys`.
On a filed survivor the folded row reaches `handoff.followUps[].merged[]`.
On an aced survivor it lands on the aced finding's `merged[]`.
The `handoff.absorbed` projection renders only aced titles grouped by sha (the `bySha` loop).
So the folded row exists only in a log line.

The likely case is a regression that an ace commit adds near its own fix line.
The plan's Assumptions ledger says a nearby finding "reaches the handoff as merged[], never dropped". That is false for aced survivors.
The folded `merged[]` entry also keeps only seat, title and rationale. Its own `suggested_fix` is gone.

Status at land: an unruled `ask`. The fork is to drop `acedKeys` from the `remintNear` loop, or to render aced `merged[]` in `handoff.absorbed`.
Same family: [[new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection]] (an explicit-key projection drops a new field).

## Locate-cue (verify still present before acting)

- `skills/war/assets/workflow-template.js`: `const remintNear` and its loop `for (const reg of [acedKeys, revertedKeys, filedKeys, queuedKeys])`.
- Same file, handoff block: `absorbed: Object.entries(bySha)` builds titles only.

Found at landed tip 293edc46 @ phase 1, read through the run's `_refinery` worktree (branch head 37560c72, the land merge's source, same tree).
