---
name: plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test
description: "A plan task-bullet's literal replacement text can byte-diverge from its own End state and mapped test — resolve toward the checkable pair, not the bullet"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test
  phase: audit-gate-evidence-fidelity/1.1 (2026-07-12)
  keywords: 
    - plan self-contradiction
    - backticks
    - End state grep
    - mapped durable test
    - intent is the ceiling
    - plan slice is the floor
    - plan authoring defect
    - land-cwd noun
    - "#815"
  tags: 
    - plan-pattern
    - auditor-warning
    - red-team
    - plan-fidelity
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A plan's own task-bullet text can literally contradict its own End state and mapped test

**What happened (code-verified via the phase's own task worktree** — this servitor's own cwd was a
stale, unrelated checkout, see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]];
confirmed instead at
`<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`
and its `.test.mjs`):

`docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`'s task-1.1 bullet for the #815 land-cwd fix
literally says replace the clause with `"the gate's cwd stays the `_refinery` land worktree"`
**(exact bytes, backticks included** around `_refinery`**)**. But the SAME plan document's
Commander's Intent End state #8 specifies the checkable condition as
`grep -n "cwd stays the _refinery land worktree"` — **no backticks** — and requires a durable test
asserting that exact (non-backtick) source-count. A backtick-including implementation would fail
BOTH the End-state grep and the mapped durable test, and would break byte-parity with the file's
two sibling "cwd stays the task worktree" clauses (also no backticks).

The worker resolved toward the checkable pair (End state + test), landing the non-backtick form —
correct-by-construction. Two independent auditor seats each caught the bullet-vs-End-state
disagreement and correctly graded it a non-blocking Nit/note (informational only), not a defect,
per the general "intent is the ceiling, plan slice is the floor" latitude rule. Confirmed at the
landed tip: `grep -c "cwd stays the task worktree"` = 2, `grep -c "cwd stays the _refinery land
worktree"` = 1, and `workflow-template.test.mjs` asserts exactly those counts.

**Why durable — distinct from the routine floor-vs-ceiling latitude case:** this is not Purpose
prose being broader than a literal End state (the already-documented, routine case). This is a
**plan self-contradiction within the same document** — the task bullet's own replacement-text
literal disagrees with that same plan's own checkable End state and its own named mapped test. A
plan author (or `/war-strategy`/`/red-team`) copying a bullet's literal text verbatim without
cross-checking it against the End-state grep it's supposed to satisfy can ship an internally
inconsistent plan; a worker who implements the bullet literally (rather than resolving toward the
checkable End state + test) would fail its own phase's gate.

**How to apply:**
- When authoring or reviewing a plan bullet that gives an exact-bytes replacement string, grep that
  same plan's Commander's Intent End state for any checkable condition (a `grep`/count) naming the
  same clause, and confirm the two are byte-identical before publishing — don't let a bullet's
  "(exact bytes)" parenthetical go unchecked against its own End state.
- When auditing an implementation that diverges from a plan bullet's literal text: check whether
  the divergence is FAITHFUL to that plan's own End state and mapped test before flagging it as a
  defect — if the live durable test confirms the candidate, the bullet (not the code) is the stale
  artifact, and the finding is at most a Nit/note recommending a future plan-doc correction.

**Known residual (not fixed, out of scope for the implementing task):** the plan file's bullet
parenthetical `(exact bytes, backticks included)` still contradicts End state #8 / test #815 as of
phase land — a future plan-doc pass should correct it to match the non-backtick form. The plan file
is not in the implementing task's `Files:` list.
