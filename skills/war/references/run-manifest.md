# Run manifest — per-stamp field reference (evicted from `skills/war/SKILL.md`)

The unbudgeted cold home (ADR 0042: `references/` files carry no byte budget) for the Run-manifest
section's **per-stamp field detail** and **file identity**. The `## When — at phase boundaries` and
`## Where — runId and untracked-ness` blocks below were each byte-identical to their pre-eviction
`skills/war/SKILL.md` text **at eviction time** (only repo-root-relative links were re-anchored for
this file's depth, and the init sentence later gained the launch-identity fields); `## Top-level fields`
and `## Relaunch` are new doctrine authored here (ADR 0042's default placement), never an eviction,
and have no card twin. The section's **hot** half stays on the card: the `## Run manifest (telemetry)`
anchor, the main-checkout `MAIN=$(dirname …)` idiom two other surfaces cite by name, and the
fail-open / never-resume-input invariant. Positional words below ("above", "the Run-manifest
section") refer to that card section.

## When — at phase boundaries (the per-stamp field set)

**When — at phase boundaries.** Initialize at run start with the top-level fields (`runId`, `planPath`, `configProfile`, run `startedAt`, and the launch identity `pluginRoot`, `pluginVersion`, `pluginSha`; the field table is [§ Top-level fields](#top-level-fields--the-field-table-stamped-at-run-start)). Every `startedAt`/`endedAt` is a real **clock read** captured at the stamped boundary (e.g. `date -u +%Y-%m-%dT%H:%M:%SZ`) — never a placeholder or copied literal. Then, per phase:
- **At phase launch** — stamp the phase's `startedAt` (a fresh clock read), and capture `workflowRunId` + `transcriptDir` **from the `Workflow` tool's own launch envelope** (harness-surfaced): launching a per-phase Workflow yields a `Run ID: <runId>` line **and** a `Transcript dir: …/subagents/workflows/<runId>` line, and the task-completion notification's `<diagnostics>` repeats the same `…/subagents/workflows/<runId>/journal.jsonl` path. The workflow **return object** (`{ landed, escalated, auditLog, landDecision, servitorResult, handoff?, … }`) carries **neither** — do **not** read them off the return. This is the same `transcriptDir` `/war-review`'s later mining reads. If a future harness ever omits these lines, both degrade to `null` and `/war-review` renders `n/a` — never a fabricated value. Also stamp `sweepExcludeCount` and `finalPhase` (PIN-8) — the length of the threaded `args.sweepExclude` list and the threaded `args.finalPhase` boolean, each `null` when absent; the Lead procedure is [sweep-exclusion.md](sweep-exclusion.md).
- **On phase return** — stamp the phase's `endedAt` (a fresh clock read) plus the per-phase record: **dispatch counts by role** (`worker` / `auditor` / `fixRounds` / `refiner` / `servitor`, derived from the decompose + the returned `auditLog` / fix rounds / `servitorResult`), **task terminal statuses**, `landDecision`, `lessonsWritten`, `issuesFiled`, and the **envelope aggregates** (`totalTokens` / `totalToolCalls` / `agentCount`) sourced from the Workflow task-completion notification's envelope — the same harness-surfaced channel the **At phase launch** bullet above reads `workflowRunId`/`transcriptDir` from; unsurfaced ⇒ `null`, `/war-review` renders `n/a`.
- **At run end** — stamp the run's `endedAt` (a fresh clock read).

Field names follow spec §4.A (nesting may be refined; the **MUST-carry** set is binding): **per phase** — `transcriptDir`, `workflowRunId`, ISO-8601 timestamps, dispatch counts by role, task terminal statuses, `sweepExcludeCount`, `finalPhase`, and the **envelope aggregates** (`totalTokens` / `totalToolCalls` / `agentCount`, binding-to-attempt, null-tolerated — the `workflowRunId` posture); **top level** — `runId`, `planPath`, `configProfile`, run `startedAt`/`endedAt`, plus the optional, null-tolerated launch identity `pluginRoot`, `pluginVersion`, `pluginSha` (the `workflowRunId` posture: stamped at run start, `null` when the Lead cannot source it, never fabricated).

**Fail-open.** Every manifest write is **best-effort** — a failed write logs **one** line and the run proceeds unaffected. Bookkeeping **never** blocks a run, and the manifest is **never** resume input (the resume ordering git > issue labels > `ledger.json`, [ADR 0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md), is untouched).

## Where — runId and untracked-ness (the card's `**Where.**` paragraph tail)

`runId` is minted by [launch-identity.md](launch-identity.md), persisted before dispatch and changed for a fresh run/Recovery relaunch; a same-journal resume rewrites the file in place (**latest-wins per runId**). Untracked-ness **rides the existing `.claude/` exclude** the provisioning `ensure-exclude` step writes into the main checkout's git dir — **no `.gitignore` change**.

## Top-level fields — the field table (stamped at run start)

This table is the one home of the manifest's top-level field list. `schemas.md` § Run manifest and
the card's init-stamp sentence point here and do not restate it.

| Field | Status | Stamped | Source |
|-------|--------|---------|--------|
| `runId` | MUST | run start | [launch-identity.md](launch-identity.md) (`new-run-id.mjs`) |
| `planPath` | MUST | run start | the plan the run executes |
| `configProfile` | MUST | run start | the resolved `/war-room` profile |
| `startedAt` | MUST | run start | a real clock read |
| `endedAt` | MUST | run end | `null` until the run ends, then a real clock read |
| `pluginRoot` | optional, null-tolerated | run start | the absolute `${CLAUDE_PLUGIN_ROOT}` the Lead executes from |
| `pluginVersion` | optional, null-tolerated | run start | `version` in `<pluginRoot>/.claude-plugin/plugin.json` |
| `pluginSha` | optional, null-tolerated | run start | `git -C <pluginRoot> rev-parse HEAD`, or `null` when the root is not a Git checkout |
| `phases` | MUST | per phase | the per-stamp field set in § When above |

The three plugin fields take the `workflowRunId` posture: a value the Lead cannot source is `null`,
never fabricated, and a manifest written before these fields existed simply lacks them. They record
which engine executed the run, so a recovery relaunch can execute from the same plugin root and
version as the launch it recovers ([launch-identity.md](launch-identity.md)).

## Relaunch — a died attempt is archived, never overwritten silently (D22, #1916)

A **relaunch attempt** is one Workflow run of a phase that a prior run of the same phase did not finish: a `resumeFromRunId` retry of a `held:phase-incomplete` phase, or a Recovery relaunch of a `held:workflow-error` / escalated phase ([resume-and-recovery.md](resume-and-recovery.md) § Recovery relaunch). Each attempt has its **own** `workflowRunId` and `transcriptDir` **when the launch envelope surfaces a fresh run id** (the transcript dir's basename **is** that run id); a relaunch whose launch envelope repeats the prior `workflowRunId` archives nothing — the pair is unchanged — and only attempts with distinct run ids are summed. The manifest keeps the phase record **current** and the history **complete**:

- **On every relaunch, overwrite `workflowRunId` + `transcriptDir` together** — never one without the other. Read both from the new launch envelope (the `At phase launch` bullet above); a phase whose `transcriptDir` basename differs from its `workflowRunId` is a half-stamped relaunch, and `/war-review` reports it as the half-stamped relaunch friction row (§ 4) instead of mining that dir.
- **Archive the died attempt under `attempts[]`** before overwriting — the authoritative shape (this file is the only home; `schemas.md` § Run manifest points here and does not restate it):
  ```jsonc
  attempts: [                                   // one entry per attempt that did NOT finish the phase; absent or [] on a first-try phase
    { workflowRunId: "wf_… | null",             // the died attempt's run id (as stamped at its launch)
      transcriptDir: "… | null",                // the died attempt's transcript dir — /war-review may still mine it
      startedAt: "<ISO 8601>", endedAt: "<ISO 8601> | null",   // that attempt's boundaries (endedAt = the clock read when the death was observed)
      dispatches: { worker, auditor, fixRounds, refiner, servitor },   // that attempt's own counts by role
      envelope: { totalTokens, totalToolCalls, agentCount } | null,   // that attempt's own envelope aggregates; null when unsurfaced
      cause: "held:phase-incomplete | held:workflow-error | escalated | …" } ]   // why it did not finish — the landDecision or task status that ended it
  ```
- **Dispatch counts are summed across attempts.** The phase's top-level `dispatches` is the sum of every attempt's counts (archived entries + the current attempt) — the phase paid for every seat it ran, and `/war-review`'s cost view must see them all; a repeated-run-id relaunch archives no entry, so its prior counts are unrecoverable and the sum covers the current attempt alone. `envelope` aggregates stay **binding-to-attempt** (the current attempt's envelope only; a died attempt's envelope, when sourced, rides its `attempts[]` entry).

**Checkpoint on-return reminder.** On every relaunch's return — the Checkpoint's on-phase-return stamp — re-check that the phase record's `workflowRunId` + `transcriptDir` are the **relaunch's** pair and that the prior pair sits in `attempts[]`; a record carrying ONE field of the died attempt's pair is the half-stamped relaunch friction row `/war-review` reports (basename ≠ `workflowRunId`); a record carrying BOTH stale fields is self-consistent and invisible to that check — this re-stamp is its only guard. Fail-open as every other stamp: a failed write logs one line and the run proceeds.
