---
name: engine-change-landed-this-run-cannot-exercise-itself-same-run
description: "A /war run executes workflow-template.js from the installed plugin, so an engine change landed in the run cannot exercise itself until a release and /reload-plugins; seats fall back to rung-1 evidence"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: engine-change-landed-this-run-cannot-exercise-itself-same-run
  phase: "precision-chain-and-loop-breaker/5.5 (gate-audit note, confirmed against CLAUDE.md's plugin-iteration doctrine)"
  keywords: 
    - self-hosting
    - workflow-template.js
    - installed plugin root
    - plugin-dir
    - reload-plugins
    - endstate-check dispatch
    - mid-run engine change
    - land-barrier
    - dispatched prompt lags landed engine
    - version unknown
    - gate-audit self-reference
    - fast-forward despite no-ff
    - merge topology change
    - plugin cache
    - stage-workflow.mjs
    - dogfooding WAR on WAR
  tags: 
    - war-engine
    - self-hosting
    - gate-audit
    - process
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-10-30T07:47:53.033Z
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

## Tip: a run that dies at entry on an already-fixed defect

If a self-hosting run dies at entry on a defect that is already fixed somewhere, check which
template copy loaded and whether that copy has the fix. The branch and the plugin cache can each
lag the other. In one run (2026-09-11-backward-chain-doctrine, phase 1), the Lead
reported the attempt died because the branch's `workflow-template.js` still called `Date.now()`,
which the Workflow harness forbids, a defect already fixed upstream (PR #2301). Staging from the
plugin-cache template with the branch's hotfix reapplied on top fixed it. This cause is a hypothesis
(agent-unverified): verify which template actually loaded before spending a round on the branch
code.

## Recurrences

- **PIN-22 (2026-10-28-blocked-ace-and-merge-provenance, phase 2):** task 2.1 landed `--no-ff`
  task merges with a `WAR-Task` trailer, but the same phase still merged its tasks by
  fast-forward, because the run and any recovery relaunch use the installed plugin version
  (accepted by PIN-22).
- **Ace-Charge (same plan, phase 3):** an ace worker put `Ace-Charge` outside the final trailer
  block, because the installed prompt was still the old one (see
  [[a-trailer-in-its-own-paragraph-is-unparsed-when-an-attribution-paragraph-follows]]).

> archived 2026-08-15: resolved — moved to archive
