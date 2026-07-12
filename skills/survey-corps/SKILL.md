---
name: survey-corps
description: Survey this repo's memory lessons and open GitHub issues into war-shaped design specs — first mine qualifying hot lessons from both memory roots into real memory-mined issues (redaction-lint-guarded, slug-deduped across open + closed), then sweep the backlog (run-bookkeeping labels dropped, war-followup debt first-class), fan out reader agents per issue, cluster the summaries into coherent groups, synthesize one spec per group via the /war-strategy spec template, then verify every swept issue is claimed or explicitly deferred. Hands off to /war-machine via an uncommitted survey manifest; never commits. Use when the user runs /survey-corps, wants to turn the open-issue backlog or recorded memory/lesson debt into specs, to mine memories or learnings into issues, asks to survey or triage issues into design specs, or starts the WAR pipeline's memories + issues → specs step.
---

# /survey-corps — memories + issues → specs

You are the **Survey Corps**. You first **mine** qualifying memory lessons into real issues, then
sweep the repo's open issues, cluster them into coherent groups, and author one war-shaped design
spec per group — every swept issue accounted for, nothing committed. The next pipeline step is
`/war-machine` (specs → plans + roadmap); you hand off via the survey manifest below.

This skill authorizes the **Workflow tool** (precedent: `/red-team`, `/lessons-learned`): the
reader fan-out, the cluster barrier, and the per-group spec synthesis run as a Workflow.

## Run

```
/survey-corps [--erwin]
```

`--erwin` = two human gates: pause **before filing** any mined issue (present the drafted batch;
file only approved ones) and pause **after clustering** to present the proposed groups for
approval before synthesizing. The flag makes the survey **un-cronable by design** — bare invoke
is fully autonomous end to end (it mines, files, and synthesizes without pausing).

## Steps (in order)

### 0. Mine

Turn qualifying **hot** memory lessons into real GitHub issues **before** the sweep, so
lesson-recorded debt (open defects, ceilings, recurring traps) rides the normal
sweep → cluster → synthesize machinery instead of staying invisible. This step may ride the same
Workflow authorization as the reader fan-out below.

1. **Enumerate both roots.** Collect hot lessons from **both** memory roots — the repo root
   `docs/learnings/` and the local root (resolved exactly as `war-memory render-index` resolves
   the local root). Exclude `archive/` in **both** roots — cold lessons are mostly
   resolved/evicted.
2. **Classify (reader fan-out).** One reader per lesson (batched like the issue readers in Step 2):
   verify the lesson's referent against the **live tree** and classify —
   *actionable* / *resolved-or-stale* / *process-recipe* / *excluded-type* (`user`/`feedback`).
   Only **open actionable defects** proceed: the referent still exists and names a live
   defect/limitation/ceiling, and the lesson is **not** `[RESOLVED]` and not superseded.
   Recurrence counters boost the drafted issue's **priority in the body, never eligibility**.
3. **Draft the issue.** Title from the lesson `description`; body = the defect statement, a fixed
   greppable citation line **`Lesson: <slug>`** plus the lesson path (`docs/learnings/<slug>.md`
   or `<local-root>/<slug>.md`), the provenance tier, and a recurrence note if any. Quote lesson
   bodies **minimally** — titles can leak too.
4. **Dedup (open AND closed).** Search issues in **both** states for the slug (cite it verbatim so
   the substring-fragile `gh` search has a stable token). Open hit → **skip** (the normal sweep
   already covers it). Closed hit → **skip** and report `previously adjudicated (#N)` — a human
   reopens if they disagree. A closed-as-fixed issue whose lesson still verifies live is a
   **stale-lesson signal reported** for `/lessons-learned`, never acted on here.
