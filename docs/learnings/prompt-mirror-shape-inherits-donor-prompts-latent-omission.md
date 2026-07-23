---
name: prompt-mirror-shape-inherits-donor-prompts-latent-omission
description: "Building a new refiner dispatch prompt by mirroring an existing sibling prompt's shape byte-for-byte also copies the sibling's own latent omission — a newly reachable dispatch site can inherit a pre-existing bug rather than start clean"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: prompt-mirror-shape-inherits-donor-prompts-latent-omission
  phase: merge-land-resilience/phase-1 (task 1.1)
  keywords: 
    - prompt mirroring
    - dispatch shape
    - submodMergeNote
    - environment-proceed
    - baseline-proceed
    - re-merge prompt
    - workflow-template.js
    - inherited omission
    - targetRepo scoping
    - submodule task
    - "Commander's Intent mirror method"
    - latent bug propagation
  tags: 
    - war
    - workflow-template
    - dispatch-prompt
    - submodule
    - plan-method
  created: 2026-07-22
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T06:17:54.124Z
---

# Mirroring an existing dispatch prompt's shape can copy its donor's latent omission, not just its correct parts

**What happened (code-verified — `skills/war/assets/workflow-template.js`, confirmed at the
landed phase-1 tip via the `p1-polish` task worktree, `gitdir` resolving to
`.claude/war/wt/2026-07-22-merge-land-resilience-2026-07-22/p1-polish/` — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] for why the servitor's own session
cwd could not be trusted directly):** phase 1's Commander's Intent Method directed "mirror the
existing `baseline-proceed` dispatch shape" for the new `environment-proceed` re-merge/re-land
recovery prompts. `submodMergeNote` (a `targetRepo`-scoping clause for submodule tasks, built once
near the top of the merge-task branch and threaded only into the *initial* merge dispatch, ~line
1202/1239) was never threaded into the pre-existing `baseline-proceed` re-merge dispatch either —
that omission predates this phase. The new `environment-proceed` re-merge prompt (built ~line 1379,
dispatched at line 1391) mirrors the `baseline-proceed` re-merge's shape byte-for-byte, which means
it faithfully copied the *absence* of `submodMergeNote` too. A `taskType:'submodule'` task whose
gate fails `environment`-classified now gets a re-merge prompt instructing `cd <_refinery> (on
<integrationBranch>), git merge <task.branch>` with no `targetRepo` scoping — even though the task
branch lives in the submodule repo. Verified still absent at landed tip: `grep -n submodMergeNote
skills/war/assets/workflow-template.js` returns only the two build/thread sites for the *initial*
merge dispatch (lines 1202, 1239), never touching either recovery-prompt build site (~1379,
~1391) or the land-site re-land (~1882, ~1887).

Blast radius is bounded here (the refiner would fail the merge and return `error`, falling to a
soft escalation — degrades, does not corrupt) — the auditor correctly scored it Minor/`follow-up`,
not a blocker. That is *why* it can persist across a whole phase unfixed: a bounded-blast-radius gap
in a mirrored prompt is easy to defer indefinitely because nothing reds.

**The pattern:** "mirror sibling X's shape" is a correct, cheap implementation method (ponytail
rung 2 — reuse what's already in the codebase) — but a mirror copies the donor's actual behavior,
bugs included, not just its "intended" behavior. Before shipping a prompt built by mirroring an
existing one, diff the donor against its *own* full requirements (not just the new feature's own
requirements) — a donor that already silently drops a clause for an edge case (submodule scoping,
here) will hand that same drop to every future mirror, and the drop compounds: fixing the root
donor prompt is a one-line, one-site fix; each mirror inherits it as its own separate, easy-to-miss
follow-up finding.

**How to apply:** when a plan's Method says "mirror sibling dispatch/prompt X," treat that as two
obligations, not one: (1) match the new site's own new requirements to X's shape, and (2) audit X
itself for known omissions before copying it — the correct fix is usually to patch the *donor*
prompt once (here: thread `submodMergeNote` into `baseline-proceed`'s re-merge too, at the same
time as the new `environment-proceed` one), so every current and future mirror inherits the fix
instead of the bug.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (a different both-surfaces
coupling — standing `.md` card vs dispatched prompt — same root idea that a copied/mirrored surface
needs its own completeness check, not just presence).
