# /war-review — run telemetry, friction report, and the run manifest

## 1. Context — the gap / problem

A `/war` run leaves no cost or effort record. Tokens, tool calls, sub-agent counts, and wall-clock
time exist only in Claude Code's transcript files (session JSONL, per-workflow `journal.jsonl` /
`agent-*.jsonl`), and nothing WAR writes — ledger, issues, handoff blocks — points at those paths.
An operator who wants to know "what did that run cost, and did WAR itself misbehave?" has nothing
to ask. Two changes: `/war` starts writing a lightweight **run manifest** as it goes, and a new
**`/war-review`** skill reads it, mines the referenced transcripts, renders a telemetry + friction
report, and optionally files a friction issue on the WAR plugin repo.

Ratified in the grill session of 2026-07-11.

## 2. Pivotal constraints

- **Bookkeeping never blocks a run**: every manifest write in `/war` is fail-open (like lesson
  prefetch) — a failed write logs and continues; the run's correctness record remains
  git > issues > ledger (ADR 0008). The manifest is telemetry, never resume input.
- **Never fabricate numbers**: a metric whose source is missing renders `n/a`, not an estimate.
- **Issue filing is operator-confirmed, always** — an outward write on a repo that is usually not
  the run's target repo.
- `/war-review` is read-only apart from its local report file and the confirmed issue.
- Run telemetry (token spend, machine wall-clock) is operational, per-user data — it stays out of
  the repo by default.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Data source of record | **`/war` writes a run manifest**: `.claude/war/runs/<runId>.json` under the main checkout, accumulated at phase boundaries — timestamps, workflow run IDs + transcript-dir paths, dispatch counts, terminal statuses. `/war-review` reads the manifest and mines the referenced transcripts for tokens/tool calls. |
| 2 | Historical runs without a manifest | **A scavenge flag** (`/war-review --scavenge [<plan-slug>]`): reconstruct pre-manifest runs best-effort by globbing session/journal artifacts by plan slug + date. `n/a` rows expected and rendered honestly. |
| 3 | Report destination | **Chat + local file**: full report rendered in chat; a markdown copy always saved beside the manifest (`.claude/war/runs/<runId>-review.md`, untracked). No committable report by default. |
| 4 | Friction-issue target | **Plugin metadata, confirm always**: resolve the repo from the installed plugin's own metadata (the plugin manifest's `repository` slot); show the drafted issue and target, file only on explicit yes. Unresolvable metadata → ask the user for a repo, never guess. |

## 4. Mechanics

**A. The run manifest** (`/war` Lead, fail-open, updated at phase boundaries):

```json
{
  "runId": "<plan-slug>-<YYYY-MM-DD>",
  "planPath": "docs/plans/....md",
  "configProfile": "<preset or custom>",
  "startedAt": "<ISO 8601>", "endedAt": "<ISO 8601 | null>",
  "phases": [
    {
      "id": "phase-1", "startedAt": "…", "endedAt": "…",
      "workflowRunId": "wf_…", "scriptPath": "…", "transcriptDir": "…",
      "dispatches": { "worker": 4, "auditor": 9, "fixRounds": 1, "refiner": 6, "servitor": 1 },
      "tasks": { "t1": "merged", "t2": "held:escalation" },
      "land": "landed", "lessonsWritten": 3, "issuesFiled": 7
    }
  ]
}
```

Field names above are the spec's contract; exact nesting may be refined at plan time, but the
manifest MUST carry per-phase `transcriptDir`, `workflowRunId`, ISO-8601 timestamps, dispatch
counts by role, and task terminal statuses — those are what `/war-review` consumes. Same-run
resume appends/overwrites in place; the file is uncommitted and latest-wins per `runId`.

**B. `/war-review`** (new skill, `skills/war-review/SKILL.md`):

1. **Select the run**: default = newest manifest in `.claude/war/runs/`; `--run <runId>` pins one;
   `--scavenge` reconstructs without a manifest (decision 2).
2. **Mine**: from the manifest, read each phase's workflow journal and `agent-*.jsonl` transcripts
   for per-agent token usage and tool-call counts; from the manifest itself, dispatch counts,
   statuses, and timings. Missing artifact → `n/a` (Pivotal constraint).
3. **Tally** — the report's metric set:
   - workflows run (n phases), sub-agents by role (workers / auditors / fix-rounds / refiner
     dispatches / servitor), total tool calls, total tokens (in/out/cache split when available),
     wall-clock total and per phase;
   - audit rounds used vs `run.roundLimit`, findings by severity and disposition, tasks by
     terminal status, reland/CAS-reject count, lessons written, issues filed.
