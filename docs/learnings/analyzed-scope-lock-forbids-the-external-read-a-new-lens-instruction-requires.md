---
name: analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires
description: "Adding a new dispatched-prompt instruction that requires a red-team lens probe to read something OUTSIDE its confined repo (a cited GitHub issue via gh, a network resource) is silently capped when that probe's technique is 'analyzed' — the analyzed scopeLock arm ('Restrict every Read/Grep/Glob to paths under ${repo}...; open nothing else on the machine', stamped 'OVERRIDES ANY AMBIENT PROJECT CONTEXT') carves out no exception for it, so a conservative probe declines the new read and the mechanism degrades to its fallback arm every time"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - scope-lock
    - analyzed probe
    - scopeLock override
    - PER-ISSUE EVIDENCE JOIN
    - coverage-vs-source
    - gh issue read
    - red-team lens
    - workflow-scaffold.js
    - fail-open capping
    - open nothing else on the machine
  provenance: code-verified
  slug: analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires
  phase: "authoring-side-verification/phase-2 (Task 2.1 audit finding, D9/PIN-26)"
  tags: 
    - red-team
    - prompt-authoring
    - guard-architecture
    - fail-open
  created: 2026-08-25
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T07:01:13.992Z
---

# A scope-locked probe's own preamble can forbid the exact external read a new instruction asks it to do

## What happened (code-verified at the landed tip)

Verified at `959d1fa1d69e5fea368ebc4be64d2eab833df15a` on `claude/authoring-side-verification-600a79`
(read via the `_refinery` worktree at `.claude/war-worktrees/authoring-side-verification-2026-08-24/_refinery`,
whose gitdir physical path names this plan's slug and whose HEAD equals the landed tip exactly).

`skills/red-team/assets/workflow-scaffold.js`'s `coverage-vs-source` SPINE probe (`technique:
'analyzed'`, line ~229) carries the new **PER-ISSUE EVIDENCE JOIN** clause: "read each cited source
issue's `## Evidence artifacts` section and confirm every artifact it lists appears in the block…
An issue you cannot reach (gh/network/auth failure) is a named unverified note in your findings…".
This requires a `gh issue view`-class read of a GitHub issue not named in the plan/spec.

But every `technique: 'analyzed'` probe is composed with the `scopeLock('analyzed')` preamble
(line 165), which reads verbatim: `Restrict every Read / Grep / Glob to paths under ${repo} (plus
the plan/spec named above); open nothing else on the machine.` — under a banner stamped `SCOPE-LOCK
— READ THIS FIRST. IT OVERRIDES ANY AMBIENT PROJECT CONTEXT.` (line 153). The only named exception
is "the plan/spec named above" — cited GitHub issues are not enumerated there.

## Why this matters

A probe that resolves the conflict conservatively (the correct read of an "overrides ambient
context" preamble that explicitly says "open nothing else on the machine") will decline the `gh`
read for every cited issue and emit the join's third arm (a named unverified note) unconditionally
— the primary arm of the new mechanism never actually fires, even when `gh`/network access is fully
available. This fails **open and loud** (the unverified note is still produced, never silently
dropped), which is why an auditor scores it Minor rather than a hold — but the deliverable's
efficacy is at stake and nothing in the prompt composition resolves the tension. At land this was
routed `disposition: follow-up` (not absorbed) twice by different audit seats — it remains live.

## The durable rule

When you add a new instruction to a dispatched prompt that requires a probe to read something
**outside** its already-confined repo/target set (a cited issue, a network resource, an external
file), a prompt-body addition alone is **insufficient** if that probe's technique carries a
scope-lock preamble — the scope-lock is deliberately composed to override competing instructions
in the same prompt (ADR 0033's defense-in-depth prevention layer). You must also widen the
scope-lock's own carve-out clause (the "(plus the plan/spec named above)" parenthetical, or
equivalent) to name the new exception explicitly, e.g. "…(plus the plan/spec named above, and —
for the per-issue Evidence join only — `gh issue view` of the cited issue numbers, still no other
file on the machine)". Widening a scope-lock is a deliberate contract decision (a defense-in-depth
change), not a mechanical edit — treat it as its own reviewed step, not a drive-by addition
alongside the new instruction.

## Locate-cue (verify still present before acting)

`skills/red-team/assets/workflow-scaffold.js`: `scopeLock()` function (~line 152-168), the
`analyzed`-arm ternary at line 165; the `coverage-vs-source` SPINE entry's PER-ISSUE EVIDENCE JOIN
sentence at line ~229 (inside the `SPINE` array, `name: 'coverage-vs-source'`).

## Related

[[template-defers-runtime-values-to-agent-via-literal-placeholder]] — a different
`workflow-template.js` prompt-composition gotcha (agent-resolved placeholders), same general class
of "the dispatched prompt is the only surface the probe agent ever reads."
