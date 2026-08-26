---
name: pre-consolidation-filing-litter-reproduced-the-exact-pathology-item-4-fixes
description: "This phase's own PRE-consolidation filing engine — running twice on holds"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: pre-consolidation-filing-litter-reproduced-the-exact-pathology-item-4-fixes
  phase: "realized-absorb-rate/phase-2 (landed dev/2026-08-19-realized-absorb-rate, merge 7cacd59)"
  keywords: 
    - filing litter
    - exact-title dedup
    - issue consolidation
    - war-followup
    - duplicate issues
    - minorsOf clustering
    - corroboration comment
    - realized-vs-intended
    - issue 1492
    - b01f7ac
  tags: 
    - war
    - process
    - issue-filing
    - audit-findings
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T13:49:10.322Z
---

# The pre-consolidation filing engine filed 28 issues for ~8 canonical findings — inside the very phase that fixes this

**Found (code-verified — landed tip `7cacd59` on `dev/2026-08-19-realized-absorb-rate`, phase 2):**
before this phase's own item-4 fix (the collapse/cluster/corroboration mechanism, confirmed live in
`skills/war/assets/workflow-template.js` — `minorsOf` seat-stamped dedup, the D3
exact-title-or-same-file-root-cause dedup step, and cluster-by-file-and-root-cause filing prompt) had
landed, the pre-consolidation filing engine ran twice on accumulated holds: attempt 1 filed 18 issues
(`#1568`–`#1585`), attempt 2 filed 10 more (`#1587`–`#1596`). Exact-title dedup could not see
differently-worded twins describing the same underlying finding — attempt 1 alone contained
duplicate clusters of 3x, 3x, 3x, and 2x, and attempt 2 re-filed several of attempt 1's root findings
under new wording rather than recognizing them as already-filed. The Lead hand-consolidated the 28
raw issues down to roughly 8 canonical issues by manual clustering-by-root-cause — the same kind of
manual dedup labor recorded in
[[polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand]]
for a different (fail-open queue-drain) trigger.

**Why this is durable:** plan item 4's stated problem — exact-title dedup missing semantically
duplicate findings, producing filing litter a human must manually collapse — reproduced live,
inside the same phase that implements the fix for it. This is a clean before/after data point: the
28-to-~8 collapse ratio (roughly 3.5:1) measured on real production filings is exactly the kind of
concrete "realized vs intended" evidence `#1492`'s classification window wants, and the landed fix
(`minorsOf` + D3 dedup + file/root-cause clustering, confirmed present at this landed tip) is the
mechanism expected to prevent recurrence from phase 3 of this plan onward. Any future phase that
still produces title-exact-only duplicate issue filings should be treated as a regression of this
fix, not a fresh instance of the same class.

## Locate-cue (verify still present before acting)

`minorsOf` (seats.flatMap dedup helper) and the D3 dedup/cluster filing-prompt text ("THEN dedup
(D3): run `gh issue list --label war-followup --state open` once...", "THEN cluster the remaining
candidate rows by file + root cause...") both confirmed present in
`skills/war/assets/workflow-template.js` at landed tip `7cacd59`. Issue `#1492`'s classification
window is the consumer of this data point — verify it is still open/tracking before citing this as
live evidence.

## Related

[[polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand]]
— the sibling manual-clustering labor pattern, triggered by a different (provisioning-death) cause
rather than exact-title dedup's blind spot.
