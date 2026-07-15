---
name: git-common-dir-anchor-idiom-fail-open-gotchas
description: "The ratified `git rev-parse --path-format=absolute --git-common-dir` main-checkout anchor idiom: two fail-open correctness gotchas"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - git-common-dir
    - git rev-parse --path-format=absolute
    - main checkout anchor
    - bare repo
    - fail-open
    - dirname composed one-liner
    - two-step capture form
    - worktree anchor idiom
    - campaign-state-anchor
  provenance: code-verified
  slug: git-common-dir-anchor-idiom-fail-open-gotchas
  phase: campaign-state-anchor/phase-1 (tasks 1.1-1.3)
  tags: 
    - war
    - git
    - fail-open
    - shell
    - worktree
    - idiom
  created: 2026-07-15
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# The `git rev-parse --path-format=absolute --git-common-dir` main-checkout anchor idiom — two fail-open gotchas

This idiom (already used by survey-corps/war-machine, and landed in phase 1 of
campaign-state-anchor for `hooks/inject-campaign-state.sh`,
`skills/war-campaign/assets/campaign-ledger.mjs`'s `resolveCampaignDir`, and
`docs/adr/0016-campaign-compaction-survival.md`'s amendment) resolves a linked
worktree's cwd to the **main checkout** (dirname of the shared `.git-common-dir`).
It is deliberately fail-open: any probe failure must leave the caller's
cwd-relative behavior untouched, never wedge or mis-anchor. Two gotchas found
auditing the three landed sites — verify still present before acting (found at
`hooks/inject-campaign-state.sh`, `skills/war-campaign/assets/campaign-ledger.mjs`
`resolveCampaignDir()`, and `docs/adr/0016-campaign-compaction-survival.md`'s
2026-07-15 amendment @ phase 1; verified via the phase's own landed `_refinery`
task-worktree checkout, not this servitor's own — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]):

## 1. The probe SUCCEEDS in a bare repo — "bare" does not belong in the fail-open enumeration

All three landed sites' comments enumerate "git absent / not a repo / bare" as the
cases where the probe fails and the caller's original root/cwd-relative value is
left untouched. That is wrong for "bare": `git rev-parse --path-format=absolute
--git-common-dir` **succeeds** inside a bare repo and returns the bare repo's own
git dir, so the anchor reassigns to `dirname(bare-dir)` — the `&&`/try-succeeds,
it does not fall through. The three landed instances are all harmless in practice
(the downstream consumer — `.claude/campaigns` dir check, ledger CLI resolution —
finds nothing at `dirname(bare-dir)` and still falls through to silent/cwd-relative
behavior), and a real caller is effectively unreachable in a true bare repo (no
`SessionStart` hook cwd, no Lead skill cwd), so this was graded Nit/note, not a
defect, at land. But the **comment's claim is factually wrong**, and a future
caller of this idiom in a context where a bare-dir match DOES carry the expected
marker would get a real bug, not a cosmetic one. When copying this idiom: either
drop "bare" from the fail-open enumeration, or reword to "bare/exotic layouts
resolve to a dir that (today) carries none of the expected markers, so they still
end up behaving fail-open one level down."

## 2. Two-step capture-then-check form is mandatory when fail-open matters; a composed one-liner silently breaks it

The **shell** hook uses (and its own comment mandates) the two-step form:

```sh
common="$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" && [ -n "$common" ] && root="$(dirname "$common")"
```

capturing git's output first so the assignment propagates git's exit status, then
gating on non-empty, only then taking `dirname`. A **composed one-liner** —
`root=$(dirname "$(git rev-parse ... )")` — is wrong in a fail-open shell context:
`dirname` of a failed/empty command substitution returns `"."` (never empty), so a
non-git cwd silently gets `root=.` instead of being left untouched. The
`skills/war-campaign/SKILL.md` "State & resume" prose illustrates the idiom with
exactly this composed one-liner (`MAIN=$(dirname "$(git rev-parse
--path-format=absolute --git-common-dir)")`) — correct there only because that
prose describes a Lead context that always runs inside a git repo (git never
fails), and the red-team adjudication scoped the two-step mandate to the shell
hook specifically. **The two forms are not interchangeable** — copy the two-step
form for any new caller that must preserve today's-behavior on a non-git/failed
probe, and don't be surprised to see the composed one-liner in illustrative prose
for an always-in-repo caller.

## Related

[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — how this fact
was verified despite the servitor's own checkout lagging the landed phase.
