---
name: post-rebuttal-split-arm-shipped-with-three-known-verdict-integrity-residuals
description: "Phase 11's post-rebuttal split arm shipped with three plan-faithful but real verdict-integrity gaps"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: post-rebuttal-split-arm-shipped-with-three-known-verdict-integrity-residuals
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-11 (task 11.1), landed 8927103891fdc7902f15a498203f7eaeedd74823 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - seatConflictsOf
    - SCOPE_RATIONALE
    - sameLocus
    - scopeSided
    - seat-conflict ask
    - post-rebuttal split
    - verdict integrity
    - PIN-29
    - PIN-23
    - PIN-22
    - D17
    - D18
    - D19
    - findings-less blocking seat
    - neutralize to approve
    - fix-less survivor
    - lastFixKeys
    - survivors.every
    - FIX_NEEDED
    - audit-boundary redesign
  tags: 
    - war
    - audit-findings
    - workflow-template
    - verdict-routing
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T21:27:00.532Z
---

# Phase 11's post-rebuttal split arm shipped with three known, plan-faithful verdict-integrity residuals

**Found (code-verified — landed tip `8927103891fdc7902f15a498203f7eaeedd74823` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, phase 11 task 11.1, read via the run-scoped
`_refinery` worktree whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

Phase 11 replaced the old deadlock-tiebreak arm with a post-rebuttal split arm (D17/D18/D19,
PIN-22/23/29) in `skills/war/assets/workflow-template.js`. Nearly every audit seat across the
phase's many rounds independently re-spotted the same three gaps and every one of them ruled
"plan-faithful, informational, not a defect" — the Commander's Intent grants the seat-conflict
detector's exact locus predicate as Mechanism latitude, and D17/D18/D19 are the binding text these
mechanize. All three are confirmed present at the landed tip. Read this before touching the arm.

## 1. A findings-less blocking seat gets opposite outcomes from two sibling arms

`seatConflictsOf` (search `const seatConflictsOf`, ~line 1968) only pairs Critical/Major findings.
When a seat-conflict pairing DOES fire elsewhere in the same round, the neutralize loop (search
`for (const s of seats) if (s.verdict === 'request_changes')`, ~line 3658) flips **every**
`request_changes` seat to `approve`, including one that carried no Critical/Major at all — logged
as "it carried no Critical/Major finding to pair — a verdict never stands on findings it does not
have." Ten lines later, the sibling `if (!survivors.length)` arm (~line 3666) **escalates** the
identical seat shape, quoting the exact same principle. One principle, two opposite outcomes,
decided only by whether an unrelated seat's blocker happened to pair that round. Both paths log the
case; no fixture exercises the mixed 3+-seat panel that reaches this fork.

## 2. The seat-conflict pairing predicate is a wide net by design

`sameLocus` (~line 1966) pairs on file alone whenever **either** side's `line` is `null` — it does
not require both. `SCOPE_RATIONALE` (~line 1964, `/\b(?:scope|mandate|adjudicat\w*)\b/i`) matches
the bare word "scope"/"mandate"/any "adjudicat*" word anywhere in **either** side's rationale or
title (`scopeSided(f) || scopeSided(g)`, ~line 1978). A blocking Critical/Major whose rationale
merely uses "scope" in an unrelated sense (lexical scope, out-of-scope, scope-lock), sharing a file
with any approving seat's line-less Minor/Nit, neutralizes to a parked ask and the task **merges**
with the Critical/Major unfixed. This is the direct, literal mechanization of D19/PIN-23's own text
("same file/locus … a scope/mandate or adjudication-match rationale on at least one side") — not a
bug, but a known-wide net, filed as residual by at least seven separate audit passes across the
phase.

## 3. A mixed survivor batch delays a fix-less escalation by one round, never drops it

The fix-less-survivor test (~line 3677) is `survivors.every(f => blankText(f.suggested_fix))` — it
tests the **whole survivor set**, not each finding individually. PIN-29 reads "a fix-less surviving
blocker escalates as today," which a per-finding reading would apply immediately. A batch holding
one fixable Major and one fix-less Major both take the `FIX_NEEDED` route together instead. This is
bounded, not silent: `lastFixKeys` (declared ~line 3615, populated after each fix dispatch, read at
~line 3671) registers every blocker's `remintKey`, so the fix-less blocker escalates one round later
through the `unchanged` arm — but its `escalated[].blocked` text then reads "survived a fix round
unchanged (PIN-29)" rather than the D18 "decision-forked" wording, and one extra fix-round's budget
is spent before it exits.

**Why this matters:** all three are load-bearing, intentional trade-offs (Mechanism latitude) — do
not "fix" them without a plan amendment. But they are also real gaps a future maintainer will
re-discover unless warned: (1) means the same seat shape can either hold the phase or merge it
depending on panel composition; (2) means a scope-split "ask" fork can silently absorb a real
Critical/Major; (3) means `run.roundLimit` budget is spent slightly less efficiently than the plan
prose implies on a mixed batch.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
search `const SCOPE_RATIONALE`, `const sameLocus`, `const seatConflictsOf` (~line 1964-1980); search
`for (const s of seats) if (s.verdict === 'request_changes')` inside the seat-conflict arm
(~line 3658); search `if (!survivors.length)` (~line 3666); search
`survivors.every(f => blankText(f.suggested_fix))` (~line 3677); search `let lastFixKeys` (~line
3615).
