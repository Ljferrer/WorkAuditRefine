---
name: stranded-upstream-makes-safe-branch-d-refuse-a-merged-branch
description: "A stranded remote tip makes `git branch -d` refuse a local branch that IS merged into master — unset the upstream, don't escalate to -D"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: stranded-upstream-makes-safe-branch-d-refuse-a-merged-branch
  phase: aftermath sweep of campaign 2026-07-14-survey-debt (2026-07-15)
  keywords: 
    - git branch -d refuses
    - unset-upstream
    - stranded upstream
    - aftermath class-1
    - branch -D scorched-earth
    - pre-rebase remote tip
    - merged into upstream not HEAD
    - task branch cleanup
  tags: 
    - aftermath
    - git
    - cleanup
    - worktree
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# A stranded remote tip makes `git branch -d` refuse a local branch that is already merged

**What happened (code-verified — reproduced on all 6 affected branches during the
`2026-07-14-survey-debt` aftermath sweep):** `git branch -d` refused exactly the 6 WAR task
branches whose *remote* tips were stranded pre-rebase SHAs, even though each local tip was
provably reachable from `master` (`git merge-base --is-ancestor <tip> master` = true, tested at
delete time).

**Mechanism:** `git branch -d` does **not** check "merged into HEAD" when the branch has an
upstream. Per git's own rule, it requires the branch be fully merged **into its upstream** —
falling back to HEAD *only when no upstream is set*. A WAR task branch tracks
`origin/war/<slug>/<task-id>`, whose tip is the worker's **pre-rebase** commit (the refiner
rebases locally and never force-pushes, so the remote ref keeps the original SHA). The local
post-rebase tip and the stranded remote tip are on divergent histories — neither is an ancestor
of the other — so `-d` refuses. The refusal says nothing about safety: the content is in master.

**The rule — remove the confounder, don't lower the bar.** The tempting fix is `git branch -D`,
but `-D` is the **scorched-earth** verb (`skills/aftermath/SKILL.md`) and it *disables git's own
merged check* — exactly the independent second opinion worth keeping when deleting refs. Instead:

```sh
git branch --unset-upstream <branch>   # drop the stranded tracking ref
git branch -d <branch>                 # now -d compares against HEAD (master) and PASSES
```

With no upstream, `-d` falls back to the merged-into-HEAD check, which is precisely the
Class-1 gate — so git re-verifies the deletion independently rather than being overridden. All
6 branches deleted via safe `-d` this way; zero force-deletes in a default-mode sweep.

**Why it matters:** an aftermath Lead that reads `-d`'s refusal as "unmerged work" will either
strand these branches as needs-human forever, or escalate to `-D` and silently give up the
safety check on a *default-mode* run that never authorized scorched-earth. Both are wrong; the
refusal is an artifact of the tracking ref, not a data-loss signal.

Note the asymmetry this creates in one sweep: the *local* branch is deletable (content in
master), while the *remote* ref it tracked is genuinely stranded and stays — reported, allowlisted
per ADR 0027 (`docs/aftermath/known-stranded.tsv`), and cleared only by a deliberate manual
`git push origin --delete`.

## Related

[[aftermath-remote-stranded-differs-from-local-tip-reachability]] — the parent fact (remote tip
stranded ≠ content un-landed; `git cherry` proves patch-equivalence the tip-reachability gate
cannot). This lesson is its local-branch corollary: the same stranding also breaks `-d`.
[[aftermath-must-delete-its-own-probe-refs]] — same skill, scratch-state hygiene.

> archived 2026-07-27: resolved — moved to archive
