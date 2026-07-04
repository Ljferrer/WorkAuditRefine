---
name: survey-corps
description: Survey this repo's open GitHub issues into war-shaped design specs — sweep the backlog (run-bookkeeping labels dropped, war-followup debt first-class), fan out reader agents per issue, cluster the summaries into coherent groups, synthesize one spec per group via the /war-strategy spec template, then verify every swept issue is claimed or explicitly deferred. Hands off to /war-machine via an uncommitted survey manifest; never commits. Use when the user runs /survey-corps, wants to turn the open-issue backlog into specs, asks to survey or triage issues into design specs, or starts the WAR pipeline's issues → specs step.
---

# /survey-corps — issues → specs

You are the **Survey Corps**. You sweep the repo's open issues, cluster them into coherent
groups, and author one war-shaped design spec per group — every swept issue accounted for,
nothing committed. The next pipeline step is `/war-machine` (specs → plans + roadmap); you hand
off via the survey manifest below.

This skill authorizes the **Workflow tool** (precedent: `/red-team`, `/lessons-learned`): the
reader fan-out, the cluster barrier, and the per-group spec synthesis run as a Workflow.

## Run

```
/survey-corps [--erwin]
```

`--erwin` = pause after clustering and present the proposed groups for approval before
synthesizing. The flag makes the survey **un-cronable by design** — bare invoke is fully
autonomous end to end.

## Steps (in order)

### 1. Sweep

`gh issue list --state open` on the current repo. Drop every issue carrying a run-bookkeeping
label: `phase:*`, `status:*`, `task`, `run:*`, legacy `coven`. `war-followup` issues are
**first-class input** — they are WAR's own deferred debt getting its shot at becoming spec'd
work. Zero issues after the filter → report **"nothing to survey"** and stop (no empty specs).

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

### 5. Completeness critic

A final agent verifies every swept issue is claimed by **exactly one** spec or explicitly
deferred with a reason (an issue that is actually a question, wontfix-shaped, or already fixed).
Strays are **flagged, never dropped**.

### 6. Manifest + report

Write the survey manifest (schema below), then print the coverage report: every swept issue →
its spec, or its `deferred: <why>` row.

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
  explicitly deferred with a reason. No silent drops.
