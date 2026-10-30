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

**Case.** Task 10.1's first `COMPOUND CHECKS` commit set a compound check's `exit_code` to the maximum of its per-command statuses, with `` `||` `` included. A four-seat panel split: three seats scored the `||` case Minor, and the simplicity seat scored it Major. Approval is unanimous on one `audit_sha`, so the lone Major held. The Lead reproduced it at the pin and ruled it real: for `A || B` with `A` red and `B` green the shell exits 0 but the maximum is 1, a false `unmet` that holds a land. The phase finished through [[held-escalation-lead-manual-completion]]. The code-level detail is in [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]].

**Rule.** Never resolve a seat split by count. Severity scoring across independent seats is not reliable enough to average or outvote.

**Why:** three of four seats were wrong and the outvoted seat was right. A majority rule would have shipped the false-`unmet` defect on this exact task.

**Resolved: the round-0 half of this lesson.** At that tip, a blocker with a `suggested_fix` that survived a split escalated the phase at round 0. Decision D17 (PIN-29) named the gap. Task 10.1 was one more instance of the field pattern in #1664 and #1989. The audit loop now runs one rebuttal on a split, then a fix round and a full-roster re-audit when every surviving blocker has a `suggested_fix`. A fix-less blocker, a blocker unchanged after a fix, or a blocking seat with no finding still holds (#2279/#2280). The slug keeps the old wording because other lessons link to it.

**How to apply:** when a lone seat blocks against its peers, reproduce the finding at the pin before you judge it. When a task escalates, read the logged reason. It now names the fix-less, unchanged or finding-less case, or a seat that returned `escalate`.

**Locate-cue (verify still present before acting):** in `skills/war/assets/workflow-template.js`, `allApprove`, `isSplit`, and the `survivors` and `fixless` block in the audit loop. In `docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`, the Decision D17 row (search `PIN-29`).

**Related:** [[held-escalation-lead-manual-completion]] (the general manual-completion recipe this incident used); [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]] (the code-level defect and its fix-round-two dead-mention recurrence).
