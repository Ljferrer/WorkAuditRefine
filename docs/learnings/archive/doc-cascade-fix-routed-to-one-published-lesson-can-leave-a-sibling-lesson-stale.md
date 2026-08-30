---
name: doc-cascade-fix-routed-to-one-published-lesson-can-leave-a-sibling-lesson-stale
description: "When a plan changes a landed mechanism and updates the ONE published lesson its `deps` content…"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: doc-cascade-fix-routed-to-one-published-lesson-can-leave-a-sibling-lesson-stale
  phase: 2026-08-06-gate2-publication-guard/1.1
  keywords:
    - doc cascade
    - sibling lesson stale
    - mechanism change
    - deps content edge
    - retired mechanism
    - lesson currency
    - multiple lessons same fix
    - stale prose survives a mechanism rewrite
  tags:
    - memory-system
    - doc-currency
    - plan-scoping
    - audit-finding
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T12:01:15.895Z
---

# A doc-cascade fix routed to one published lesson can leave a sibling lesson stale

**The instance (2026-08-06-gate2-publication-guard/1.1, Minor, disposition follow-up — recorded
at auditSha `835d8c8e97e50c6450283c864d7efc5b9ebc1c3e`, gateEvidence:true, Escalations: [];
checkout-topology note: no live worktree for the phase branch existed at write time — cwd HEAD was
`master`@`a7a54dab` — this instance is grounded in the pinned gate-audit's own quoted diffs and my
own direct read of the affected local memory file, not a fresh Read of the branch tip itself):**
Task 1.1 changed the sanctioned Gate-2 pre-push mechanism (added a fail-closed `git fetch origin
<working>` refresh before the unpushed-range probe, locked by `D22_ORDERED_SPAN`). The plan's
`deps` content edge routed exactly one published lesson,
`docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` (#1293), to
have its Mitigation layer-2 bullet rewritten to the new shape as a dated snapshot — and that
rewrite landed correctly (verified: the retired `git show --name-only --format= HEAD` literal is
gone, `@{upstream}` is present). A **second** published lesson,
`docs/learnings/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`
(#1288's own predecessor lesson, verified stale by direct Read of this local memory dir's archived
promoted copy — its "The fix" and "Pattern to reuse" paragraphs still prescribed the unrefreshed
range probe with no fetch step), was never named anywhere in the plan and so was never routed —
its stale prose is now under-specified in exactly the way the phase's own fetch-precondition fix
proves unsound (an unrefreshed boundary can condemn, and revert, a commit origin already has).

**Why the plan's own audit didn't catch it as a hold:** the task's diff footprint is pinned (End
state 10: exactly three files touched), so touching the second lesson inside Task 1.1's scope
would itself have been a footprint violation — the auditor correctly filed this as a `follow-up`
note, not a hold, and named it "the same class as #1293 itself." The gap is structural, not a
worker mistake: a plan's `deps` content edge is written against the ONE lesson the author already
knows describes the mechanism, and nothing in the standard drift-guard/retired-token sweep catches
an *added* precondition (the Lead's standing retired-token sweep triggers on
retire/rename/consolidate; this change adds a step, so it never fires).

**The durable pattern:** before finalizing a task's file footprint for a plan that changes a
landed mechanism (a guard clause, a probe ordering, a fallback rule), grep `docs/learnings/` (or
run `war-memory query '<mechanism-name>' --repo docs/learnings`) for **every** published lesson
that describes the mechanism being changed — not just the one lesson the plan author already had
in mind. A mechanism this load-bearing (Gate-2's pre-push safety check) had **two** independent
lessons narrating it, written five weeks apart by different authors/incidents
([[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]] and
[[prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only]]); a plan slice or
`deps` edge that names only one by filename is not wrong, but it is incomplete, and the gap will
not self-heal via any existing sweep (retired-token sweeps trigger on removal/rename, not on
addition; a doc-currency pass would need to scope by *mechanism*, not by *lesson identity*).

**Pattern to reuse for future plans touching a documented mechanism:** treat "which lessons
describe this mechanism" as part of scoping the change, alongside "which code files implement
it" — a quick repo-lesson grep for the mechanism's key terms (e.g. `git log --name-only`, `Gate-2
pre-push`, `@{upstream}`) before locking the plan's file footprint costs one search and prevents
exactly this class of stale-doc follow-up.

> archived 2026-08-30: resolved — moved to archive
