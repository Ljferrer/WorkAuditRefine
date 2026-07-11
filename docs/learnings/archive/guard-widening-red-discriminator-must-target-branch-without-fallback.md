---
name: guard-widening-red-discriminator-must-target-branch-without-fallback
description: "Case-pattern widening test proves the fix only on a branch with no independent fallback deny"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: guard-widening-red-discriminator-must-target-branch-without-fallback
  phase: guard-floor-and-scope-hook-coverage-completeness/t1.1
  keywords: 
    - RED GREEN discriminator
    - ancestor-walk fallback
    - case pattern widening
    - non-discriminating test case
    - dotdot traversal
    - war-worker
    - war-task marker
    - test fidelity
  tags: 
    - test-design
    - hooks
    - scope-hook
    - path-traversal
    - test-fidelity
  created: 2026-07-10
  absence_note: "referent not found @ phase guard-floor-and-scope-hook-coverage-completeness/t1.1 — servitor's worktree checkout lacks this phase's widened pattern and new test cases (hooks/validate-worktree-scope.sh still shows the old */../*|*/.. arm at line 61 in this cwd); verify against the landed branch before acting. See [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]."
  relates: 
    - "[[dotdot-pattern-misses-leading-relative-traversal]]"
    - "[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A pattern-widening test case only proves the widening on branches lacking an independent fallback deny

**The finding (audit rationale, t1.1, disposition note — Nit):** `validate-worktree-scope.sh`'s
`..`-reject pattern was widened from `*/../*|*/..` to the full four-shape class
`..|../*|*/../*|*/..` (closing [[dotdot-pattern-misses-leading-relative-traversal]]). New test
cases were added per agent-type branch (`war-worker`, `war-servitor`, `war-refiner`, no-`agent_type`)
to prove RED-under-old-pattern / GREEN-under-new-pattern. For the `war-worker` branch specifically,
both new cases (`../etc/foo` and bare `..`) already reached `exit 2` (deny) under the OLD pattern
too — because `war-worker`'s scope check has a **second, independent** deny path: the `.war-task`
ancestor-walk fallback denies any path that isn't a descendant of a marked worktree, regardless of
whether the `..`-pattern arm matches. So those two war-worker cases are GREEN both before and after
the widening — they don't discriminate the fix at all. The genuine RED→GREEN discriminator lives
on the refiner and no-`agent_type` branches, which fall through to a permissive `*) exit 0` when
the pattern doesn't match — those branches actually flip.

**The durable rule:** when a `case`-pattern reject class is widened and you're adding test coverage
across multiple branches that share the pattern, don't assume every branch's new test case is a
real discriminator. For each branch, ask: "if I mentally revert *only* the pattern-widening (leave
every other guard mechanism on this branch untouched), does this branch's own logic already deny
the input through some other path (an ancestor-walk, a separate allowlist, a stricter fallback)?"
If yes, that branch's case is confirmatory but not discriminating — the RED proof must come from a
branch that has no such fallback. Flag (don't silently accept) a widening PR whose only new test
coverage is on branches where the fallback already covers the gap; the suite can be green while the
actual regression-guard is thin.

**Why it's benign here:** the plan's end-state criterion only requires *some* branch to prove
RED→GREEN, and it does (refiner + no-agent_type) — so this is a test-fidelity observation, not a
coverage hole in the shipped guard.

> archived 2026-07-11: resolved — moved to archive
