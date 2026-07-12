---
name: war-review
description: Post-run telemetry and friction review for a completed /war run — reads the newest (or --run-pinned) run manifest under .claude/war/runs/, mines the referenced workflow transcripts for tokens and tool-call counts, tallies the run's cost/effort metrics and WAR-self-inflicted friction signals (rendering n/a for anything unsourceable, never fabricated), and offers ONE operator-confirmed issue on the plugin repo when friction is found; --scavenge reconstructs pre-manifest runs best-effort. Use when the user runs /war-review, asks "what did that run cost", "did WAR misbehave", or wants to review the last war run.
---

# /war-review — run telemetry + friction report

You turn a completed `/war` run into a **cost/effort report** and a **friction report**, and — only
when friction is found and the operator confirms — file **one** issue on the WAR plugin repo. You
read the **run manifest** `/war` accumulated (`.claude/war/runs/<runId>.json`) and mine the workflow
transcripts it points at. You are **read-only apart from two writes**: the local review file
(`.claude/war/runs/<runId>-review.md`, always saved) and the single operator-confirmed issue.

Manifest field contract: [`../war/references/schemas.md`](../war/references/schemas.md) (§ Run
manifest). The manifest is **telemetry, never resume input** — you consume it, you never repair the
run from it (ADR 0008 ordering is git > issues > ledger, untouched here).

**Two honesty invariants, non-negotiable:**

- **Never fabricate a number.** Any metric whose source (manifest field or transcript artifact) is
  absent, deleted, or unparseable renders **`n/a`** — never an estimate, never a guess. Every mined
  metric degrades to `n/a` independently.
- **Numbers are best-effort harness reads, not billing truth.** Token and tool-call counts come from
  Claude Code's transcript files, whose formats are harness-internal and may change; state this in
  the report. This is not an invoice.

## Run

```
/war-review [--run <runId>] [--scavenge [<plan-slug>]]
```

- **bare** — review the **newest** manifest in `.claude/war/runs/`.
- **`--run <runId>`** — pin a specific run by its `runId` (`<plan-slug>-<YYYY-MM-DD>`).
- **`--scavenge [<plan-slug>]`** — reconstruct a **pre-manifest** run best-effort from transcript
  artifacts (no manifest exists); output is labeled *scavenged* throughout.

## 1. Select the run

The manifest and review file live under the **main checkout's** `.claude/`, never the invoking
worktree's — a `/war-review` session may run in a per-session worktree that carries its own
`.claude/`, so a cwd-relative glob would miss the real runs dir. Resolve the anchor from any linked
worktree via the survey-manifest anchor discipline:

```bash
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
RUNS="$MAIN/.claude/war/runs"        # manifests: $RUNS/<runId>.json ; reviews: $RUNS/<runId>-review.md
```

- **default (bare)**: pick the newest `$RUNS/<runId>.json` (by file mtime; ties broken by the
  `runId` date). None found → report **"no run manifest to review"** and stop (offer `--scavenge`).
- **`--run <runId>`**: read `$RUNS/<runId>.json`. Missing → say so and list the runIds that do exist.
- **`--scavenge [<plan-slug>]`**: see § Scavenge below.

Parse the manifest as JSON. A present-but-malformed manifest is reported honestly (say which fields
you could read); you never invent the missing fields.

## 2. Mine the transcripts

For each phase in the manifest, take its `transcriptDir` and glob for the workflow's
`journal.jsonl` and per-agent `agent-*.jsonl` files. These are **harness-internal, line-delimited
JSON** — read them **defensively**:

- Parse line by line; skip any line that does not parse rather than aborting the phase.
- Sum **token usage** (input / output / cache-read / cache-creation) from whatever usage-shaped
  fields the records carry; count **tool-call** events. If a phase's `transcriptDir` is `null`,
  missing on disk, expired, or carries no usage-shaped fields → that phase's mined metrics are
  **`n/a`** (do not fall back to the manifest for token counts — the manifest never carries them).
- The **manifest** — not the transcripts — supplies dispatch counts by role, task terminal
  statuses, per-phase and run timestamps, `land`, `lessonsWritten`, and `issuesFiled`. These stand
  even when a transcript is gone.

Do not hardcode a rigid transcript schema. If a future harness renames the usage fields, the
defensive read degrades to `n/a` instead of crashing — that is the intended failure mode.

## 3. Tally — the metric set

Render **per phase and as run totals** (the full End-state-2 set; `n/a` for any unsourced cell):

