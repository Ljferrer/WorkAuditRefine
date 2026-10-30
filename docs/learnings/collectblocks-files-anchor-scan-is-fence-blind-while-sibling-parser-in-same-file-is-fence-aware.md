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

**Open gap (#2090).** `collectBlocks` in `skills/war-campaign/assets/campaign-ledger.mjs` scans the whole plan and unions every `- Files:` block. It has no fence toggle. A `- Files:` line inside a ``` fence (a plan quoting the war-strategy template, or an illustrative example) counts like a real task block. `resolveRoadmapPlans` in the same file carries an `inFence` toggle for exactly this hazard: a fenced example table would otherwise become the first table.

**Rule.** When a new whole-document scanner sits beside a fence-aware one, match its fence handling or name the gap as a bounded ceiling.

**Why:** Fence-blindness only widens the footprint. It can never narrow one to empty, so `assertOrderable`'s fail-loud throw (empty footprint only) is never tripped by it. Worst case: extra `overlaps` rows or a more conservative contention order. Never a throw, never a wrong refusal. The module's own Fallback ceilings header, above `extractFiles`, records this bound. At least five auditor notes converged on this gap without a shared prompt, all Nit-level. That is a strong signal the check is worth making explicit.

**How to apply:** Before landing a new whole-document anchor or pattern scanner, grep the same file for a sibling parser's idiom (`grep -n 'inFence\|```'`). If one exists and the new scanner reads the same class of document (plans and roadmaps can quote themselves in fenced examples), mirror the toggle or add a header-comment ceiling bullet.

**Locate-cue (verify still present before acting):**
`skills/war-campaign/assets/campaign-ledger.mjs`, `collectBlocks` (no `inFence`), contrasted with `resolveRoadmapPlans` (has `inFence`), and the `Code-fence blindness` bullet of the Fallback ceilings header.

[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — a related but distinct finding from the same task diff.
