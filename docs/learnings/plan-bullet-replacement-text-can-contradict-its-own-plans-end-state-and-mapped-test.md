---
name: plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test
description: "A plan task-bullet's literal replacement text can byte-diverge from its own End state and mapped test — resolve toward the checkable pair, not the bullet"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test
  phase: audit-gate-evidence-fidelity/1.1 (2026-07-12) + aftermath-class1-gate-evidence/1.1 (recurrence 2, 2026-07-16)
  keywords:
    - plan self-contradiction
    - backticks
    - End state grep
    - mapped durable test
    - intent is the ceiling
    - plan slice is the floor
    - plan authoring defect
    - land-cwd noun
    - Build order bullet
    - block comment rationale
    - source-comment-overclaims
    - "#815"
  tags:
    - plan-pattern
    - auditor-warning
    - red-team
    - plan-fidelity
  created: 2026-07-12
  updated: 2026-07-16
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
  promoted: docs/learnings/plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test.md
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

**Known residual — RESOLVED, see the dated note below:** the plan file's bullet parenthetical
`(exact bytes, backticks included)` contradicted End state #8 / test #815 as of this lesson's
original phase land (not fixed by the implementing task itself — the plan file was never in that
task's `Files:` list). A later plan-doc-correction task closed it; see below for what shipped and
the post-fix counts.

## RESOLVED — phase "gate-evidence-and-prose-truth" Task 2.3 (#893, 2026-07-15)

**Code-verified in this task's own worktree** (`docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`,
the Task 1.1 "Land-cwd noun" bullet and its Tests-list `**#815:**` sub-bullet): red-team review
(2026-07-15) found the residual above undersold the defect — it was **two** bullets, not one, and
fixing only the first would have left the same falsehood standing:

- **(a)** the task-1.1 land-cwd bullet's replacement literal, wrapped in the `(exact bytes, backticks
  included)` parenthetical this lesson names.
- **(b)** a second, unparenthesised sub-bullet under that same task's Tests list (the `**#815:**`
  count-assertion mapping bullet), which independently restated the backticked form via a
  double-backtick-escaped code span — no "(exact bytes…)" marker of its own, so a fix or a grep
  scoped to bullet (a)'s parenthetical alone would never have reached it.

Both bullets now read the non-backtick form ("the gate's cwd stays the _refinery land worktree"),
matching End state #8, the shipped `workflow-template.js` land clause, and the #815 durable
source-count test — all four now agree. Post-fix in that file: a case-insensitive count of `exact
bytes, backticks included` is 0; the backtick-wrapped `` `_refinery` `` literal count is exactly 1 —
Task 1.2's learning-note prose noun ("the `_refinery` land worktree", a directory name in prose, not
a code-literal claim), the one occurrence this lesson's own residual always expected to survive.

**Durable pattern unaffected:** this closes the specific residual this file recorded — the general
rule (resolve toward a plan's own checkable End state + mapped test when a bullet's literal
replacement text disagrees; grep a plan's own End state for a matching checkable condition before
publishing an "(exact bytes)" bullet; a sweep for one restatement of a corrected literal is a floor,
not a ceiling — hand-scan the same scope for siblings phrased without the grepped token) still
applies to every future plan.

## Recurrence 2 — aftermath-class1-gate-evidence/1.1 (2026-07-16), plan left uncorrected on purpose

**Code-verified at the landed `_refinery` tip** (this servitor's main checkout lags the just-landed
dev branch — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — so verification
used `<repo-root>/.claude/worktrees/2026-07-16-aftermath-class1-gate-evidence-2026-07-16/_refinery/`):
`docs/plans/2026-07-16-aftermath-class1-gate-evidence.md`'s Build order Task 1.1 bullet (the
row-scoped structure-test criterion, ~line 306) still instructs the block comment to state that
`git branch -d` presence is "a review-floor check riding the `--unset-upstream`-pinned subsection" —
the exact phrasing that same plan's red-team-corrected Commander's Intent End state 3 (~line 158-160)
explicitly **bans**: *"a comment claiming the `-d` floor 'rides the `--unset-upstream`-pinned
subsection' would ship a false rationale (the recorded source-comment-overclaims class)"*.

Unlike Recurrence 1 (#893), **this instance was never fixed** — the stale Build-order bullet ships
as-is in the landed plan. That is not a defect in the candidate: the worker followed End state 3 and
the spawn prompt's explicit correction, and the shipped block comment
(`skills/war-machine/war-pipeline-structure.test.sh` lines 268-272, verified present at the same
`_refinery` tip) correctly states the grep is a WHOLE-FILE review floor only, that the verb is named
in BOTH the gate cell and the recovery subsection, and that `--unset-upstream` is the sole mechanical
pin. The audit's own commit-body BREAK 4 empirically proves the resolution: reverting the whole
recovery subsection leaves the `git branch -d` grep still green (1 hit, in the gate cell) while
`--unset-upstream` goes red — exactly the asymmetry the shipped comment describes.

**Escalated durable point:** a plan-internal contradiction between a Build-order bullet and a
red-team-corrected End state does not require a follow-up plan-doc-correction task to be
"resolved" — the worker resolving toward the checkable pair (End state + test) is a complete fix at
the CODE surface. The stale bullet is a standing trap for a *future* reader of the plan document
(who might restore the false rationale from the bullet, not the shipped comment) — worth a
Nit/note pointing at the specific bullet, but never a hold, and not automatically worth a dedicated
plan-doc-correction task the way Recurrence 1's two-bullet miss was (that one changed the CHECKABLE
condition itself; this one is pure narrative-comment rationale already correctly resolved in code).

**How to apply (updated):** when grading this pattern, distinguish "the stale bullet describes a
CHECKABLE condition the candidate must satisfy" (Recurrence 1 — worth a correction task if the plan
itself is ever re-touched) from "the stale bullet only pre-scripts BLOCK-COMMENT PROSE the worker
correctly overrode" (Recurrence 2 — informational Nit is sufficient; the code-level artifact is
already the source of truth and carries no false claim).