5. **Redaction lint (fail-closed).** Guard every drafted body — **title included** — with the
   existing fail-closed redaction lint before filing. **`war-memory.mjs lint` reads
   files/directories only; it does NOT read stdin** — with no path arg it lints the local root, so
   piping a body in returns a false `clean` and would file a leaking issue. So **write the drafted
   title + body to a temp `.md` file and run `war-memory.mjs lint <tmpfile>`** — a non-zero exit
   (exit 1) or any reported hit is a redaction hit — then delete the temp file. (Equivalent: call
   the module's exported `lint(text)` on the drafted text directly — same fail-closed detector.)
   Hit → the issue is **NOT filed**; report `withheld: redaction`. **No auto-scrub, ever.**
6. **File survivors.** File each surviving draft with the **`memory-mined`** label (create the
   label on the target repo if absent). Under `--erwin`, **pause before filing** — present the
   drafted batch and file only approved ones. All `gh` writes ride the existing gh-preflight
   (`overrides.ghUser`) discipline like every other write batch.
7. **Report every mined lesson.** One row per lesson, no silent drops:
   `filed #N` / `withheld: redaction` / `previously adjudicated (#N)` /
   `skipped: <not-actionable reason>`. These rows become the coverage report's **Mining** section
   (Step 6).

### 1. Sweep

`gh issue list --state open` on the current repo. Drop every issue carrying a run-bookkeeping
label: `phase:*`, `status:*`, `task`, `run:*`, legacy `coven`. `war-followup` issues are
**first-class input** — they are WAR's own deferred debt getting its shot at becoming spec'd
work; `memory-mined` issues (just filed in Step 0) are **not** bookkeeping — they pass the filter
and enter the sweep as ordinary open issues. Zero issues after the filter → report
**"nothing to survey"** and stop (no empty specs).

### 2. Fan out readers

One agent per issue (or small batch): read the body + comments + the code the issue touches;
return a structured summary — theme, affected files, severity, staleness signals.

### 3. Cluster (barrier)

Grouping genuinely needs **all summaries at once** — this is the workflow's barrier step.
Cluster issues into coherent groups by theme / subsystem / file family, honoring code-boundary
thinking one level up: groups that would fight over the same files either **merge** or carry an
**ordering edge** (recorded as the manifest's `dependsOn` hint).

- **`--erwin`**: present the proposed groups and wait for approval before synthesizing. Bare
  invoke skips this gate.

### 4. Synthesize specs

Per group, one agent authors a war-shaped design spec using the `/war-strategy` spec template —
consumed by reference to `skills/war-strategy/SKILL.md` §2, **never forked**. Written to
`docs/specs/YYYY-MM-DD-<slug>-design.md`; each spec lists the issue numbers it addresses.

**Grep is a floor, not a ceiling.** Any token-sweep instruction the spec emits (a "grep `<token>`,
handle every match" step) is a completeness *floor*, not a *ceiling* — same-meaning siblings encode
the concept in different words and survive the sweep silently. So every such step the survey writes
into a spec MUST carry the mandatory **manual same-scope title/comment survey** note: after the grep,
hand-scan the target file's same-scope tests/comments and list each straggler as a survey-derived
correction. Carry this from the first authoring surface here, not only at `/war-strategy` plan
conversion.

### 5. Completeness critic

A final agent verifies every swept issue is claimed by **exactly one** spec or explicitly
deferred with a reason (an issue that is actually a question, wontfix-shaped, or already fixed).
Strays are **flagged, never dropped**.

### 6. Manifest + report

Write the survey manifest (schema below), then print the coverage report. It opens with a
**Mining** section — the Step 0.7 rows (`filed #N` / `withheld: redaction` /
`previously adjudicated (#N)` / `skipped: <reason>`) accounting for **every** mined lesson —
rendered **ahead of** the issue→spec table: every swept issue → its spec, or its
`deferred: <why>` row.

## The survey manifest

Path: `.claude/aot/YYYY-MM-DD-survey.json` under the **main checkout** — never the invoking
worktree's `.claude/`. Sessions here run in per-session git worktrees that each carry their own
`.claude/`, so a cwd-relative path would strand the manifest; resolve the anchor from any linked
worktree via:

```bash
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
# manifest: $MAIN/.claude/aot/YYYY-MM-DD-survey.json
```

**Uncommitted; latest-wins** — a same-day re-run overwrites the file; a re-survey supersedes its
predecessor.

Schema (verbatim — `/war-machine` consumes exactly this):

```json
{
  "createdAt": "<ISO 8601>",
  "surveyed": [412, 415, 444],
  "specs": [
    { "path": "docs/specs/2026-07-02-<slug>-design.md",
      "title": "<one line>",
      "issues": [412, 415],
      "dependsOn": ["docs/specs/<sibling>.md"] }
  ],
  "deferred": [ { "issue": 444, "why": "<reason>" } ],
  "consumed": null
}
```

`dependsOn` is the survey's ordering hint (which clusters build on which); `/war-machine` firms
it up into the roadmap's dependency spine. `consumed` is stamped by `/war-machine` — consumed
manifests are **retained, never deleted** (`/aftermath` needs the issue↔spec↔plan chain to
close swept issues later).

## Invariants

- Specs go to the working tree; the survey **never commits** (the autonomous path's commit
  belongs to `/war-machine --afk`). The operator reviews and commits interactive runs.
- Every swept issue is accounted for in the closing coverage report — mapped to a spec or
  explicitly deferred with a reason — and every **mined** lesson appears in its Mining section
  (`filed` / `withheld: redaction` / `previously adjudicated` / `skipped`). No silent drops.
