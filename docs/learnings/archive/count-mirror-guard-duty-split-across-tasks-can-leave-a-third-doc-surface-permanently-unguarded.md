---
name: count-mirror-guard-duty-split-across-tasks-can-leave-a-third-doc-surface-permanently-unguarded
description: "When a plan flips a rule-count literal that is mirrored across THREE doc surfaces"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: count-mirror-guard-duty-split-across-tasks-can-leave-a-third-doc-surface-permanently-unguarded
  phase: "realized-absorb-rate/phase-3 (tasks 3.1, 3.2 audits + phase-3-integrated-tip gate-audit)"
  keywords: 
    - rule count mirror
    - decisive-slots table
    - OLD-absent guard
    - retired-count arm
    - lacks_i scope
    - plan-interview.md
    - war-pipeline-structure.test.sh
    - count-blind pin
    - drift-guard rules 5-8
    - task slice boundary gap
    - guard ownership split
  tags: 
    - doc-honesty
    - drift-guard
    - plan-authoring
    - test-design
  created: 2026-08-20
  phase_landed_tip: 4d93459972a4c4c67b5977064b583cbd41265d31
  phase_landed_branch: dev/2026-08-19-realized-absorb-rate
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T17:51:53.479Z
---

# A plan can split one count-flip's guard duty across two tasks and still leave one of three mirrors unguarded

## What happened (code-verified at the landed tip)

Phase 3 Task 3.1 of `realized-absorb-rate` flipped the SAME rule-count fact ("three authoring
rules" → "four") across **three** mirrored surfaces: `skills/war-strategy/SKILL.md`'s §3 heading,
its §4 gap-review parenthetical, and `skills/war-strategy/references/plan-interview.md`'s
decisive-slots table row ("task carve-outs per the drift-guard rules 5–7" → "5–8"). The plan
deliberately made Task 3.1's own slice **count-blind** for the third mirror (pin only the row's
*subject* — `doc_f 'touched-doc facts'` — never the digit range) and delegated the OLD-absent
(retired-count) guard duty to Task 3.2's slice, "following the existing `two authoring` /
`two drift-guard` precedent". Task 3.2 extended `skills/war-machine/war-pipeline-structure.test.sh`
with exactly two new `lacks_i` arms (`three authoring rules`, `three drift-guard rules`) — both
scoped to `$WAR_STRATEGY` (i.e. `skills/war-strategy/SKILL.md`) only, matching the two-mirror
precedent it was extending.

**Confirmed still true at the landed tip** (`4d93459972a4c4c67b5977064b583cbd41265d31` on
`dev/2026-08-19-realized-absorb-rate`, read via the `_refinery22` worktree whose `gitdir` names
this plan's slug): `plan-interview.md` line 118 reads "task carve-outs per the drift-guard rules
5–8" and `war-pipeline-structure.test.sh`'s `lacks_i` calls at that block (lines 438-441) target
`"$WAR_STRATEGY"` exclusively — no arm scans `plan-interview.md`. A future revert of just the
digits in that one row back to "5–7", leaving the row's subject text intact, would stay green in
**every** suite this repo runs: `war-strategy-structure.test.sh`'s pin is subject-only by design
(count-blind, per the plan's own instruction), and `war-pipeline-structure.test.sh`'s retired-count
arms never touch this file.

## Why this is invisible to the End states / gate

Every End state and check named in the plan passed at every audit round (End states 5 and 7 both
`met`). The gap is not a violation of anything the plan or the mapped tests assert — it is a
genuine enumeration gap in the plan's own task decomposition: the plan named exactly two
`lacks_i` forms to extend ("the existing `two authoring` / `two drift-guard` precedent"), which
happens to enumerate only the two `$WAR_STRATEGY` mirrors, silently excluding the third
(`plan-interview.md`) mirror that the SAME task-1 diff also flipped. Both the audit at Task 3.1,
the audit at Task 3.2, and the final phase-3-integrated-tip gate-audit independently surfaced this
gap and all three routed it `disposition: note` (not absorb/follow-up) — judged a conscious edge of
the plan's count-blind convention, not a worker deviation, since the plan explicitly scoped the
OLD-absent duty to the two SKILL.md forms.

## How to apply

When a plan flips one count fact across **N ≥ 3** mirrored doc surfaces and assigns the OLD-absent
guard duty by **naming specific arm forms to extend** (e.g. "extend the existing `two X` / `two Y`
precedent") rather than by **naming every surface the count fact touches**, check whether the
named-forms list actually enumerates all N surfaces — a guard-duty task inheriting an existing
two-arm precedent will silently reproduce that precedent's file-scope, not the new diff's full
mirror set. A count-blind pin (subject-only, no digits) on the excluded surface is not a
substitute: it lets the surface's row *exist* but never protects its digit range from a stale
revert.

## Related

[[grep-c-assertion-count-floor-is-a-fragile-dated-snapshot]] — a sibling class where a count-based
End-state floor is itself a dated snapshot; this lesson is about a count-flip's *guard being scoped
too narrowly across mirrors*, not the guard's own snapshot fragility.
[[adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts]]
— the sibling ADR-side class (an owning ADR's own Consequences count going stale), same phase, same
underlying rule-count-flip event.

> archived 2026-08-30: resolved — moved to archive
