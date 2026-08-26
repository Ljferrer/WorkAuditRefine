---
name: region-scoped-drift-guard-can-stay-vacuous-when-a-sibling-construct-shares-vocabulary-in-the-same-region
description: "Narrowing a drift-guard pin from whole-file to an established section/region extraction (e.g. `## Checkpoint`) is necessary but not sufficient when a DIFFERENT bullet inside that same region shares vocabulary with the pinned bullet — the key still matches the sibling and stays non-discriminating for the specific clause it names."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: region-scoped-drift-guard-can-stay-vacuous-when-a-sibling-construct-shares-vocabulary-in-the-same-region
  phase: ask-disposition/phase-2 (Task 2.3 gate-audit finding + phase-close polish sweep finding)
  keywords: 
    - region scoping
    - drift guard pin
    - Checkpoint region
    - sibling bullet vocabulary collision
    - construct-level extraction
    - skill-doc-contracts.test.mjs
    - D37
    - D41
    - vacuous key
  tags: 
    - test-design
    - drift-guard
    - guard-architecture
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-26T03:02:37.405Z
---

# Region-scoping a drift-guard pin does not de-vacuify a key whose term also appears in a sibling construct inside that same region

## What happened (code-verified at the landed tip)

Verified at `4aa729a3770232994d4944e09b8c86e829259f89` on `dev/2026-08-25-ask-disposition`
(read via the `_refinery27` worktree whose `gitdir` names this plan's slug, HEAD == the landed
tip exactly).

Task 2.3's gate-audit flagged D37 in `skills/war/assets/skill-doc-contracts.test.mjs` for scoping
its `Never-filed-unruled`/`Strike-list ruling gate` canonical-side keys against the WHOLE
`skillMd` file, where broad keys like `/consolidation/i` or `/absolute/i` could be satisfied by
unrelated SKILL.md prose elsewhere (e.g. Gate-2's "absolute `memoryLocalRoot`") and would still
pass with the ask-ruling-gate bullet itself deleted. The phase-close polish task fixed this by
narrowing the canonical half to the established `## Checkpoint` region extraction that sibling row
D41 already uses (`skillMd.match(/^## Checkpoint[\s\S]*?(?=\n## )/m)`) — exactly the fix the
recorded [[new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file]] lesson
prescribes.

That fix genuinely de-vacuifies `/absolute/i` (its only in-region match becomes the gate bullet
itself). But two of the same row's four keys — `/consolidation/i` and
`` /file-followups`?\s+dispatch/i `` — are **still non-discriminating** after the fix: the
"Follow-up filing floor" bullet (`- **Follow-up filing floor — gate the DAG advance (D4,
#1331).**`, `skills/war/SKILL.md`) sits INSIDE the same `## Checkpoint` region, one bullet above
the ask-ruling-gate bullet, and itself carries `**consolidation precedes filing**` and `the
Workflow's `file-followups` dispatch`. So deleting only the ask-ruling-gate bullet's clause ("the
engine already excludes them from consolidation and the file-followups dispatch") still leaves
those two keys matching the sibling bullet — the row is non-vacuous OVERALL (two other keys,
`/unruled\s+ask/i` and `/never\s+re-adds\s+one/i`, are unique to the ask bullet), but those two
specific keys prove nothing about the clause they are named for.

The row's own new comment (introduced by the same fix) overclaims the cure: it cites
`/consolidation/i` as an example of a key the region-scoping fixes, when the region it scoped to
still contains the exact vocabulary it was trying to exclude.

## Why this is durable and easy to miss

Region/section-level scoping (file → `## Heading` block) is the correct fix for the whole-file
vacuity class the prior lesson names, and it is verifiably correct for keys whose term is unique
to the region. But a `## Heading` region in a doc like SKILL.md's Checkpoint routinely contains
MULTIPLE adjacent bullets on related topics (follow-up filing, ask ruling, escalation posture),
and generic vocabulary ("consolidation", "dispatch", "absolute") can appear in more than one
sibling bullet within the same section. Section-level scoping catches a whole-region deletion; it
does NOT catch a rewrite/relocation of one specific bullet's clause when a neighboring bullet
happens to share the same words. The comment introduced alongside the fix asserted a broader cure
than the code delivers — a plausible, un-tested claim that nothing catches because no test asserts
comment content.

## The durable rule

When scoping a drift-guard key to an established region/section extraction, check whether ANY
OTHER construct (bullet, paragraph) inside that same region shares the key's vocabulary. If so,
the region fix is necessary but not sufficient — extract the SPECIFIC construct (e.g. the single
bullet by its own leading marker, à la `region[0].match(/^- \*\*Ask ruling gate[\s\S]*?(?=\n-
\*\*)/m)`) for that key, or tighten the regex to a phrase unique to the target bullet. Never trust
a fix comment's claim that region-scoping "cures" a specific key without re-deriving whether a
sibling construct in the same region shares the matched vocabulary.

## Locate-cues (verify still present before acting)

- `skills/war/assets/skill-doc-contracts.test.mjs`: D37's `Never-filed-unruled`/`Strike-list
  ruling gate` rows (~lines 2380-2404), scoped to `checkpoint[0]` (the `## Checkpoint` region,
  ~line 2338); the row's justifying comment (~lines 2331-2336) cites `/consolidation/i` as
  de-vacuified by the scoping.
- `skills/war/SKILL.md`: the `## Checkpoint` section (`^## Checkpoint` to `^## Finish`) contains
  both the "Follow-up filing floor" bullet (`**consolidation precedes filing**`, `file-followups`
  dispatch) and the "Ask ruling gate" bullet (`consolidation and the file-followups dispatch`) as
  adjacent siblings — the shared vocabulary this lesson names.

## Related

[[new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file]] — the prior-tier
defect (skipping the region-scoping idiom entirely); this lesson is the follow-on residual once
that fix is correctly applied. [[guard-rationale-comment-can-cite-a-different-scanned-surface-than-the-pin-it-justifies]]
— sibling comment-accuracy class: a fix's own justifying comment overclaims what the code change
actually cures.
