---
name: redteam-claims-vs-reality-misfires-on-impl-plans
description: "claims-vs-reality grades NYI plan tasks Critical"
metadata: 
  node_type: memory
  type: project
  keywords: [false positive, not yet implemented, future tense, category error, BLOCKED verdict, adjudicate gate output, absent from codebase]
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

On /red-team of an IMPLEMENTATION plan (2026-06-25 concurrent-run-land-isolation), the
`claims-vs-reality` spine probe produced 16 "Critical/Major" findings of the form *"X is absent from
the codebase"* (`ensure-refinery-worktree` missing, `land_stale` not in the enum, version not bumped,
ADR absent, …). The `root-and-land-stale-sync` bespoke probe did the same (and even concluded the
design was "coherent … and sound" while still grading it `fail`). The probe read the plan's
**future-tense tasks** ("Task N requires X") as **present-tense factual claims** that X exists — a
category error for a plan whose entire purpose is to add X. The mechanical gate therefore returned
`BLOCKED` on a substantively sound plan.

**Why:** `claims-vs-reality` and `executable-proof` are written for verifying state/claims, not for
plans-of-future-work; nothing in the scaffold tells a probe "this artifact describes work yet to be
done." The adversarial-confirm stage does not catch it (the absence reproduces — it's true, just not
a defect).
**How to apply:** when red-teaming an implementation/TDD plan, the Lead must **adjudicate** the
gate output, not rubber-stamp it: treat "<artifact> not yet implemented" findings as **non-defects**,
cross-check each against its task and against `coverage-vs-source` (which correctly maps spec→tasks),
and report the adjudicated verdict (here CLEARED-WITH-NOTES) with the raw gate verdict shown for
transparency. The genuine signal lives in the executed probes + coverage/consistency/feasibility +
any `needsDecision` holes — not in "absent from codebase" counts. Mirrors the enforcement-vs-reality
gap in [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]].

## Instance: variable-audit-roster / T1 (2026-07-02, dev/2026-07-02-variable-audit-roster)

A narrower recurrence of the same misfire, one level more specific: the plan's own T1 step 3
**already stated** the exact stale-line-number drift in a meta-guard test (marker-count test cites
lines 69/93/367/368; real lines 70/93/624/627) and specified the fix (reword to construct-anchored
phrasing, no line numbers, same commit). The red-team's own `anchor-check-config` probe still
surfaced this as a `needsDecision` "hole." The Lead dismissed it correctly: a confirmed, already-
planned-for precondition is not a gap. Same root cause as the broader pattern above — a probe
grading a *plan* reads a stated future-fix as a present-tense defect — but here the artifact being
misread was the plan's own explicit deviation note, not a task's forward-looking claim. See
[[plan-survey-token-sweep-misses-untagged-siblings]] for the underlying drift this dismissal was
about.
