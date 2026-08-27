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
  the harness — the manifest `envelope` aggregates where present, otherwise Claude Code's transcript
  files — whose formats are harness-internal and may change; state this in the report. This is not
  an invoice.

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
worktree's — resolve the anchor from any linked worktree via the survey-manifest anchor discipline:

```bash
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
RUNS="$MAIN/.claude/war/runs"        # manifests: $RUNS/<runId>.json ; reviews: $RUNS/<runId>-review.md
```

- **default (bare)**: pick the newest `$RUNS/<runId>.json` (by file mtime; ties broken by the
  `runId` date). None found → report **"no run manifest to review"** and stop (offer `--scavenge`).
- **`--run <runId>`**: read `$RUNS/<runId>.json`. Missing → say so and list the runIds that do exist.
- **`--scavenge [<plan-slug>]`**: read [`references/scavenge.md`](references/scavenge.md).

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
  **`n/a`**. Prefer the manifest's per-phase `envelope` aggregates for **totals** when present — the
  authoritative non-transcript source; the input/output/cache **split** stays transcript-mined and
  renders `n/a` when unsourceable, and a mined split value is always **best-effort and possibly
  undercounting** (transcripts undercount tool calls roughly 20× against the envelope), never
  cross-summable against an envelope total — the same bar binds the **run** total for tool
  calls/tokens: it is envelope-sourced only when every phase carries an envelope, and any
  envelope/mined mix renders `n/a (mixed-source)`, never a silent sum (a mixed per-phase sum is
  exactly the cross-sum this bullet already bans — the ~20× skew makes it disinformation, not
  approximation).
- The **manifest** — not the transcripts — supplies dispatch counts by role, task terminal
  statuses, per-phase and run timestamps, `land`, `lessonsWritten`, `issuesFiled`, and — when
  present — the `envelope` token/tool-call totals. These stand even when a transcript is gone.

## 3. Tally — the metric set

Render **per phase and as run totals** (the full End-state-2 set; `n/a` for any unsourced cell).
The **total tool calls** and **total tokens** rows below are run totals bound by the §2
mixed-source rule — a mixed envelope/mined total renders `n/a (mixed-source)`, never a silent sum:

| Metric | Source |
|---|---|
| workflows run (= phase count) | manifest `phases[]` |
| sub-agents by role — workers / auditors / fix-rounds / refiner dispatches / servitor | manifest `phases[].dispatches` |
| total tool calls | manifest `phases[].envelope`, else mined (transcripts) |
| total tokens | manifest `phases[].envelope`, else mined (transcripts) |
| token split — input / output / cache | mined (transcripts), `n/a` when unsourceable |
| wall-clock — total and per phase | manifest `startedAt`/`endedAt` (run) + `phases[].startedAt`/`endedAt`; an all-identical `startedAt`/`endedAt` set is degenerate — render wall-clock **`n/a`** with a note, never a plausible-looking duration |
| audit rounds used vs limit | manifest `phases[].dispatches.fixRounds` vs `run.roundLimit` (from `$MAIN/.claude/war/config.json`; `n/a` if absent) |
| findings by severity and disposition | manifest / handoff if present, else `n/a` |
| asks — parked ask-disposition findings, tallied per phase and as a run total (#1550) | the handoff's `asks` entry, via the mined workflow-return record in the transcripts, else the run ledger's phase `handoff` field when discoverable; unsourceable ⇒ `n/a`, never fabricated |
| citation-resolutions — absorb-by-citation resolutions tallied **per standing adjudication row** (which rows fire, how often; an over-broad row firing constantly is the measured signal to narrow it — D7, ADR 0013 amendment 2026-08-27) | the `aced` records' citation stamp (row-id + match rationale), via the mined workflow-return record in the transcripts, else the run ledger's phase `handoff` field when discoverable; unsourceable ⇒ `n/a`, never fabricated |
| grind measurement — the #1664 backstop read, decision-shaped grinding in the terminal record | three sources, all terminal: the terminal `fixRounds` distribution (manifest `phases[].dispatches.fixRounds`), the filing site's audit-round field (the `## Evidence artifacts` audit-round line each filed follow-up issue carries), and decision-shaped language in `minorsFiled` rationales. **Coarseness named:** round-level attribution does not exist — `fixRounds` is a per-phase dispatch count, the other two are per-task terminal reads. **Failure-routing asymmetry:** an ambiguous reading routes to #1664's instrumentation-first refinement task (a per-round `auditLog` row), never to a silent "no grinding" |
| tasks by terminal status | manifest `phases[].tasks` |
| reland / CAS-reject count | manifest `phases[].land` + any reland count, else `n/a` |
| lessons written | manifest `phases[].lessonsWritten` |
| issues filed | manifest `phases[].issuesFiled` |

**Plan-scoped telemetry** — four ratified rows keyed to the run's *plan* (and any campaign it
rode), not the manifest; render them once per run, after the table above. The same honesty
invariant binds every cell: a row whose source is absent, unparseable, or predates its field
renders **`n/a`**, never a reconstruction.

