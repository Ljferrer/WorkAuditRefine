---
name: collectblocks-files-anchor-scan-is-fence-blind-while-sibling-parser-in-same-file-is-fence-aware
description: "campaign-ledger.mjs's collectBlocks scans a whole plan for `- Files:` anchors with no code-fence skip, while resolveRoadmapPlans in the same file carries an explicit inFence toggle for exactly this hazard"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - collectBlocks
    - extractFiles
    - resolveRoadmapPlans
    - inFence toggle
    - code fence blindness
    - campaign-ledger.mjs
    - war-campaign
    - Files anchor scan
    - fenced example block
    - over-widened footprint
    - Fallback ceilings
  slug: collectblocks-files-anchor-scan-is-fence-blind-while-sibling-parser-in-same-file-is-fence-aware
  phase: 2026-09-03-in-band-absorb-default/phase-1 task 1.2
  tags: 
    - war-campaign
    - ledger
    - fence-blindness
    - doc-parsing
  created: 2026-09-03
  originSessionId: e3ef9388-1e5c-44a1-a4d9-ddfc400eabeb
  modified: 2026-09-04T04:25:51.039Z
---

# collectBlocks' Files: anchor scan is code-fence-blind; resolveRoadmapPlans in the same file is not

**Code-verified** at landed tip `a06d7260684761001549f958fc71acde414b2a0b` on
`dev/2026-09-03-2026-09-03-in-band-absorb-default` — landed-tip grounding reached rung 2
(worktree lookup): the `_refinery45` worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/.git`
(contains this plan's slug) and its `HEAD` equals the threaded landed tip exactly.

`skills/war-campaign/assets/campaign-ledger.mjs`'s `collectBlocks` (task 1.2's End state 2
change: scan the whole plan document, unioning every `- Files:` block instead of only the first)
has NO code-fence toggle. `resolveRoadmapPlans`, in the SAME file, carries an explicit `inFence`
boolean (set/cleared on every ``` fence-delimiter line, `continue`d while true) specifically
because "a fenced EXAMPLE table would otherwise BECOME the first table and mis-ingest its
illustrative links" — the comment at its own call site. `collectBlocks` has no equivalent: a
`- Files:` line inside a ```-delimited fence (a plan quoting the war-strategy template, or an
illustrative example) now contributes to the union just like a real task block.

## Why it's bounded, not a live defect

The module's own header comment (`extractFiles`, just above `collectBlocks`) documents three
"Fallback ceilings" — bounded ways the extraction can over-accept. Fence-blindness only WIDENS
the footprint (adds extra path-shaped tokens); it can never narrow one to empty, so
`assertOrderable`'s fail-loud throw (which fires only on an EMPTY union) can never be tripped by
it. Worst case: sweep reports extra `overlaps` rows, or a wider (more conservative) contention
order — never a throw, never a silently wrong refusal. No live plan carrying a fenced or prose
`Files:` anchor was found at land time.

## The pattern

At least five independent auditor notes (across `correctness` and `test-fidelity` seats,
multiple audit rounds within task 1.2) converged on this exact gap without a shared prompting
finding — a strong signal that "does this new anchor scan match the fence-handling idiom the SAME
FILE already established for the SAME class of input" is a check worth making explicit whenever a
new document-wide scanner is added beside an existing fence-aware one. None of the seats treated
it as blocking (Nit-level, `disposition: note`), consistent with the ceiling being bounded.

## How to apply

Before landing a new whole-document anchor/pattern scanner, grep the same file for a sibling
parser's fence-handling idiom (`grep -n 'inFence\|```'`). If one exists and the new scanner
processes the same class of document (plans/roadmaps that can legitimately quote themselves in
fenced examples), either mirror the toggle or add an explicit header-comment ceiling bullet
naming the gap as bounded — as this module's own header already does for the analogous
`isPathShaped` over-acceptance ceiling.

**Locate-cue (verify still present before acting):**
`skills/war-campaign/assets/campaign-ledger.mjs`, `collectBlocks` (no `inFence`), contrasted with
`resolveRoadmapPlans` (has `inFence`, set/read/cleared near its fence-delimiter check).

[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — a related but
distinct finding from the SAME task 1.2 diff (the header's stale "both" count word) hit the
phase-close polish mechanism's known failure mode this same phase.
