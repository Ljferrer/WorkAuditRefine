# Run manifest — per-stamp field reference (evicted from `skills/war/SKILL.md`)

The unbudgeted cold home (ADR 0042: `references/` files carry no byte budget) for the Run-manifest
section's **per-stamp field detail**. The block below was byte-identical to its pre-eviction
`skills/war/SKILL.md` text **at eviction time** (only repo-root-relative links were re-anchored for
this file's depth). The section's **hot** half stays on the card: the `## Run manifest (telemetry)`
anchor, the main-checkout `MAIN=$(dirname …)` idiom two other surfaces cite by name, and the
fail-open / never-resume-input invariant. Positional words below ("above", "the Run-manifest
section") refer to that card section.

## When — at phase boundaries (the per-stamp field set)

**When — at phase boundaries.** Initialize at run start with the top-level fields (`runId`, `planPath`, `configProfile`, run `startedAt`). Every `startedAt`/`endedAt` is a real **clock read** captured at the stamped boundary (e.g. `date -u +%Y-%m-%dT%H:%M:%SZ`) — never a placeholder or copied literal. Then, per phase:
- **At phase launch** — stamp the phase's `startedAt` (a fresh clock read), and capture `workflowRunId` + `transcriptDir` **from the `Workflow` tool's own launch envelope** (harness-surfaced): launching a per-phase Workflow yields a `Run ID: <runId>` line **and** a `Transcript dir: …/subagents/workflows/<runId>` line, and the task-completion notification's `<diagnostics>` repeats the same `…/subagents/workflows/<runId>/journal.jsonl` path. The workflow **return object** (`{ landed, escalated, auditLog, landDecision, servitorResult, handoff?, … }`) carries **neither** — do **not** read them off the return. This is the same `transcriptDir` `/war-review`'s later mining reads. If a future harness ever omits these lines, both degrade to `null` and `/war-review` renders `n/a` — never a fabricated value. Also stamp `sweepExcludeCount` and `finalPhase` (PIN-8) — the length of the threaded `args.sweepExclude` list and the threaded `args.finalPhase` boolean, each `null` when absent; the Lead procedure is [sweep-exclusion.md](sweep-exclusion.md).
- **On phase return** — stamp the phase's `endedAt` (a fresh clock read) plus the per-phase record: **dispatch counts by role** (`worker` / `auditor` / `fixRounds` / `refiner` / `servitor`, derived from the decompose + the returned `auditLog` / fix rounds / `servitorResult`), **task terminal statuses**, `landDecision`, `lessonsWritten`, `issuesFiled`, and the **envelope aggregates** (`totalTokens` / `totalToolCalls` / `agentCount`) sourced from the Workflow task-completion notification's envelope — the same harness-surfaced channel the **At phase launch** bullet above reads `workflowRunId`/`transcriptDir` from; unsurfaced ⇒ `null`, `/war-review` renders `n/a`.
- **At run end** — stamp the run's `endedAt` (a fresh clock read).

Field names follow spec §4.A (nesting may be refined; the **MUST-carry** set is binding): **per phase** — `transcriptDir`, `workflowRunId`, ISO-8601 timestamps, dispatch counts by role, task terminal statuses, `sweepExcludeCount`, `finalPhase`, and the **envelope aggregates** (`totalTokens` / `totalToolCalls` / `agentCount`, binding-to-attempt, null-tolerated — the `workflowRunId` posture); **top level** — `runId`, `planPath`, `configProfile`, run `startedAt`/`endedAt`.

**Fail-open.** Every manifest write is **best-effort** — a failed write logs **one** line and the run proceeds unaffected. Bookkeeping **never** blocks a run, and the manifest is **never** resume input (the resume ordering git > issue labels > `ledger.json`, [ADR 0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md), is untouched).
