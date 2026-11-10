---
name: lead-must-prove-a-run-dead-before-destroying-its-state
description: "Before a Lead deletes a run's branches or worktrees, or re-dispatches its seats, it must prove the run dead with a hard liveness signal; if unsure, halt-and-hold"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: lead-must-prove-a-run-dead-before-destroying-its-state
  phase: "prompt-surface-simplification/phase-1 (Governance) + 2026-08-06-war-strategy-mirror-guards/phase-3 (Release, task 3.1)"
  keywords: 
    - dual-Lead race
    - concurrent Lead sessions
    - liveness probe
    - liveness proof
    - worktree mtimes
    - halt-and-hold
    - chimera state
    - deleted branches
    - deleted worktrees
    - stop point
    - resume git ground truth
    - dead workflow diagnosis
    - session compaction
    - journal.jsonl
    - transcriptDir
    - live task notification
    - re-dispatch race
    - push-first CAS
    - remote reconnaissance false negative
  tags: 
    - war-execution
    - governance
    - race-condition
    - recovery
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-08-18T08:59:41.420Z
---

# A Lead must prove a run is dead before destroying its state or re-dispatching its seats

**The rule.** Before a Lead treats a run as dead, it must establish that with evidence, not
assumption. This holds whether the Lead is about to destroy branches and worktrees (locally or on
`origin`) or only re-dispatch seats on a workflow it believes was interrupted. An audit-status read
or remote branch state alone is not proof. Resume doctrine ranks "git branch state > issue labels >
`ledger.json`"; a Lead about to *mutate* git state makes an irreversible move against the source of
truth every agent trusts, so its liveness bar must be at least as strict as the resume bar.

**How to apply.** Before deleting a branch, worktree or integration branch believed abandoned, check:

- (a) worktree file mtimes for recent activity;
- (b) whether `origin` has moved past the local view (a fetch, not an assumption);
- (c) whether an audit/refine step could plausibly be in flight given the plan's expected phase
  duration.

Prefer a **hard liveness signal** where one exists: a live background task's own status or
completion notification, or an advancing `journal.jsonl` mtime under the run's `transcriptDir`.
Remote reconnaissance (branch present or absent on origin) proves neither life nor death: a live run
mid-phase legitimately has no pushed integration branch yet, and a dead run can already have pushed
further than expected. If any signal is ambiguous, halt-and-hold and surface to the operator rather
than destroy-and-restart.

**Why it matters.** A false "dead" diagnosis followed by deletion creates a chimera: two divergent
histories the next Lead must reconcile by hand, since resume repair only works toward git ground
truth and there is no automated protocol for un-merging two Leads' work. A false diagnosis followed
by re-dispatch is bounded only by how many re-dispatched operations are read-only or CAS-guarded.
Land-advance's push-first compare-and-swap (never force-push) no-ops on a losing race, but that is a
backstop for a skipped proof step, not a license to skip it.

**Incidents.**

- *Destructive (agent-unverified, Lead-narrated):* in `2026-07-28-prompt-surface-simplification`
  phase 1, a second Lead session diagnosed a mid-audit run as dead ("all unaudited") and deleted its
  branches and worktrees locally and on `origin`, while the original run kept going. The operator
  resolved it by hand: adopt the already-audited merges and re-audit the surviving rewrite of the
  one contested task.
- *Re-dispatch race (Lead-adjudicated):* in `2026-08-06-war-strategy-mirror-guards` phase 3, a Lead
  read remote branch state and a journal entry as death at session compaction and re-dispatched
  audits, a gate-audit and a land. The workflow's own completion notification later proved it had
  run live through the compaction and landed itself; the re-dispatch only raced it harmlessly.

A servitor that cannot verify which of two contested narratives is true records only what it can
verify, and hedges the dispute at `agent-unverified`.

**Locate-cue (code-verified):** the halt-and-hold mechanism is real — `skills/war-campaign/SKILL.md`
"Failure — spec §7.3": "**Halt-and-hold** when a plan can't `CLEAR` `/red-team`... or `/war`
hard-halts... checkpoint → record the stop point → `PushNotification` → stop."

Related: [[audit-worktree-pre-impl-tip-stale-verdict]] (the adjacent single-Lead case — a stale
worktree view producing a false verdict, without the destructive branch-deletion step);
[[held-escalation-lead-manual-completion]] (the Lead-manual-completion path the first incident's
resolution echoes); [[never-follow-resumefromrunid-hint-after-a-land-failure]] (a related
died-workflow recovery-path lesson).

> archived 2026-08-30: resolved — moved to archive
