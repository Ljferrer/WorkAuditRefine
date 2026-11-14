---
name: a-resolved-line-on-a-lesson-needs-git-verified-attribution-and-every-status-phrase-updated
description: Resolving a lesson needs a git-checked owner and every status phrase rewritten
metadata:
  node_type: memory
  type: project
  keywords:
    - Resolved line
    - lesson resolution
    - wrong commit attribution
    - git log -S
    - still present
    - stale locate-cue
    - self-contradicting lesson
    - slice literal history
  provenance: agent-unverified
  slug: a-resolved-line-on-a-lesson-needs-git-verified-attribution-and-every-status-phrase-updated
  phase: "2026-11-08-shell-floors-tests-and-lint/phase-3 (p3-latefix-1, p3-polish)"
  tags:
    - war
    - learnings
    - lesson-maintenance
    - attribution
    - polish
  created: 2026-11-13
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-14T02:35:00.324Z
---

# A Resolved line on a lesson needs a git-checked owner and every status phrase updated

**Pattern.** Two audit findings in one phase hit the same act: appending a `**Resolved <date>**` line to an existing lesson.

1. **Wrong owner from a slice literal.** The plan slice dictated the Resolved line word for word, and it credited a seed task. Git history showed a different task's commit made both edits. The worker copied the slice verbatim, so the error shipped into the audited diff. A plan slice that states history is a claim, not a fact.
2. **Appended line, stale body.** A polish pass added a Resolved line but left the lead-in "Instance (still present, harmless today)" and a locate-cue that named the retired label. The page then contradicted itself, and a second polish round had to fix it.

Both findings were fixed before land. This note records the pattern, not a live instance.

**How to apply.**
- Before writing who fixed something, run `git log -S'<literal>' -- <file>` for each edit and cite the commit that the log returns. Do this even when the slice spells the attribution.
- When a lesson becomes resolved, grep the whole file for status words ("still present", "today", "live") and every locate-cue. Rewrite each one, for example "as of <date>, resolved below" and "label was X until <sha>, now Y".
- Keep Rule and How-to-apply text unchanged unless the fix changes the rule.

Related: [[audit-log-finding-can-be-stale-by-land-time]], [[carried-rows-can-be-already-fixed-at-the-next-phase-base]].
