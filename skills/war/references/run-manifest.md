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

## Relaunch — a died attempt is archived, never overwritten silently (D22, #1916)

A **relaunch attempt** is one Workflow run of a phase that a prior run of the same phase did not finish: a `resumeFromRunId` retry of a `held:phase-incomplete` phase, or a Recovery relaunch of a `held:workflow-error` / escalated phase ([resume-and-recovery.md](resume-and-recovery.md) § Recovery relaunch). Each attempt has its **own** `workflowRunId` and `transcriptDir` — the harness mints a fresh run id per launch, and the transcript dir's basename **is** that run id. The manifest keeps the phase record **current** and the history **complete**:

- **On every relaunch, overwrite `workflowRunId` + `transcriptDir` together** — never one without the other. Read both from the new launch envelope (the `At phase launch` bullet above); a phase whose `transcriptDir` basename differs from its `workflowRunId` is a half-stamped relaunch, and `/war-review` mines the wrong transcripts for it.
- **Archive the died attempt under `attempts[]`** before overwriting — the authoritative shape (this file is the only home; `schemas.md` § Run manifest points here and does not restate it):
  ```jsonc
  attempts: [                                   // one entry per attempt that did NOT finish the phase; absent or [] on a first-try phase
    { workflowRunId: "wf_… | null",             // the died attempt's run id (as stamped at its launch)
      transcriptDir: "… | null",                // the died attempt's transcript dir — /war-review may still mine it
      startedAt: "<ISO 8601>", endedAt: "<ISO 8601> | null",   // that attempt's boundaries (endedAt = the clock read when the death was observed)
      dispatches: { worker, auditor, fixRounds, refiner, servitor },   // that attempt's own counts by role
      cause: "held:phase-incomplete | held:workflow-error | escalated | …" } ]   // why it did not finish — the landDecision or task status that ended it
  ```
- **Dispatch counts are summed across attempts.** The phase's top-level `dispatches` is the sum of every attempt's counts (archived entries + the current attempt) — the phase paid for every seat it ran, and `/war-review`'s cost view must see them all. `envelope` aggregates stay **binding-to-attempt** (the current attempt's envelope only; a died attempt's envelope, when sourced, rides its `attempts[]` entry).

**Checkpoint on-return reminder.** On every relaunch's return — the Checkpoint's on-phase-return stamp — re-check that the phase record's `workflowRunId` + `transcriptDir` are the **relaunch's** pair and that the prior pair sits in `attempts[]`; a record still carrying the died attempt's pair is the "half-stamped relaunch" friction row `/war-review` reports (its § 4 signal class: `transcriptDir` basename ≠ `workflowRunId`). Fail-open as every other stamp: a failed write logs one line and the run proceeds.
