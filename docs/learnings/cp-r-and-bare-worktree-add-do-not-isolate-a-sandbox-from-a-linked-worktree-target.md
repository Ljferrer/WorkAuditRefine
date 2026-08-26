---
name: cp-r-and-bare-worktree-add-do-not-isolate-a-sandbox-from-a-linked-worktree-target
description: "`cp -R` and bare `git worktree add` don't isolate a sandbox from a linked worktree"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: cp-r-and-bare-worktree-add-do-not-isolate-a-sandbox-from-a-linked-worktree-target
  phase: 2026-08-02-redteam-doctrine-and-guards/phase-2 task 2.1 (End state 18)
  created: 2026-08-02
  tags: 
    - red-team
    - sandbox-isolation
    - linked-worktree
    - git-worktree
    - scope-lock
  keywords: 
    - cp -R not isolated
    - git worktree add ref leak
    - linked worktree .git file
    - git clone --no-hardlinks
    - SCOPE-LOCK preamble
    - sandbox escape
    - gitdir pointer
    - rm -rf survives ref
    - throwaway sandbox
    - probe isolation
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T09:22:53.108Z
---

# `cp -R` and a bare `git worktree add` both fail to isolate a sandbox from a linked-worktree target

**The two traps, both reproduced at the phase base of `2026-08-02-redteam-doctrine-and-guards`
(End state 18) and both landed as documented fixes in `skills/red-team/assets/workflow-scaffold.js`'s
SCOPE-LOCK preamble and `skills/red-team/SKILL.md` Step 3 — verify still present before acting:**

1. **`cp -R <repo> <tmp>` does not isolate a *linked* worktree.** A linked worktree's `.git` is a
   **file** (`gitdir: …/.git/worktrees/<name>`), not a directory — `cp -R` faithfully copies that
   pointer file, so every `git -C <tmp>` command in the "sandbox" actually drives the **real**
   repo's git-dir. Reproduced: a branch created inside the copy appeared in the real target and
   survived `rm -rf <tmp>`, the target's `HEAD` went detached, and the target's `git status`
   went dirty without the probe ever touching a target file. This is not hypothetical in this
   repo — `/red-team` itself typically runs from a linked worktree, so this is the default shape,
   not an edge case.

2. **A bare `git -C <repo> worktree add <tmp>` (no `--detach`) writes a real branch
   (`refs/heads/<tmp-basename>`) into the target's shared ref store, and that ref survives
   `rm -rf <tmp>`** — only `git worktree remove --force <tmp>` (or `rm -rf <tmp> && git -C <repo>
   worktree prune`) actually cleans it up; `rm -rf` alone also leaves a prunable
   `.git/worktrees/<name>/` admin entry that can block reuse of the same path later. A `--baseline`
   ref-diff escape guard (see [[escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes]]) will
   correctly flag this as an escape — including against the tool's *own* sanctioned sandbox idiom,
   if that idiom is the bare form.

**The fix that stays isolated either way:** `git clone --no-hardlinks <repo> <tmp>` is isolated
even when `<repo>` is a linked worktree (verified). Caveat: **a clone carries committed state
only** — uncommitted edits and untracked files do not come across — so a probe that needs the
working tree as it currently stands must overlay that state explicitly (copy the dirty paths in,
or apply `git -C <repo> diff`) rather than assume the clone reflects it. Decision rule now
documented on both surfaces: if the probe runs `git` at all, clone; if it only reads/edits files,
`cp -R` remains fine (with an explicit "when `<repo>/.git` is a file, never run `git` against this
copy" caveat); `worktree add --detach` is kept only for read-only inspection of committed state
(it shares the target's ref store, so the probe must create no branches/tags there).

**How to apply:** before choosing a sandbox idiom for any tool that clones/copies a git repo for
throwaway probing, check whether the source is itself a linked worktree (`.git` is a file, not a
dir) — if so, `cp -R` is silently unsafe for anything that then runs `git`, and a non-detached
`worktree add` leaves ref residue in the shared store that a later escape-guard run (or the next
`/war` Provision barrier) can trip on.

Related: [[redteam-sandbox-probe-branch-residue-blocks-next-provision]] (the precursor incident —
a probe building git fixtures inside the shared sandbox worktree left branch residue that later
collided with Provision; this lesson names the exact isolation-failure mechanism and the now-landed
fix). [[escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes]] (the guard that would have
caught #2 above).
