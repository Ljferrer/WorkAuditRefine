---
name: floor-retry-add-test-package-it-worker-stays-base-tier
description: floorFix uses spawn('worker') not fix tier
metadata: 
  node_type: memory
  type: project
  keywords: 
    - spawnWorker
    - agents.worker.fix
    - worker tier
    - floor-retry
    - add-test
    - package-it
    - fix-worker
    - tier-aware dispatch
    - follow-up worker
    - spend control
  provenance: code-verified
  slug: floor-retry-add-test-package-it-worker-stays-base-tier
  phase: war-room-config-expansion/phase-1 (Task 1.2)
  tags: 
    - war
    - worker
    - config
    - spend-control
    - workflow-template
    - plan-fidelity
  created: 2026-07-11
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# floor-retry add-test/package-it fix-worker is not on the `agents.worker.fix` tier — a known, deliberate gap

**What happened:** Task 1.2 converted worker dispatch to tier-aware `spawnWorker(tier)` at exactly
the two sites the plan's checkable End state names: the audit fix-round (`fix:<id>:r<n>`) and
`--ace` (`ace:<id>:r<n>`) spawns, both now `spawnWorker('fix')`. The gate-audit correctly held this
as FAITHFUL — literal End state controls over the broader Purpose prose ("model spend becomes
controllable... fix/ace follow-up") — and recorded the gap as a non-blocking Nit/note, twice
(worker-audit + gate-audit), not a defect.

**Root cause / current state (code-verified, `skills/war/assets/workflow-template.js` @
phase war-room-config-expansion/phase-1 — verify still present before acting):** the refiner's
floor-retry fix-worker — dispatched when `assert-test-in-diff.sh` finds no test (`ADD_TEST`) or
`assert-packaging-in-diff.sh` flags a missed Dockerfile COPY (`PACKAGE_IT`) — still dispatches via
plain `...spawn('worker')` (label `` `${isNoTest ? 'add-test' : 'package-it'}:${r.task.id}:r${r.task.fixRounds + 1}` ``).
This is a **third** "fix follow-up" worker dispatch, semantically in the same class the Purpose
groups with fix-round/--ace spend, but it was **not** in the literal End-state enumeration and so
was correctly left untouched this task.

**Durable takeaway for whoever next touches `agents.worker.fix`:** if a future increment widens the
tier-aware dispatch to "every follow-up worker" (matching the broader Purpose reading rather than
the narrower literal End state), this floor-retry site is the one still-missing call site — convert
`...spawn('worker')` → `...spawnWorker('fix')` at this label. Until then, this dispatch stays on
`agents.worker` base-tier defaults regardless of an operator-configured `agents.worker.fix`, and
that is **current, intended, audited behavior**, not a bug to "fix" without a plan/intent amendment.

**Locate cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, the
`floorFix = await agent(fixPrompt + workerMemClause(...) + provisionClause, { agentType: NS +
'war-worker', phase: 'Audit', label: ..., schema: WORKER_RESULT, ...spawn('worker') })` call — sits
directly after the `fixPrompt` ternary building the `ADD_TEST`/`PACKAGE_IT` prompt text.

Relates to the plan-fidelity family: literal checkable End state is the floor, Purpose is the
ceiling — an audited "gap vs Purpose" that is faithful to End state is correctly a Nit/note, not a
finding, and the gap itself is worth recording so it isn't silently forgotten before the next
increment on this surface.

## RESOLVED — phase "Engine fidelity + evidence contract" (#817, 2026-07-12)

**Code-verified via the phase's own task worktree** (this servitor's own cwd was a stale,
unrelated checkout — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] —
confirmed instead at `<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`,
the true landed task worktree, reached via `.git/worktrees/<task-id>/gitdir`):

- The floor-retry fix-worker dispatch (`add-test:`/`package-it:` label) now reads
  `...spawnWorker('fix')`, with an adjacent comment: `// #817: spawnWorker('fix') makes the
  add-test/package-it floor retry tier-aware, uniform with` (fix-round + `--ace`). The "still
  missing call site" this lesson flagged is closed.
- The phase-close `polish:` dispatch stays on plain `...spawn('worker')` — but now carries the
  ratifying comment this lesson's Commander's Intent required: `// tier-aware via spawnWorker('fix');
  this one intentionally is not. The only other non-tiered base...` — so the ONE remaining
  non-tiered follow-up-worker site is now a documented deliberate choice, not a silent gap.

Widening tier-aware dispatch to "every follow-up worker" (the broader Purpose reading) is now
fully closed except `polish:`, which is intentionally out of scope per the updated comment.

> archived 2026-07-15: resolved — moved to archive
