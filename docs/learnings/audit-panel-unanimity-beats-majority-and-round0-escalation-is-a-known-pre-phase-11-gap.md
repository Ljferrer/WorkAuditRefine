---
name: audit-panel-unanimity-beats-majority-and-round0-escalation-is-a-known-pre-phase-11-gap
description: "A lone correct Major outvoted 3-to-1 by Minor still held the land, because approval needs unanimity, not a majority"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - unanimity
    - majority vote
    - severity split
    - panel split
    - four-seat panel
    - escalate at round 0
    - fixRounds 0
    - D17
    - PIN-29
    - suggested_fix
    - rebuttal round
    - held escalation
    - self-validating plan decision
  slug: audit-panel-unanimity-beats-majority-and-round0-escalation-is-a-known-pre-phase-11-gap
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-10 (task 10.1), landed b5f5a69b5dad11861341b1c9ef82f0cebda4a09b on dev/2026-09-06-engine-and-audit-verdict-integrity"
  tags: 
    - war
    - audit-findings
    - escalation
    - process
    - workflow-template
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T17:14:03.268Z
---

# A lone correct Major outvoted 3-to-1 by Minor still held the land — unanimity, not majority, is why

**Found (code-verified — landed tip `b5f5a69b5dad11861341b1c9ef82f0cebda4a09b` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`; the underlying defect and its fix are
confirmed at the landed tip — see [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]]
for the code-level detail).**

Task 10.1's first `COMPOUND CHECKS` commit set a compound check's `exit_code` to the maximum of its
per-command statuses, with `` `||` `` included among the joins that trigger the rule. A four-seat
audit panel split on it: three seats scored the `||` case Minor, one (the simplicity seat) scored
it Major. Approval is unanimous on one `audit_sha` (never majority) — the lone Major held, the task
escalated at round 0 with `fixRounds: 0`. The Lead reproduced the Major at the pin, ruled it real
(for `A || B` with `A` red and `B` green the shell exits 0 but the maximum is 1 — a false `unmet`
that holds a land, not a cosmetic nit), and completed the phase manually through the
held-escalation recipe ([[held-escalation-lead-manual-completion]]).

**Why this is durable, not just a war story:** three-out-of-four scoring it Minor was wrong, and
the outvoted seat was right. Had the panel resolved by peer count (majority) instead of requiring
unanimity, the false-`unmet` defect would have shipped. This is a concrete, landed case for why the
engine's unanimous-approval rule exists: severity scoring across independent seats is not reliable
enough to average or outvote, and a design that lets three Minors overrule one correct Major would
have shipped this exact defect on this exact task.

**Why the round-0 escalation itself is expected, not a fresh bug:** at this landed tip the engine
has no fix round for a blocking finding that carries a `suggested_fix` and survives a panel split —
it escalates the whole phase at round 0 instead. This is exactly the gap the plan's own Decision
D17 (PIN-29, "Rebuttal first, then FIX_NEEDED on a surviving fixable blocker") names and assigns to
Phase 11, Task 11.1, of this same plan (`docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`,
Decision D17 row): "the field data (five escalate-at-round-0 verdicts across two runs, #1664; a
Major-with-fix escalating a whole phase, #1989) shows the post-rebuttal escalation was the cost."
Task 10.1's escalation is a third, in-plan instance of that same field pattern, landing in the same
plan that already scheduled the fix for the very next phase. **How to apply:** when a phase
escalates at round 0 on a Major that carries a `suggested_fix`, before treating it as surprising,
check the plan's own decisions ledger for a D-row that already names this exact engine gap and
schedules its fix — if one exists, the correct move is the Lead's manual-completion recipe now,
not a plan amendment, because the mechanism-level fix is already scheduled. Re-verify this note is
stale once Phase 11 lands (D17/PIN-29 should then let a fix round replace the round-0 escalate for
a fix-having blocker).

**Locate-cue (verify still present before acting):** `docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`,
Decision D17 row (search `PIN-29`) — check whether it still reads "PIN-21 retired" / "Ratified rule
(PIN-29)" or has since been superseded by Phase 11 landing; `skills/war/assets/workflow-template.js`,
search `fixRounds` to confirm whether a round-0-escalate-on-suggested_fix path still exists post
Phase 11.

**Related:** [[held-escalation-lead-manual-completion]] (the general manual-completion recipe this
incident used); [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]]
(the code-level defect and its fix-round-two dead-mention recurrence).
