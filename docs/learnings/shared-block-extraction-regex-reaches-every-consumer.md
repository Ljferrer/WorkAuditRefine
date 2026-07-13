---
name: shared-block-extraction-regex-reaches-every-consumer
description: "A shared Files:-block break regex feeds every ingestion path, not just the one being fixed"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - collectBlock
    - NEW_CONSTRUCT
    - FILES_ANCHOR
    - extractFilesFromPlanFile
    - shared helper
    - campaign-ledger
    - init vs sweep
    - blast radius
    - regex widening
  provenance: code-verified
  slug: shared-block-extraction-regex-reaches-every-consumer
  phase: Contract-on-both-sides/1.1 (2026-07-12)
  tags: 
    - campaign-ledger
    - shared-helper
    - regex
    - blast-radius
    - audit-calibration
  related: 
    - shared-status-enum-widening-silently-widens-land-path
    - plan-array-literal-lags-canonical-export
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A shared block-extraction regex reaches every consumer that calls it, not just the one motivating the change

`skills/war-campaign/assets/campaign-ledger.mjs` extracts a plan's `Files:` block with one shared
pair of regexes — `FILES_ANCHOR` (opens the block) and `NEW_CONSTRUCT` (the line-break condition
inside `collectBlock`) — feeding a single `extractFilesFromPlanFile` helper. That helper is called
from BOTH ingestion paths: `init()` (roadmap-driven plan resolution) and `sweep()` (inbox-driven
plan resolution) (verify still present before acting — found at
`skills/war-campaign/assets/campaign-ledger.mjs`, `extractFilesFromPlanFile` called from both
`init` and `sweep` @ Contract-on-both-sides/1.1).

**Why it matters:** a change to `NEW_CONSTRUCT` (e.g. widening the "stop consuming continuation
lines" condition to cover a new Markdown construct) is a change to the shared helper, so it
silently changes behavior for BOTH the roadmap path and the inbox path in the same commit — even
when the motivating bug report and the task's Files: list only name one of the two. Before
widening or narrowing a shared block/regex helper for one call site's need, enumerate every
consumer of that helper (grep the function name) and check each one's test coverage explicitly,
not just the one motivating the change.

**Calibration note:** an auditor flagging a residual risk on a shared-helper change should confirm
the risk against the ACTUAL regex, not a paraphrase of it — a checkbox-gated break condition
(`-\s*\[[ xX]\]`) does not fire on a bare list-item dash (`-\s` alone), so a claimed "silently
under-extracts a sub-bulleted Files block" risk only holds if the break condition is genuinely
un-gated. Re-read the construct's exact pattern before recording the residual-risk claim as live.

Related: [[shared-status-enum-widening-silently-widens-land-path]] (same shape: a shared enum/regex
widened for one caller reaches every caller), [[plan-array-literal-lags-canonical-export]] (a
sibling "shared array, multiple readers" drift family).
