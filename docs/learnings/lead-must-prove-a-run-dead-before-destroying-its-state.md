---
name: lead-must-prove-a-run-dead-before-destroying-its-state
description: "A second Lead session that diagnoses a live phase as dead ('all unaudited') and deletes its branches/worktrees before proving liveness creates a chimera the next Lead must reconcile toward git — prove liveness (worktree mtimes, origin state) before destroying run state"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: lead-must-prove-a-run-dead-before-destroying-its-state
  phase: "prompt-surface-simplification/phase-1 (Governance), landed dev/2026-07-28-prompt-surface-simplification @ fca6160f88a40ff141a91d10edcb9305e54e1cc5, 2026-07-28"
  keywords: 
    - dual-Lead race
    - concurrent Lead sessions
    - liveness probe
    - worktree mtimes
    - halt-and-hold
    - chimera state
    - deleted branches
    - deleted worktrees
    - stop point
    - resume git ground truth
  tags: 
    - war-execution
    - governance
    - race-condition
    - recovery
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-07-28T23:44:45.990Z
---

# A Lead must prove a run is dead before destroying its state — a false "dead" diagnosis creates a chimera

**The incident (agent-unverified — Lead-narrated at spawn time; no run-journal/ledger artifact was
found under the phase's worktree tree to independently confirm the play-by-play).** Phase 1 of
`2026-07-28-prompt-surface-simplification` was mid-audit (task 1.1) when a second Lead session
opened against the same plan, diagnosed the live run as dead ("all unaudited"), and deleted its
task branches, its integration branch, and its worktrees — both local and on `origin` — then
dispatched a fresh run. The original run was not dead: its refiner rebased onto the moved branch
tip and rebuilt integration; its 1.1 audit escalated Critical on the deleted pin ("unreachable...
branch carries zero work") — a race artifact, not a real defect in the work. The fresh run's only
surviving output was an unaudited rewrite of 1.1 (`6fa7eee`). The (first) Lead halted
(halt-and-hold), and the operator ratified a resolution path by hand: adopt the already-audited
1.2+1.3 merges, resolve 1.1 alone via a fresh 3-seat audit of the surviving rewrite (with the prior
findings threaded as PRIORS to re-ground, never inherited) — one fix round (`107cec3`), unanimous
re-approve, merge (`4cfb63a`), integration (`fca6160`).

**The rule.** Before a Lead treats a run as dead and destroys its branches/worktrees (locally or on
`origin`), it must establish liveness with evidence, not assumption: worktree file mtimes going
quiet (no activity for a duration incompatible with an in-flight worker/auditor), not just an
audit-status read that could itself be racing a rebase-in-progress. Resume doctrine already ranks
"git branch state > issue labels > `ledger.json`" (`CLAUDE.md` — "Repair records toward git, never
git toward records; an unexplained commit halts") — the same asymmetry applies here in reverse: a
Lead about to *mutate* git state (delete branches/worktrees) is making an irreversible move against
the one source of truth every other agent trusts, so the liveness bar for that move must be at
least as strict as the resume bar for reading it.

**Why it matters.** A "dead" diagnosis on a run that is actually live does not just waste the fresh
run's dispatch — it creates a chimera: two divergent histories (the surviving rebuilt-integration
audit escalation, and the fresh run's unaudited rewrite) that the *next* Lead must reconcile by
hand, since resume repair only works one direction (toward git ground truth) and neither branch is
individually "right." The reconciliation here required an operator ruling, not a mechanized repair
path — there is no automated protocol for un-merging two Leads' work.

**How to apply:** before deleting a branch/worktree/integration-branch believed abandoned, check
(a) worktree file mtimes for recent activity, (b) whether `origin` has moved past the local view (a
fetch, not an assumption), and (c) whether an audit/refine step could plausibly be in-flight given
the plan's expected phase duration. If any signal is ambiguous, halt-and-hold and surface to the
operator rather than destroy-and-restart.

**Locate-cue (code-verified):** the halt-and-hold mechanism this incident's resolution used is real
— `skills/war-campaign/SKILL.md` "Failure — spec §7.3": "**Halt-and-hold** when a plan can't
`CLEAR` `/red-team`... or `/war` hard-halts... checkpoint → record the stop point →
`PushNotification` → stop." (verified present at the landed tip). Only the specific incident
narrative above is agent-unverified, not this mechanism.

Related: [[audit-worktree-pre-impl-tip-stale-verdict]] (the adjacent single-Lead case — a stale
worktree view producing a false verdict, without the destructive branch-deletion step);
[[held-escalation-lead-manual-completion]] (the Lead-manual-completion path this incident's
resolution echoes — hand-driving a phase to completion after a HARD escalation).