| Metric | Source |
|---|---|
| workflows run (= phase count) | manifest `phases[]` |
| sub-agents by role — workers / auditors / fix-rounds / refiner dispatches / servitor | manifest `phases[].dispatches` |
| total tool calls | mined (transcripts) |
| total tokens — input / output / cache (split when available) | mined (transcripts) |
| wall-clock — total and per phase | manifest `startedAt`/`endedAt` (run) + `phases[].startedAt`/`endedAt` |
| audit rounds used vs limit | manifest `phases[].dispatches.fixRounds` vs `run.roundLimit` (from `$MAIN/.claude/war/config.json`; `n/a` if absent) |
| findings by severity and disposition | manifest / handoff if present, else `n/a` |
| tasks by terminal status | manifest `phases[].tasks` |
| reland / CAS-reject count | manifest `phases[].land` + any reland count, else `n/a` |
| lessons written | manifest `phases[].lessonsWritten` |
| issues filed | manifest `phases[].issuesFiled` |

Lead with the run header: `runId`, `planPath`, `configProfile`, run wall-clock, and the
best-effort-harness-read caveat.

## 4. Friction — WAR-self-inflicted signals

Enumerate the signal classes below. Each hit is **one row with its evidence** — the exact status
string, its phase, and its task (where task-scoped):

- **`held:*` terminal statuses** on any task or phase `land` — `held:escalation`,
  `held:nothing-merged`, `held:land-failed`, `held:phase-incomplete`, `held:workflow-error`,
  `held:submodule-pr`. Call out **`held:workflow-error` as infra death** (a dead phase that never
  advanced the DAG).
- **`env-blocked`** task outcomes — a provision failure that meant the worker was never spawned.
- **`land_stale` / reland loops** — a same-branch land that exhausted the bounded reland loop
  (`roundLimit` CAS-contention relands), or any non-zero reland/CAS-reject count.
- **`roundLimit` exhaustion** — fix-rounds or resume attempts that hit `run.roundLimit`.
- **dropped / null agent returns** — a dispatch that returned nothing where a result was expected
  (manifest anomaly or a truncated transcript).
- **guard denials** — a hook denial observed in an `agent-*.jsonl` transcript (a scope/git/servitor
  guard that fired).
- **phase-close sweep failures** — a coherence/absorb sweep that failed at phase close.

Close with the **verdict line**: **clean** (no signals) or **friction found (N signals)**.

**Diagnosis discipline (promotion rule).** Signals are *reported with evidence*. Any root-cause
prose you write stays **hypothesis-labeled** ("likely", "appears to") unless you have *proven* the
cause — the red-team self-confound gate's promotion rule. A `held:*` string is evidence of a hold,
not proof of *why* it held; do not assert a cause you have not run down.

## 5. Offer the issue (friction only)

Only when the verdict is **friction found**:

1. **Draft one issue** — title + body carrying the friction rows with their evidence, the `runId`,
   and the **plugin version** (`version` from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
   Root-cause claims stay hypothesis-labeled per § 4.
2. **Resolve the target repo** from the installed plugin's own metadata — the `repository` slot of
   `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. If that slot is missing or unparseable,
   **ask the operator for a repo — never guess**.
3. **Show the drafted issue and the resolved target**, then file **only on explicit confirmation**.
   No confirmation → nothing is filed.
4. **gh-preflight before the write.** The issue is an outward write on a repo that is usually *not*
   the run's target repo. Before filing, run
   `bash ${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh "<overrides.ghUser>"` (from the run
   config's `overrides.ghUser`; empty/unset ⇒ no-op exit 0) so a mid-session account flip never
   drops the issue onto the wrong account.

A **clean** verdict offers no issue.

## 6. Emit

Render the full report **in chat**, and **always** save a markdown copy to
`$RUNS/<runId>-review.md` (for `--scavenge`, `<runId>` = `<plan-slug>-<date>` as reconstructed).
The file is untracked — it rides the existing `.claude/` exclude the provisioning `ensure-exclude`
step maintains; no `.gitignore` change, nothing committed.

## Scavenge — pre-manifest runs

`--scavenge [<plan-slug>]` reconstructs a run that predates the manifest. There is no manifest to
read, so mine the transcript artifacts directly:

- Glob the harness transcript artifacts (the same kind of dir a manifest `transcriptDir` points
  into) for `journal.jsonl` / `agent-*.jsonl`, grouped by plan slug + date. With no `<plan-slug>`,
  reconstruct the most recent group; with one, that plan's runs.
- Reconstruct **at minimum the phase count and wall-clock** from artifact timestamps; tokens and
  tool calls where the transcripts still carry them. Everything unreconstructable → **`n/a`**.
- Label the **whole report** *scavenged (best-effort, pre-manifest reconstruction)* — attribution is
  fuzzy by design and the reader must know it. Save it to `$RUNS/<runId>-review.md` like any review.
