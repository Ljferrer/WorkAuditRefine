---
name: redteam-sandbox-probe-branch-residue-blocks-next-provision
description: "A red-team probe (ff-topology) that built a synthetic fast-forward git fixture inside the SHARED sandbox worktree — instead of a throwaway temp repo — left branches (not just commits) behind; `git reset --hard && git clean -fd` restored the working tree but only rewinds the currently checked-out branch, never deletes sibling branches the probe created. The residue was repo-global (the sandbox worktree shares the main .git) and collided with the next /war run's Provision barrier as a foreign integration ref (ADR 0003), forcing held:workflow-error, a manual branch delete, and a fresh relaunch."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: redteam-sandbox-probe-branch-residue-blocks-next-provision
  phase: "war-memory-cli-correctness/phase-1 (red-team round 0, wf_53228ce5-e83, 2026-07-27; prior workflow run wf_85641550-d11)"
  created: 2026-07-27
  tags: 
    - red-team
    - sandbox-worktree
    - provision-barrier
    - adr-0003
    - branch-hygiene
  keywords: 
    - ff-topology
    - sandbox escape
    - git reset --hard
    - git clean -fd
    - branch residue
    - foreign integration ref
    - EX_FOREIGN
    - Provision barrier
    - held:workflow-error
    - escape guard
    - repo-global branch
    - rogue rogue2
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-08-03T09:24:57.064Z
---

# A red-team sandbox escape's file restore does not undo the branches the probe created

**What happened (code-verified):** the `ff-topology` probe (attack surface for red-team run
`wf_53228ce5-e83`, phase 1 of `war-memory-cli-correctness`) needed a synthetic fast-forward git
topology to exercise, and built it **inside the shared red-team sandbox worktree** instead of a
disposable temp repo. The post-run escape guard caught it: 5 commits on top of the pinned base plus
working-tree edits, including a deliberate detection-test mutation. `git reset --hard <base> && git
clean -fd` restored the sandbox's files and the escape guard re-ran exit 0 — but this restore only
rewinds the **currently checked-out branch's ref**, and (`clean -fd`) removes untracked files; it
does **not** delete any *other* branch the probe created along the way. The rogue branch refs
(named for the detection-test mutation, e.g. a `rogue`/`rogue2` pair) stayed in `refs/heads/`
because a sandbox worktree shares the **main repo's `.git`** — any branch it creates is repo-global,
not sandbox-local.

**Consequence (code-verified via this run's `ledger.json`, `priorRun` field):** the very next `/war`
launch for this same plan died at the **Provision barrier** with `held:workflow-error` — one of the
residual branches collided with the integration branch Provision needed to create
(`integration/<planSlug>/phase-N`), and `cmd_ensure_integration` refuses to reuse a branch it does
not own (ADR 0003, `EX_FOREIGN`, exit 3). The recorded resolution: delete the foreign branch by
hand and relaunch fresh — **never** `resumeFromRunId` on that dead run (a fresh run needs a fresh
Provision, not a resume that re-hits the same foreign ref).

**Why the restore looked complete but wasn't:** the escape guard's own check is a *working-tree*
diff/dirty-file check (confirms the disposable repo's tracked+untracked file state matches the
pinned base) — it has no branch-enumeration step, so a clean `git status` after `reset --hard` reads
as "fully restored" even though new refs survive untouched.

**How to apply:** after diagnosing and containing any red-team sandbox escape (any probe that
touches git state — branches, tags, refs — not just files), run `git branch --list` (scoped to the
run's own naming conventions, e.g. anything not already known-legitimate) as a **second** restore
check, in addition to the working-tree escape guard. Delete any branch the incident window created
before the next `/war`/`/red-team` launch touches Provision. This is a sandbox-hygiene gap in the
probe itself, not a Provision bug — the fix belongs in "always build synthetic git fixtures in a
disposable temp repo, never the shared sandbox worktree," with the branch sweep as the backstop for
when that discipline slips.

Related: [[provision-nonidempotent-orphan-integration-branch-blocks-relaunch]] (same failure
signature — orphan/foreign integration branch blocks Provision — different root cause: a
non-idempotent provision step there, a red-team sandbox escape here); [[provision-barrier-refiner-owned-not-worker-self-create]].

## Mitigated — phase 2 of `2026-08-02-redteam-doctrine-and-guards` (2026-08-02)

The underlying isolation-idiom hazard this incident traced to is now named and fixed at the
mechanism level (End state 18 of that phase): `code-verified` at the landed tip
`06efa2b925caec1fafd1f019e32e32517e114250`, `skills/red-team/assets/workflow-scaffold.js`'s
SCOPE-LOCK preamble and `skills/red-team/SKILL.md` Step 3 both now prescribe `git clone
--no-hardlinks` whenever a probe runs `git` at all — the only idiom verified to stay isolated even
when the target is itself a linked worktree — and name the two unsafe forms explicitly (`cp -R`
against a linked worktree copies the `.git` pointer file, not a real repo; a bare, non-`--detach`
`git worktree add` writes a real branch into the target's shared ref store that survives `rm -rf`).
The escape guard's ref-diff (`--baseline` mode) would now also catch a residual branch left this
way, on top of the sandbox-idiom fix. This does not retroactively confirm this specific incident's
resolution (still unconfirmed per the note above) — it confirms the *class* of hazard this incident
belongs to (a "sandbox" that isn't actually isolated from the real repo's git state) is now a
documented, guarded pattern rather than a recurrence trap. Full detail:
[[cp-r-and-bare-worktree-add-do-not-isolate-a-sandbox-from-a-linked-worktree-target]].

> archived 2026-08-15: resolved — moved to archive
