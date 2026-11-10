---
name: prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only
description: "A pre-push condemnation probe must fetch first, then scan the full unpushed range, not HEAD only, and must exempt a commit paired with its own revert"
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
    - fetch refresh
    - stale remote-tracking ref
    - fail-closed fetch
    - D22_ORDERED_SPAN
    - doc cascade
    - git revert
    - neutralized pair
    - This reverts commit
    - undo routing
    - bounded retry
    - non-termination
  tags: 
    - land-path
    - gate-2
    - git
    - safety-check
    - design-pattern
    - undo-loop
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-18
---

# A pre-push condemnation check scoped to HEAD alone has a crash-window gap

**The defect (code-verified, `skills/war/SKILL.md`, the `**Pre-push staged-file check (never skip)**`
clause inside `**Post-servitor publication (Gate 2`; verify still present before acting):** the
retired probe read only `git show --name-only --format= HEAD` — the tip commit. If a prior pass
crashed after committing `docs(learnings): phase N` but before pushing, and a *second* pass then
authors a new commit on top, the first (possibly poisoned — staged from a stale checkout) commit
sits at `HEAD~1`, is never inspected, and reaches origin untouched on the next successful push.
This is the incident class [[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]
records (stale version slots silently reverting a landed release while lock-step stayed green).

**The fix:** probe the **whole unpushed range**, not the tip —
`git log --name-only --format='commit %H' '@{upstream}'..HEAD`, falling back deterministically
(never a judgment call) to `git log --name-only --format='commit %H' origin/<working>..HEAD` when
`@{upstream}` is unset in the transient publication worktree. **Any** commit in the range carrying
an escaping path condemns the **whole range**, never the tip alone. A range probe alone is **still
unsound**: its left boundary (`@{upstream}` / `origin/<working>`) can be stale if the local
remote-tracking ref has not been refreshed, so a commit origin already received can be mis-condemned
(and reverted) as "unpushed". So the landed fix runs a **fail-closed `git fetch origin <working>`
refresh immediately before the range probe** — on a non-zero fetch exit: do not probe, do not push,
escalate, leaving the worktree in place for inspection. This ordering is locked by
`D22_ORDERED_SPAN` in `skills/war/assets/skill-doc-contracts.test.mjs` (verify still present before
acting), which places the fetch arm strictly between the `docs(learnings): phase N` commit-step arm
and the range-probe arm. The same fix is recorded in the Mitigation layer-2 bullet of
[[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]].

**Neutralized-pair exemption.** Once condemnation is range-scoped, the standing "undo a condemned
commit with `git revert`, then re-probe" routine stops converging. `git revert` does not remove the
condemned commit from the range; it **appends** a new commit touching the same escaping paths. The
re-probe condemns both, and the bounded-retry sentence ("condemned again → do not loop; escalate")
fires every time. The fix (adjudicated over "push the revert first", which would send a
poisoned-then-reverted pair to origin): a commit is not condemned when a *later* commit in the same
range reverts it, linked by git's own `This reverts commit <sha>.` line in the revert commit's
**body** (not its subject; reading it costs one extra `git log --format='%H%n%b'` pass over the
range). The reverting commit is exempt too. This is deterministic and converges in one pass.

**Pattern to reuse:** any pre-push (or pre-merge) safety probe that inspects "the last commit" or
"HEAD" alone is vulnerable to this crash-then-resume shape whenever the flow can leave more than one
unpushed commit on the branch between runs. Scope the probe to the full range against the **freshly
fetched** remote-tracking ref (with a deterministic non-`@{upstream}` fallback for a
freshly-provisioned worktree), never to the tip in isolation, and never to an **unrefreshed**
boundary. Any automated remediation that reverts an offending commit and then re-scans the same range
must treat a revert/reverted pair as neutralized, keyed off the VCS's own "this undoes that" link
rather than hand-derived diff equivalence.

**Doc-cascade note:** this lesson and [[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]
described the same mechanism, but the fetch-precondition rewrite was routed only to the latter. See
[[doc-cascade-fix-routed-to-one-published-lesson-can-leave-a-sibling-lesson-stale]].

> archived 2026-08-30: resolved — moved to archive
