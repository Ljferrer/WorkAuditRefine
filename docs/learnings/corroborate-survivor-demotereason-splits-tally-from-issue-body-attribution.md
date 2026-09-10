---
name: corroborate-survivor-demotereason-splits-tally-from-issue-body-attribution
description: "corroborateSurvivor's demoteReason stamp lands on the durable minorsFiled/aced record but never on the filed issue body's attribution line, so the DEMOTE_REASONS-prefix tally and the human-facing issue text can disagree for the same row"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: corroborate-survivor-demotereason-splits-tally-from-issue-body-attribution
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-8 (Task 8.1, correctness + cascading-impact lenses, disposition note)"
  keywords: 
    - corroborateSurvivor
    - demoteReason
    - filedByOf
    - DEMOTE_REASONS
    - war-review tally
    - barrier tag
    - seat-filed
    - engineFiled
    - minorsFiled
    - aced record
    - re-audit corroboration
    - issue body attribution
    - demote-reason mismatch
  tags: 
    - workflow-template
    - ace
    - audit-finding
    - war-review
    - filing-fidelity
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T10:52:31.044Z
---

# `corroborateSurvivor`'s `demoteReason` stamp never reaches the filed issue body's attribution line

## What happened

Verified at the landed tip `8884782176ff60a2c93eb249f328aa2751eac060` on
`dev/2026-09-06-engine-and-audit-verdict-integrity` (read via the `_refinery46` worktree, gitdir
physical path
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`,
`HEAD` byte-equal to the landed tip).

`skills/war/assets/workflow-template.js` defines `corroborateSurvivor` (line 1875):

```js
const corroborateSurvivor = f => {
  ...
  const hit = minorsFiled.find(m => remintKey(m) === k)
    || (aced.find(a => a && a.finding && remintKey(a.finding) === k) || {}).finding
  ...
  return hit   // demote()'s corroborating arm stamps its demoteReason onto the survivor
}
```

`demote()`'s corroborating arm (line 1530-1531) then runs:

```js
const hit = corroborateSurvivor(f)
if (hit) hit.demoteReason = hit.demoteReason || why   // lands on the durable minorsFiled record
  // only — never on the filing prompt's filed-by line, which stays seat-filed (barrier: <tag>)
  // because the survivor carries no engineFiled
```

The inline comment (author-written, matching the observed behavior) states the split explicitly:
the stamp lands on the durable `minorsFiled`/`aced` record only. The filed issue body's own
attribution line is rendered by `filedByOf`, which branches on a different field (`engineFiled`),
not on `demoteReason`'s presence — a seat-raised follow-up that later gets corroborated by a second
seat still renders "seat-filed (barrier: `<tag>`)" in the issue body, even though the record now
carries a `demoteReason`.

Downstream, `/war-review`'s ratified "follow-ups filed per `DEMOTE_REASONS` prefix" row (line 5468
`DEMOTE_REASONS.find(p => typeof m.demoteReason === 'string' && m.demoteReason.startsWith(p))`)
reads `demoteReason` directly off `minorsFiled` rows — so this exact row now buckets as a
`demote:<reason>` tally entry, while the issue body a human reads still says seat-filed/barrier.
The tally and the prose disagree for the same row.

**A second, narrower case:** `corroborateSurvivor` searches `minorsFiled` first, then falls back to
`aced` (`(aced.find(...) || {}).finding`). When the match lands in `aced` rather than `minorsFiled`,
`demote()`'s stamp writes a `demoteReason` onto an **aced** finding's record. Nothing downstream
reads `aced[].finding.demoteReason` — neither the filing prompt nor the `/war-review` tally walk
`aced` — so this write is inert today, but a future reader of an aced record's `demoteReason` field
should not treat its presence as evidence the finding was ever demoted.

## Why this is not a bug

Both audit lenses that raised this (`correctness`, `cascading-impact`) filed it `disposition: note`
— the inline comment shows the split is a deliberate consolidation choice (the plan's ordered
"logs corroboration instead" of filing a second issue), not an oversight. Recorded here so a future
reader of `/war-review`'s `DEMOTE_REASONS` tally, or of a filed follow-up issue's body text, does
not treat a disagreement between the two as evidence of a bug in either.

## Locate-cue (verify still present before acting)

`skills/war/assets/workflow-template.js` — `corroborateSurvivor` (search `const corroborateSurvivor
= f =>`), `demote()`'s corroborating arm (`hit.demoteReason = hit.demoteReason || why`), and
`filedByOf`'s `engineFiled` branch. `skills/war-review/SKILL.md`'s "follow-ups filed per
`DEMOTE_REASONS` prefix" row.

## Related

[[new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection]] — a sibling
`demoteReason`/`barrier`/`floorSkipped` gap on the SAME field family, but there the field is
missing from a *projection* entirely; here the field exists and is read, but by two consumers that
disagree because they key on different signals (`demoteReason` vs `engineFiled`).
