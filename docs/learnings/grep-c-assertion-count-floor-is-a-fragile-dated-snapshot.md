---
name: grep-c-assertion-count-floor-is-a-fragile-dated-snapshot
description: "A grep -c End-state count floor is a dated snapshot — base can be miscounted both ways"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: grep-c-assertion-count-floor-is-a-fragile-dated-snapshot
  phase: 2026-08-06-doc-cli-consistency-corpus/phase-1
  keywords: 
    - grep -c count floor
    - dated snapshot
    - End state check
    - assertion message count
    - must be flagged
    - comment line false inclusion
    - conversion-time literal
    - stale plan literal
    - land-barrier endstate check
  tags: 
    - plan-authoring
    - audit-calibration
    - gate-audit
    - comment-lag
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T05:52:30.641Z
---

# A grep -c count floor in a plan End state is fragile in both directions

## What happened

Phase 1 of `2026-08-06-doc-cli-consistency-corpus`'s End state 3 mandated:
`grep -cF 'must be flagged' skills/_shared/doc-cli-consistency.test.mjs` grow from 8 to 10 (the
plan's own dated snapshot, taken at conversion time, of two new fixtures each carrying the
literal assertion message). The task-1.1 auditor traced the pinned diff by hand at the
task's own `audit_sha` and found the diff added exactly 2 matching lines and removed none,
yet the pinned candidate carried only 8 total matching lines — concluding the plan's base-count
assumption (8) was itself wrong (the real pre-diff base was 6), so the floor of `>= 10` could
never be satisfied by correct work, and filed a `phaseClose:true` Nit recommending the Lead
correct the floor to `>= 8` rather than "pad the suite with extra assertion messages to reach
10 — that is exactly the comment-line false-green the red-team already flagged."

**Re-verified at the actual landed tip** (`c809b77fee45630b19b195bf80f13743168a7857`, read via
the `_refinery` worktree whose `gitdir` physical path contains this plan's slug — the strongest
grounding rung, HEAD exactly equal to the landed tip): `grep -c 'must be flagged'
skills/_shared/doc-cli-consistency.test.mjs` returns **10**, not 8. Two of those 10 matching
lines (`284`, `287` at the landed tip) are **comments** ("`-> must be flagged unresolved`" /
"`(both grep forms) -> must be flagged`") near an unrelated verb-scan test, not assertion
messages — `grep -c` counts every matching *line*, comments included, while the plan's own
mental model ("two new fixtures, two new assert messages") only tracked assertion lines. So at
the landed tip the plan's original `-ge 10` floor is in fact satisfied — the audit finding's
"cannot pass" conclusion held only at the earlier `audit_sha`, not at land.

This is recorded as a **generic pattern**, not a live instance — a fix round or a
comment-scope miscount could equally explain the delta between `audit_sha` and the landed tip,
and no Bash access was available in this session to `git diff` between the two SHAs and confirm
which. Per the finding-match discipline, do not treat this file/line as a currently-broken
instance.

## Durable rule

1. A plan-authored `grep -c <phrase> <file> >= N` End-state floor is a **dated snapshot**: N is
   only as good as the plan author's count of the base file at conversion time. Before treating
   a shortfall against N as an implementation defect, recompute the actual base count from the
   phase-base commit rather than trusting the plan's arithmetic.
2. `grep -c` (and `grep -cF`) counts **matching lines**, not matching assertions — if the target
   phrase can also appear in a comment, a doc string, or an unrelated fixture, the floor is
   measuring a coarser surface than the plan author likely intended. A count-floor check is
   weaker evidence than a structural assert (e.g. counting `assert.*'<phrase>'` call sites) and
   should be read as "at least this many lines mention the phrase," not "at least this many
   fixtures were added."
3. When auditing a count-floor finding, re-run the grep at the **actual landed tip**, not just
   the task's own `audit_sha` — a phase-close checkpoint, a later task in the same phase, or a
   fix round can change the count between task-level audit and phase land.

## Related

[[endstate-check-fixed-context-window-undercaptures-growing-enumerated-block]] — a sibling
fragile-literal-floor family (fixed grep context window instead of a bare count), same root
cause: a plan-authored numeric/structural check computed against a snapshot that later commits
can legitimately move past.
