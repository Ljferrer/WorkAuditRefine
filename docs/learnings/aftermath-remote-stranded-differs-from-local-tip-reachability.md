---
name: aftermath-remote-stranded-differs-from-local-tip-reachability
description: "ENCODED (aftermath-class1-gate-evidence): a remote-tip-stranded branch is usually local-tip-reachable — test the SHA you delete; git cherry proves patch-equivalence"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: aftermath stranded branch reachability git-cherry patch-equivalence merge-queue rebase remote-ref local-tip tip-reachability class-1 known-stranded serial-merge
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

In `/aftermath` Class-1, "stranded" is a property of the **specific SHA you test**, not the branch. During a `/war` serial merge queue, a task branch is rebased before merge, so `origin/heads/war/.../pN` (the worker's pushed pre-rebase tip) is often **not** an ancestor of master, while the same branch's **local** ref points at the final rebased SHA that **is** an ancestor. So `git merge-base --is-ancestor <remote-sha> origin/master` says STRANDED while `<local-sha>` says REACHABLE — same branch, opposite verdict. Consequence: derive the deletion gate against the exact ref you intend to remove (remote gate on remote SHA, local gate on local SHA), never mix them.

When a ref genuinely fails tip-reachability, `git cherry origin/master <ref>` (0 lines prefixed `+` ⇒ every patch already in master by patch-id) is the cheap patch-equivalence proof the mechanical tip-reachability gate lacks — it retroactively confirms "landed under a rewritten SHA" (the ADR 0027 acknowledged-stranded case) is safe; any `+` line means patch-equivalence is NOT PROVEN (squashes and conflict-resolved rebases legitimately change patch-ids), never proof of truly un-merged work — the ref stays needs-human. Observed 2026-07-13 cleaning the memory-mined-debt campaign: 11 refs stranded by remote SHA, all 0-unmerged via `git cherry`, and all reachable via their local tips.

Also: a shell exclusion filter (`$STRANDED` matched inside a piped `while read … done` subshell) can silently no-op and delete refs you meant to hold — verify the residual set after a batched `git push origin --delete`, don't trust the loop.

2026-07-16: `docs/specs/2026-07-16-aftermath-class1-gate-evidence-design.md` — the per-ref gate rule, the git-cherry row-evidence recipe, and the unset-upstream `-d` recovery are now encoded in `skills/aftermath/SKILL.md` Class-1; the third paragraph's shell-exclusion-filter / batched `git push origin --delete` verification gotcha above is not encoded anywhere and stays this lesson's standing warning.

Related: [[aftermath-2026-07-03-stranded-remote-set]], [[audit-2026-06-29-plans-serial-stack]].
