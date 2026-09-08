---
name: escalate-reason-placeholder-satisfies-a-presence-only-runbook-trigger
description: "escalateReasonOf's '(no escalate_reason)' placeholder makes a reason-less escalation satisfy a runbook trigger meant only for reasoned ones"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: escalate-reason-placeholder-satisfies-a-presence-only-runbook-trigger
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-11 (task p11-polish), landed 8927103891fdc7902f15a498203f7eaeedd74823 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - escalateReasonOf
    - escalate_reason
    - no escalate_reason placeholder
    - resume-and-recovery.md
    - plan-shaped escalation
    - held-partial-phase runbook
    - presence check
    - blank check
    - sentinel string defeats guard
    - decision-forked
    - ADR 0013
  tags: 
    - war
    - audit-findings
    - workflow-template
    - docs
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T21:27:19.224Z
---

# A placeholder string can satisfy a "field carries X" trigger meant to discriminate real content from absence

**Found (code-verified — landed tip `8927103891fdc7902f15a498203f7eaeedd74823` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, phase 11 task p11-polish, read via the
run-scoped `_refinery` worktree whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

`escalateReasonOf` (`skills/war/assets/workflow-template.js`, search `const escalateReasonOf`,
~line 1951) writes, per escalating seat: `(seat) + ': ' + (blankText(reason) ? '(no escalate_reason)'
: reason.trim())`. So the joined `escalate_reason` text on an `escalated[]` record is **never**
blank — a seat that escalated with a genuinely empty `escalate_reason` field still gets the literal
placeholder string `(no escalate_reason)` baked into the record.

`skills/war/references/resume-and-recovery.md`, Held-partial-phase recovery runbook step 1 (search
"a reasoned seat escalation is plan-shaped by construction"), tells the Lead to route to a
`/red-team` plan amendment and stop when "its `escalated[]` record carries a seat's
`escalate_reason`" — read as a **presence** check. Under D17/D18's two-sided boundary, a genuinely
reason-less escalation (round-budget exhaustion, or a blocking finding surviving a fix round
unchanged) should instead route to "continue" (an implementation defect, not a plan defect).

Because `escalateReasonOf`'s placeholder always yields non-empty text, a literal presence check on
`escalate_reason` is trivially true for **every** escalation, reasoned or not. The runbook's own
written discriminator does not actually discriminate reasoned from reason-less on the field's
presence alone; only reading the actual text (and recognizing the placeholder) does.

**Mitigations already in place, why it still shipped:** a careful Lead reads the actual reason text
by hand and would notice the placeholder; the third OR arm in the same step (read the returned
`auditLog` and locate the defect in the plan slice) is a working backstop. This gap was flagged
twice in the phase (once against the original diff, once again against the terminal polish pass)
and disposed `note` both times — informational, not a specified fix, because the fix surface forks
(tighten the runbook trigger prose, or drop the placeholder in `escalateReasonOf`) and no owner was
assigned. Confirmed still present, unfixed, at the landed tip.

**Pattern to watch for:** a "field carries X" trigger written into a runbook or prompt is only as
reliable as its engine-side writer. A sentinel/placeholder string in the "absent" case defeats any
blank-or-presence check downstream. Before trusting a presence-only test as a real-vs-synthetic
discriminator, check whether the field's writer ever stuffs non-blank text into the absent case —
see also [[ask-question-blank-check-three-spellings-deferred-to-phase-3]] for the sibling pattern
(a blank check needs to be whitespace/placeholder-aware, not just non-null-aware).

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
search `const escalateReasonOf` (~line 1951, the `(no escalate_reason)` placeholder);
`skills/war/references/resume-and-recovery.md`, search "a reasoned seat escalation is plan-shaped
by construction" (Held-partial-phase recovery runbook, step 1).
