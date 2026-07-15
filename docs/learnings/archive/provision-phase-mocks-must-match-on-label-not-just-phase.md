---
name: provision-phase-mocks-must-match-on-label-not-just-phase
description: "Provision dispatches share phase; mocks must key on opts.label too"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [provision-run, opts.label, phase Provision, test mock shadowing, ENV_OUTCOME, MergeResult, topology barrier, ok:true, ok true regex]
  slug: provision-phase-mocks-must-match-on-label-not-just-phase
  phase: war-run-lifecycle-robustness/t1
  tags:
    - workflow-template
    - test-fixtures
    - provision
  created: 2026-07-08
---

# Two distinct Provision-phase dispatches share `phase: 'Provision'` — key mocks/handlers on `opts.label`

## What happened

`skills/war/assets/workflow-template.js` dispatches **two different agent calls** that both
carry `phase: 'Provision'` and seat `war-refiner`, but expect different return shapes:

- `label: `provision:phase-${ph.id}`` — the phase-wide **topology barrier**
  (creates task worktrees + the `_refinery` worktree); expects a `MergeResult`-shaped return
  (`{ mode: 'merge-task', status: 'merged' }`).
- `label: `provision-run:${task.id}`` — the per-task **environment-provisioning step**
  (`provisionStep()`); expects the `ENV_OUTCOME` shape (`{ ok: true }` or the env-blocked
  outcome).

Verified @ `skills/war/assets/workflow-template.js` — the two `war-refiner` + `phase:'Provision'`
dispatch sites, distinguished by their `label` prefixes `provision-run:${task.id}` (the
`provisionStep` env dispatch) and `provision:phase-${ph.id}` (the git-topology barrier).

Because both share `seat === 'war-refiner' && opts.phase === 'Provision'`, a test mock/handler
that checks phase alone without also checking `opts.label` (e.g. `/^provision-run:/.test(opts.label
|| '')`) will match BOTH call sites and return the wrong shape for one of them. The test file's
correct idiom, used throughout `workflow-template.test.mjs`, is a two-line ladder:

```js
if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
if (seat === 'war-refiner' && opts.phase === 'Provision') return { mode: 'merge-task', status: 'merged' }
```

## Why it matters

A phase-1 audit repeatedly flagged (Nit, disposition `note`) that the second line in a few test
helpers "looks unreachable" once the first line's guard was widened — but it is only unreachable
*within that specific test's call flow* if the topology-barrier call never actually fires there;
in the general pattern both lines ARE reachable because they key off different labels. When
writing or reviewing a new Provision-phase mock, don't assume `phase === 'Provision'` alone
identifies the call — check which label(s) the specific test scenario actually dispatches before
calling a branch dead.

## Rule

Any new Provision-phase agent-call site must get its own distinct `label` prefix, and any mock/handler
gating on `opts.phase === 'Provision'` must also branch on `opts.label` to pick the right response
shape (`ENV_OUTCOME` for `provision-run:*`, `MergeResult` for `provision:phase-*`).

> archived 2026-07-15: resolved — moved to archive
