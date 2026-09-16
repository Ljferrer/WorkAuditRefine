# Backward-chain doctrine — the plan author

Two readers, one home, no mirror. The `/war-machine` drafter reads this file at spawn (`skills/war-machine/SKILL.md` §2 step 1) and the `/war-strategy` interview reads it at stage 1b ([plan-interview.md](plan-interview.md)). Nothing here rides a dispatched prompt and no test pins a byte-equal copy: the method lands in the plan the author writes, and `/red-team` and `/war` read the plan.

The plan author works the same chain the worker, the auditor and the fixer work later, one level up: every End state is a finish line, the chain from it orders the work, and the file boundary carves the tasks. A plan whose tasks are not on any chain from an End state dispatches work no check measures.

## The method

1. Lock every End state with its D5 tag (`check:`, `gate:`, `backstop:`, `HARD`) and run the reachability probe below on each. A `backstop:` End state is reachable through its row in `## Deferred validations (backstops)`; the finish line is the check WAR runs, never the prose beside it.
2. Chain backward from each End state to the base: each link is a condition that must hold for the next link to hold, down to a file the plan can name. The chain ORDERS and the file boundary CARVES ([war-strategy SKILL.md §3](../SKILL.md)): one task per cohesive file set, never one task per link.
3. The bottleneck is the earliest unmet link across all chains. It is Phase 1 wave 1. Every other task is placed by its distance from the bottleneck, and a task two chains share lands once, at the earlier position.
4. Chunk by distance: each link gets a done test (the command and the token it prints), and links that share a file set fold into one `Plan slice:`. The chunk boundary is the file boundary, so a `Plan slice:` states what its files must make true, not a list of steps.
5. Every task serves a named End state. A task that serves none is either off every chain (step 6) or evidence that an End state is missing (step 1 again).
6. Two homes for what the chains leave out: `## Non-goals / deferred` holds what is off every chain; `## Deferred validations (backstops)` holds what is on a chain and deferred, each row with a runner and a reason.
7. Two independent chains state the ordering rule: when tasks on different chains share no file and no link, say so, and let waves run them together. A shared file joins the chains at that file; a shared link joins them at that link.
8. Thin evidence takes `[assumed: <default> — if wrong: <consequence>]`. A link whose truth you inferred from memory, a lesson or a peer's claim is tagged, never stated as verified; the Assumptions ledger carries its check.

## Where it lands

- Step 4 sets the `Plan slice:` granularity and the phase count. A slice is one chunk: the file set and what it must make true. Phases exist only for what must be landed first (a submodule's content before its gitlink bump, a release, a frozen base the next chain needs); everything else is waves inside one phase.
- The chain lines land as a `Critical path` block in Part 1: one line per End state, `End state N ← T<a> ← T<b> (bottleneck: T<b>, because ...)`, plus the guardrail and backstop End states with no owning task named as such. Placement is latitude anywhere in Part 1 (`## Pivotal constraints` is the precedent). Never under `## Build order` and never as phases: the block orders, the build order carves.
- The bottleneck task (step 3) is Task 1.1. Its `deps` are empty by construction.
- Each End state's `check:` is the done test of its chain's first link. A `check:` that a chain cannot reach is the probe's failure case below.

## The reachability probe

The probe answers one question per End state: can this plan's tasks, with their `Files:` and their tools, make this End state's check print its token? Run it at stage 1b, before Q1, and again at the coverage sweep. The body lives here; [plan-interview.md](plan-interview.md) carries one pointing bullet in its stage-1 falsifier list. The `/red-team` spine is untouched by this plan; a follow-up issue tracks the probe joining it.

For each End state:

1. Name the check. `check:` or `Done when:` is the command; `gate:` is the declared gate plus the named member suite; `backstop:` is the row's runner; `HARD` is the seat's judgment over the task diff. An End state with none of these is unreachable by construction: it needs a tag or it needs to move to non-goals.
2. Name the owning task or row. Walk the chain from the check to the base and name the task at each link. A link no task owns is the gap: add a task, fold the link into an existing slice, or move the End state to a backstop row with a runner.
3. Test the check red at the base. Run the command at the base the phase will cut from. A check that prints its token before any task lands is vacuous (the delete-the-feature probe); rewrite it until it is red.
4. Test the check for reach. For each task on the chain, ask whether its `Files:` and the gate's tools can make its link true. A link that needs a file outside every task's `Files:`, a tool the gate does not run, or a budget constant the worker may not edit is unreachable: fix the plan, never the worker's instructions.
5. Record the result on the End state's line: the tag, the owning task or row, and `red at base` or the reason it could not be run. A `backstop:` End state records its row number and runner instead.

An End state that fails step 3 or step 4 is a plan defect at authoring time; the interview reopens the End state, never the slice. The same probe, run by a worker at corrective round 5 or later, is the `PLAN-DEFECT:` End state exit in [backward-chain-fix.md](../../war/references/backward-chain-fix.md).

## Worked examples

- This plan's own `Critical path` block in `docs/plans/2026-09-11-backward-chain-doctrine.md`: seventeen End states chained, the bottleneck named as the five reference files and their census rows, because every engine fixture chains from them.
- Eight file-disjoint tasks in one phase, no intra-phase deps, all merged with a unanimous audit: `## convergence`, `eight-file-disjoint-tasks` in [backward-chain-examples.md](../../war/references/backward-chain-examples.md). The chain ordered the phase and the file boundary carved it.
- A recommendation that cited an issue and contradicted the issue's own comments: `## premise`, `recommendation-cited-the-issue-and-contradicted-its-comments`. Step 8's tag would have carried the check.
- A plan slice that paired `requiresTest: true` with a test-free file list and routed a deterministic floor: step 4's done test would have named the mismatch at authoring time.
