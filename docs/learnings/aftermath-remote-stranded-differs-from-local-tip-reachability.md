---
name: aftermath-remote-stranded-differs-from-local-tip-reachability
description: "/aftermath Class-1 — a branch stranded by its REMOTE tip (pre-rebase SHA) is usually reachable via its LOCAL tip (final rebased SHA); test the SHA you delete, and git cherry proves patch-equivalence the tip-reachability gate can't"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: aftermath stranded branch reachability git-cherry patch-equivalence merge-queue rebase remote-ref local-tip tip-reachability class-1 known-stranded serial-merge
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

In `/aftermath` Class-1, "stranded" is a property of the **specific SHA you test**, not the branch. During a `/war` serial merge queue, a task branch is rebased before merge, so `origin/heads/war/.../pN` (the worker's pushed pre-rebase tip) is often **not** an ancestor of master, while the same branch's **local** ref points at the final rebased SHA that **is** an ancestor. So `git merge-base --is-ancestor <remote-sha> origin/master` says STRANDED while `<local-sha>` says REACHABLE — same branch, opposite verdict. Consequence: derive the deletion gate against the exact ref you intend to remove (remote gate on remote SHA, local gate on local SHA), never mix them.

When a ref genuinely fails tip-reachability, `git cherry origin/master <ref>` (0 lines prefixed `+` ⇒ every patch already in master by patch-id) is the cheap patch-equivalence proof the mechanical tip-reachability gate lacks — it retroactively confirms "landed under a rewritten SHA" (the ADR 0027 acknowledged-stranded case) is safe, distinguishing it from truly un-merged work. Observed 2026-07-13 cleaning the memory-mined-debt campaign: 11 refs stranded by remote SHA, all 0-unmerged via `git cherry`, and all reachable via their local tips.

Also: a shell exclusion filter (`$STRANDED` matched inside a piped `while read … done` subshell) can silently no-op and delete refs you meant to hold — verify the residual set after a batched `git push origin --delete`, don't trust the loop.

Related: [[aftermath-2026-07-03-stranded-remote-set]], [[audit-2026-06-29-plans-serial-stack]].
