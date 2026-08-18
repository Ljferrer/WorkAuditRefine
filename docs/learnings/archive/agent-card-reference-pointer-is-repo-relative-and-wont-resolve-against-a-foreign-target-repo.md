---
name: agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo
description: "RESOLVED (references-pointer-integrity, #1364, 2026-08-18): Prompt-surface-simplification's references/<file>.md eviction pattern replaces an agent card's inline instructions with a markdown link like [x](../skills/war/references/x.md); that link is relative to the CARD's own file location, but a dispatched seat's cwd is the TARGET repo's task worktree — the link only resolves when the plugin is installed inside the target repo (WAR-on-itself), and a dispatched auditor's Bash is fail-closed to read-only git so it cannot expand CLAUDE_PLUGIN_ROOT to find the real plugin install root"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-28-prompt-surface-simplification@phase-3
  provenance: code-verified
  slug: agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo
  phase: prompt-surface-simplification/3.1
  keywords: 
    - references/ directory
    - trigger pointer
    - CLAUDE_PLUGIN_ROOT
    - repo-relative link
    - foreign target repo
    - dispatched auditor
    - pin-validity
    - gitlink-bump
    - false block
    - anti-false-positive
  tags: 
    - war
    - prompt-surface
    - guard-architecture
    - cross-repo
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-07-29T16:17:53.793Z
---

# Agent-card reference pointer is repo-relative and won't resolve against a foreign target repo

**Found (code-verified — landed tip `53ef8a7b1eed93a55a7a30dbc9137228f31e5d7b`,
`agents/war-auditor.md` lines 20/33/35):** the prompt-surface-simplification eviction pattern
replaces an inline card instruction with `[auditor-teach.md](../skills/war/references/auditor-teach.md)`
— a path relative to `agents/war-auditor.md`'s own location in the **plugin repo**. A dispatched
auditor's cwd, though, is the **target repo's task worktree**, and its Bash is fail-closed to a
read-only git verb allowlist (`hooks/validate-auditor-git.sh`) — it has no shell to expand
`${CLAUDE_PLUGIN_ROOT}` or otherwise discover where the plugin is actually installed. The link
resolves fine when WAR runs on itself (this repo — `agents/` and `skills/` are siblings in the
same checkout the auditor is reviewing), but on any other target repo the task worktree has no
`skills/war/references/` at all and the Read 404s.

**Why this is Minor, not a hold:** for the one arm this phase evicted with a real cross-file
dependency — the gitlink-bump `pin-validity` lens — the card retains the **decisive rule inline**
(`agents/war-auditor.md` line 35: ledger-mismatch ⇒ Critical/`request_changes`, otherwise
`approve`), so an auditor that can't resolve the pointer still refuses correctly on the blocking
axis. What it loses if the Read fails are the **anti-false-block** details that live only in
`skills/war/references/auditor-teach.md` step 4 — "do NOT re-verify remote reachability, do NOT
`git fetch`, a locally-absent object is NEVER a finding" and "the SHA need not be on the default
branch (DP4)". Losing those biases toward wrongly blocking a *legitimate* pin, not toward a
missed defect — asymmetric but not fail-open. The pattern was pre-adjudicated (adjudication H:
"existing plugin-rooted dir; dispatched agents Read it on demand") and the card's own prior
`## Return` line already used an equally unresolvable form (`references/schemas.md`), so this
diff doesn't regress the house idiom, it just makes a **behaviorally-gating** instruction depend
on it for the first time.

**Applies beyond this one file:** the same eviction mechanism is slated for the worker and
refiner cards and `skills/war/SKILL.md` (Phases 4-5 of this plan) — any future `references/`
pointer that gates a Critical/blocking-severity decision (not just a "nice to have" doctrine
detail) should keep the decisive rule inline and treat the pointer as best-effort enrichment,
never as the sole carrier of an anti-false-positive guard.

**If hardening is ever wanted:** the `${CLAUDE_PLUGIN_ROOT}/skills/war/references/<file>.md`
form already used in hook error output would resolve regardless of target-repo topology, but
applying it here would touch pointer text on other, untouched cards — out of this task's slice
at time of writing.

**Confirmed recurrence, phase 4.1 (code-verified — landed tip
`cce668634ff6d566d1370e9502c08d317fea4e3c`, via the `_refinery` worktree at
`.claude/war-worktrees/2026-07-28-prompt-surface-simplification-2026-07-28/_refinery/`,
`agents/war-refiner.md` line 21):** exactly the predicted instance — Task 4.1 evicted the
submodule-as-repo provisioning recipe into `refiner-recovery.md`, and the card's retained
sentence initially dropped the recipe's one anti-false-positive refusal ("the resolved base is
... never silently the remote default"). Fixed in the same task's polish round: the pointer
paragraph now states the refusal inline (verified present) AND adds an explicit survival
sentence ("Your dispatched merge/land prompt threads the submodule targetRepo/targetBase and the
2A/2B routing"), mirroring the precedent the land-step-3 pointer already used. **Added technique
for future eviction pointers:** when a pointer gates content that also survives some other way
(a dispatched-prompt mirror, a Lead-owned resolution upstream), say so in the pointer's own
prose — don't leave the survival implicit, even when it's true.

> archived 2026-08-15: resolved — moved to archive
