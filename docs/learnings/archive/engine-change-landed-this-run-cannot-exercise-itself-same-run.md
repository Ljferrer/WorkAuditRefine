---
name: engine-change-landed-this-run-cannot-exercise-itself-same-run
description: "A /war run executes workflow-template.js from the INSTALLED plugin root, not from the branch the run is currently landing — so a phase that lands a change to the engine itself (e.g. a new endstate-check dispatch, a new prompt block) cannot exercise that change within the same run; artifacts the new code would have teed are simply absent, and downstream seats must attest from rung-1 evidence (gate log + pinned content reads) instead of the new artifact shape until a release + `/reload-plugins` picks up the change"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: engine-change-landed-this-run-cannot-exercise-itself-same-run
  phase: "precision-chain-and-loop-breaker/5.5 (gate-audit note, confirmed against CLAUDE.md's plugin-iteration doctrine)"
  keywords: 
    - self-hosting
    - workflow-template.js
    - installed plugin root
    - plugin-dir
    - reload-plugins
    - endstate-check dispatch
    - Task 3.2
    - mid-run engine change
    - land-barrier
    - dispatched prompt lags landed engine
    - version unknown
    - _refinery endstate log
    - gate-audit self-reference
  tags: 
    - war-engine
    - self-hosting
    - gate-audit
    - process
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-07T00:17:43.932Z
---

# A phase that lands a WAR engine change cannot exercise it within its own run

## The fact

`/war` loads `skills/war/assets/workflow-template.js` (the Workflow engine) from the **installed
plugin root**, not from the branch the currently-running phase is landing. Per CLAUDE.md's local
plugin iteration section: `claude --plugin-dir /path/to/WorkAuditRefine`, then `/reload-plugins`
after each edit — "local paths resolve to version `unknown`, so reloads always pick up changes."
This means a phase whose own task lands a change to `workflow-template.js` (or any dispatched-prompt
surface it builds) — e.g. a new per-condition `endstate-check` artifact dispatch — cannot exercise
that new dispatch behavior for the rest of that same run: the Lead process that launched the run is
already executing the OLD installed template, and stays on it until the plugin is reloaded (a
release + reload cycle, not something a phase triggers itself).

Confirmed instance (task 5.5's gate-audit, precision-chain-and-loop-breaker/phase-5): Task 3.2 (an
earlier phase) landed a land-barrier `endstate-check` dispatch that tees one artifact per claimed
End-state condition to `_refinery/.war/endstate-<phaseId>-<n>.log`. Those artifacts did not exist
for ANY phase of the run that landed them — `git status --ignored --porcelain
--untracked-files=all` on the `_refinery` worktree listed only `gate-*.log` files, none matching
the `endstate-*.log` shape — because the Lead process executing that very run was still running the
pre-Task-3.2 template. The dispatched auditor prompts correspondingly carried the OLD End-state
block (no `endStateAttestations` channel), confirming the mismatch was structural, not a dropped
write.

## The durable rule

When a phase's own plan mandates new WAR-engine dispatch behavior (a new artifact shape, a new
prompt clause, a new attestation channel), do not expect that behavior to be exercisable — by any
downstream seat in the SAME run, including that phase's own gate-audit or later phases' gate-audits
— until a release lands and the plugin is reloaded. Seats that need to judge a condition the new
engine code would have attested must fall back to rung-1 evidence (the captured gate log plus
pinned `git show` content reads) exactly as if the engine change had not landed yet, and should say
so explicitly rather than silently reporting `cannot-confirm` as though the new mechanism
malfunctioned.

## When auditing / servitor wrap-up

If a claimed End state cites a `check:` artifact that a phase's OWN plan just introduced the
teeing-mechanism for, verify whether that mechanism's dispatch code landed in an EARLIER phase of
the same run (in which case it should be live) or in the run's OWN active phase-set (in which case
it cannot be live until reload) before treating an absent artifact as a defect.

> archived 2026-08-15: resolved — moved to archive
