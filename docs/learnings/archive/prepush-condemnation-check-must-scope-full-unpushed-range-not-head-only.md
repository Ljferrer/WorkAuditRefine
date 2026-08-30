---
name: prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only
description: "Pre-push condemnation must scan the full unpushed range, not HEAD only"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only
  phase: 2026-08-02-war-engine-and-standing-doc-truth/1.4
  keywords: 
    - pre-push check
    - Gate-2
    - unpushed range
    - HEAD-only probe
    - crash window
    - git log --name-only
    - upstream
    - staged-file check
    - condemned commit
    - CAS
  tags: 
    - land-path
    - gate-2
    - git
    - safety-check
    - design-pattern
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T16:54:49.638Z
---

# A pre-push condemnation check scoped to HEAD alone has a crash-window gap

**The defect this phase closed (code-verified, `skills/war/SKILL.md`, the
`**Pre-push staged-file check (never skip)**` clause inside `**Post-servitor publication (Gate 2`,
landed tip `8f0d1009d1727e020d830f98debe91df09cd205d`; verify still present before acting):** the
retired probe read only `git show --name-only --format= HEAD` — the tip commit. If a prior pass
crashed after committing `docs(learnings): phase N` but before pushing, and a *second* pass then
authors a new commit on top, the first (possibly poisoned — staged from a stale checkout) commit
sits at `HEAD~1`, is never inspected, and reaches origin untouched on the next successful push.
This is exactly the incident class `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
records (stale version slots silently reverting a landed release while lock-step stayed green).

**The fix:** probe the **whole unpushed range**, not the tip —
`git log --name-only --format='commit %H' '@{upstream}'..HEAD`, falling back deterministically
(never a judgment call) to `git log --name-only --format='commit %H' origin/<working>..HEAD` when
`@{upstream}` is unset in the transient publication worktree. **Any** commit in the range carrying
an escaping path condemns the **whole range**, never the tip alone.

**Pattern to reuse:** any pre-push (or pre-merge) safety probe that inspects "the last commit" or
"HEAD" alone is vulnerable to exactly this crash-then-resume shape whenever the surrounding flow
can leave more than one unpushed commit on the branch between runs. Scope the probe to the full
range against the remote-tracking ref (with a deterministic non-`@{upstream}` fallback for a
freshly-provisioned worktree), never to the tip in isolation.

**Second-order consequence this creates (see [[git-revert-on-widened-unpushed-range-needs-neutralized-pair-exemption]]):**
once condemnation is range-scoped, `git revert`ing a condemned commit does not remove it from the
range — it appends a second commit touching the same paths — so a naive revert-then-repush can
loop forever unless the undo pass recognizes revert-pairs as clean.

> archived 2026-08-30: resolved — moved to archive