4. **Friction section** — WAR-self-inflicted signals, each with evidence (status string, phase,
   task): `held:*` terminal statuses (with `held:workflow-error` called out as infra death),
   `env-blocked` provisions, `land_stale`/reland loops, `roundLimit` exhaustion, dropped/null
   agent returns, guard denials observed in transcripts, phase-close sweep failures. Verdict line:
   **clean** or **friction found (N signals)**.
5. **Offer the issue** (only when friction found): draft one issue (friction rows + evidence +
   runId + plugin version), resolve the target from plugin metadata (decision 4), show draft +
   target, file only on explicit confirmation.
6. **Emit**: chat report + `.claude/war/runs/<runId>-review.md` (decision 3).

**C. Handoff**: `/war`'s closing handoff mentions `/war-review` as the post-run step. The skill is
normally invocable (read-only + confirmed write — no `disable-model-invocation` needed).

## 5. Surface changes

- `skills/war/SKILL.md` + `skills/war/assets/workflow-template.js` — run-manifest accumulation
  (Lead-side bookkeeping at phase boundaries; the workflow's handoff block already carries most
  per-phase facts — the Lead copies them into the manifest) + closing-handoff mention.
- **New** `skills/war-review/SKILL.md`; `.claude-plugin/plugin.json` `skills` array gains the
  entry (and the marketplace skill list if one is enumerated there).
- `README.md` — pipeline section gains `/war-review`.
- `skills/war/references/schemas.md` — run-manifest schema reference.
- Release: version bump rides its own trailing phase — next free patch above the live base across
  all four slots.

## 6. New domain terms (CONTEXT.md)

- **Run manifest** — the uncommitted per-run telemetry record `/war` accumulates at
  `.claude/war/runs/<runId>.json` (timestamps, workflow IDs, transcript-dir pointers, dispatch
  counts, terminal statuses); fail-open bookkeeping, never resume input.
- **/war-review** — the post-run skill that turns a run manifest + its transcripts into a
  telemetry and friction report, optionally filing one confirmed friction issue on the plugin repo.

## 7. Recommended ADRs

None. The manifest is additive, fail-open, and reversible; the one doctrine-adjacent point (it is
never resume input) is an application of ADR 0008, not a new decision.

## 8. Open risks / implementation notes

- **Transcript formats are harness-internal** — the token/tool-call mining must treat shapes
  defensively (absent usage fields → `n/a`), and the skill prose must say the numbers are
  best-effort reads of harness artifacts, not billing truth.
- **Transcript dirs rotate/expire** — a manifest can outlive its transcripts; every mined metric
  degrades independently to `n/a`.
- **`--scavenge` attribution is fuzzy** by design; the report labels scavenged runs as such.
- The manifest lives under the **main checkout's** `.claude/` (same anchor discipline as the
  survey manifest — resolve via `git rev-parse --git-common-dir`, never the invoking worktree).
- Friction mining must respect the diagnosis discipline: signals are *reported with evidence*,
  root-cause prose in the drafted issue stays hypothesis-labeled unless proven (the red-team
  self-confound gate's promotion rule).

## 9. Non-goals / deferred

- No dollar-cost conversion (model pricing rots; tokens only).
- No committable report mode (a team that wants shared telemetry can add one later).
- No auto-filing — the issue is always operator-confirmed.
- No live/mid-run dashboard; review is post-run.
- No cross-run trend analysis (needs several manifests first; a natural follow-up).

## 10. Validation criteria

1. A completed `/war` run leaves `.claude/war/runs/<runId>.json` with per-phase timestamps,
   `transcriptDir`, `workflowRunId`, dispatch counts, and task terminal statuses; a forced
   manifest-write failure does **not** alter the run's outcome (fail-open proven).
2. `/war-review` on that manifest renders every §4.B.3 metric, with `n/a` (never a number) for any
   metric whose transcript source was deleted.
3. Friction fixtures: a manifest containing a `held:workflow-error` phase and a reland loop →
   friction section lists both with evidence; a clean manifest → verdict **clean** and no issue
   offer.
4. The issue path: with friction present, the drafted issue + resolved target repo are shown and
   nothing is filed without explicit confirmation; with plugin metadata unresolvable, the skill
   asks for a repo instead of guessing.
5. `--scavenge` on a pre-manifest run directory reconstructs at minimum phase count and wall-clock
   from artifact timestamps, labeled as scavenged.
6. The report file lands at `.claude/war/runs/<runId>-review.md` and is untracked (`git
   check-ignore` or status-clean proven in a sandbox).
