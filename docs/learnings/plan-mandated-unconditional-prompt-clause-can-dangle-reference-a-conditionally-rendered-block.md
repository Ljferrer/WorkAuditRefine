---
name: plan-mandated-unconditional-prompt-clause-can-dangle-reference-a-conditionally-rendered-block
description: "A plan End state's literal-grep landing pin can force an auditor-facing prompt clause to be emitted unconditionally even though the block it names by name only renders on some prompt variants — accepted as a fail-open residual, not a defect, when the seat's other instructions already default SOFT"
metadata:
  type: project
  provenance: code-verified
  slug: plan-mandated-unconditional-prompt-clause-can-dangle-reference-a-conditionally-rendered-block
  phase: 2026-08-06-gate-audit-finding-routing/phase-1 task 1.1 (landed dev/2026-08-06-gate-audit-finding-routing)
  keywords:
    - dangling reference
    - unconditional clause
    - conditional block
    - deferral parenthetical
    - mappedTestsLine
    - fail-open residual
    - plan-mandated literal pin
    - prompt coherence
    - End-state grep pin
    - MAPPED TESTS block
  tags:
    - gate-audit
    - prompt-engineering
    - plan-fidelity
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T01:46:18.323Z
---

# A plan-mandated unconditional prompt clause can name a block that only conditionally renders — accept it as fail-open residual, not a defect

**What happened (code-verified, `skills/war/assets/workflow-template.js`, verify still present
before acting — read at the landed tip `20816fd0412788ba11412356f5471f6b1447d682` via the
`_refinery13` worktree, gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-gate-audit-finding-routing-2026-08-15/_refinery/`):
the per-task gate-audit prompt's `mappedTestsLine` const renders `''` (byte-identical to the
pre-change prompt) when `MergeResult.mappedTests` is empty/absent (line ~1828: `(Array.isArray(mappedTests)
&& mappedTests.length) ? pt\`...\` : ''`). But the sentence immediately following it in the
`gateAuditVerdict` prompt template (line ~1857) is emitted **unconditionally** and ends "...the
captured artifact confirms on an ENUMERATING half that it did not run (the present-but-unrun path
is governed by the MAPPED TESTS block above)." On a mappedTests-less merge, that parenthetical
points a seat at a block that was never rendered into its own prompt.

Four separate audit findings across this phase's work-audit and gate-audit passes independently
spotted this same dangling reference and, in every case, correctly recorded it as `disposition:
note` (never a fix demand, never a hold): the exact wording — `"governed by the MAPPED TESTS block
above"` — is the plan's own End state 3 landing pin (`grep -Fc 'governed by the MAPPED TESTS block
above' ... >= 1`), so rewording it to be conditional would be a design change beyond mechanical
absorb scope, not a mechanical fix. And the direction is fail-open by construction: the standing
auditor card's D7 bullet already states "No threaded `mappedTests` ⇒ the SOFT cannot-confirm
posture," and the same prompt closes with "Default: SOFT. Hard only when provably unrun." — so a
seat dereferencing the absent block can only ever fail to find guidance it didn't need (no
mappedTests ⇒ nothing to grep ⇒ no false HARD is mintable regardless of what the deferral
parenthetical says).

## Durable rule

When a plan's End-state `check:` mandates an exact, unconditional literal string inside a prompt
template — and that literal names, by name, a block that only conditionally renders elsewhere in
the same template — do not score the resulting "dangling reference on the falsy branch" as a
defect if **both** of these hold: (1) the mandated wording is a landing pin the plan explicitly
requires byte-identical (rewording risks the pin), and (2) the affected code path's other governing
instructions already default to the safe/SOFT outcome, so the dangling reference cannot itself
cause a wrong verdict. Record it as an informational `note` finding for visibility (so it isn't
silently rediscovered every phase), not as a fix request — the correct fix, if ever done, is to
gate the unconditional clause on the same truthy condition that gates the block it names, which is
a design change belonging to a future plan slice, not a same-diff mechanical patch.

## Locate cue

`skills/war/assets/workflow-template.js` — `mappedTestsLine` (~line 1820-1833, the
`(Array.isArray(mappedTests) && mappedTests.length) ? ... : ''` ternary) and the deferral
parenthetical inside the `gateAuditVerdict` `agent(...)` prompt template (~line 1855-1857,
"...the present-but-unrun path is governed by the MAPPED TESTS block above)."). Verify still
present before acting.

## Related

[[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] — same family of "an
auditor's evidence/instruction ceiling doesn't itself make the underlying claim false." Both
findings originate from the same `2026-08-06-gate-audit-finding-routing` phase 1 task 1.1.