| Row | Source |
|---|---|
| red-team rounds — this plan | the newest (by filename date) `$MAIN/docs/red-team/*-<plan-slug>.md` report's strict-form `**Rounds:** <integer>` line (directly under the Verdict line); on a campaign run, also the campaign ledger's per-plan `redteamRounds` field — read from the campaign ledger under `$MAIN/.claude/campaigns/*/ledger.json` whose `plans[].slug` equals the manifest `planPath`'s basename sans extension, never the newest campaign (no manifest field records the campaign); multiple slug matches disambiguate by `plans[].plan` equal to the `$MAIN`-resolved manifest `planPath`, still ambiguous → `n/a` with the ambiguity stated; no match → that source is absent — either source alone suffices; when both are present and disagree, the report header wins (it is the newer read) and the delta is stated — both absent → `n/a` |
| red-team rounds per plan — trend across campaigns | the same two sources swept across `$MAIN/docs/red-team/` reports and the campaign ledgers under `$MAIN/.claude/campaigns/*/ledger.json`, rendered as a per-plan series; state a trend reading only with at least one full campaign of field data behind it — until then the series stands alone, and an empty sweep renders `n/a` |
| interview length — questions per merged plan | the authoring interview's final status-line question count (`Qk/<budget>` — budget default 14, operator-raisable per D8; the question contract in [`../war-strategy/references/plan-interview.md`](../war-strategy/references/plan-interview.md)); no artifact persists it today — `n/a` unless the operator supplies the count |
| waive-rate per arming arm | the `WAIVE-<n>` rows carried in plans authored under the authoring-side verification doctrine (each row records the arming arm that fired — the artifact-borne fix-or-waive channel in [`../war-strategy/references/plan-interview.md`](../war-strategy/references/plan-interview.md)); tally waives per arm across the doctrine-authored plans in scope (this run's plan, plus the campaign's plans on a campaign run — the campaign is resolved by the same ledger-match discipline as the red-team-rounds row above: slug match, never the newest campaign; ambiguity ⇒ `n/a` with the ambiguity stated); a plan with no `WAIVE-<n>` rows contributes zero waives, but when **no doctrine-authored plan is in scope** the row renders `n/a` — never fabricated (this skill's standing `n/a` rule) |

Lead with the run header: `runId`, `planPath`, `configProfile`, run wall-clock (`n/a` when the
degenerate-timestamp guard above fires), and the best-effort-harness-read caveat.

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
- **unfinalized phase record** — a phase record missing `endedAt`, `tasks`, or `land` **although
  the run ended or a later phase started** (evidence the phase-close stamp was skipped). This is a
  deliberate killed-run discriminator: a run that died mid-phase leaves the run's own `endedAt`
  null and starts no later phase, so the signal stays silent there — that death already surfaces
  through the `held:*` / dropped-return signal classes above; this one fires only when a Lead
  demonstrably outlived the phase and still skipped the close stamp.
- **unfiled follow-ups** — any `handoff.followUps[]` entry with `issue: null` on a handoff-emitting
  phase (`landed` / `held:escalation`). Source the entries from the mined workflow-return record in
  the transcripts, else the run ledger's phase `handoff` field when discoverable; unsourceable ⇒ no
  row, never fabricated (this section's standing honesty rule).

Close with the **verdict line**: **clean** (no signals) or **friction found (N signals)**.

**Diagnosis discipline (promotion rule).** Signals are *reported with evidence*. Any root-cause
prose you write stays **hypothesis-labeled** ("likely", "appears to") unless you have *proven* the
cause — the red-team self-confound gate's promotion rule. A `held:*` string is evidence of a hold,
not proof of *why* it held; do not assert a cause you have not run down.

## 5. Offer the issue (friction only)

When the verdict is **friction found**, read [`references/offer-issue.md`](references/offer-issue.md).

A **clean** verdict offers no issue.

## 6. Emit

Render the full report **in chat**, and **always** save a markdown copy to
`$RUNS/<runId>-review.md` (for `--scavenge`, `<runId>` = `<plan-slug>-<date>` as reconstructed).
The file is untracked — it rides the existing `.claude/` exclude the provisioning `ensure-exclude`
step maintains; no `.gitignore` change, nothing committed.

## Scavenge — pre-manifest runs

When invoked with `--scavenge`, read [`references/scavenge.md`](references/scavenge.md).
