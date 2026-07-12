# /war-review — run telemetry, friction report, and the run manifest

Source spec: [docs/specs/2026-07-11-war-review-run-telemetry-design.md](../specs/2026-07-11-war-review-run-telemetry-design.md)

## Commander's Intent

- **Purpose:** a `/war` run finally leaves an inspectable cost/effort record — and WAR's own
  frictions get a paved path back to the plugin repo as issues.
- **Method:** `/war` accumulates a fail-open run manifest at phase boundaries (bookkeeping never
  blocks a run; never resume input — the correctness record stays git > issues > ledger). The
  new `/war-review` reads the newest (or pinned) manifest, mines the referenced workflow
  transcripts for tokens/tool calls, tallies telemetry + friction rendering `n/a` for anything
  unsourceable (never fabricate), and offers **one** operator-confirmed issue targeted via
  plugin metadata. `--scavenge` reconstructs pre-manifest runs best-effort. Engine untouched —
  the manifest is Lead-side bookkeeping in `/war` prose.
- **End state:**
  1. A completed `/war` run leaves `.claude/war/runs/<runId>.json` with per-phase timestamps,
     `workflowRunId`, `transcriptDir`, dispatch counts, and task terminal statuses; a failed
     manifest write never alters the run outcome.
  2. `/war-review` (registered in `plugin.json`) renders the full metric set — workflows,
     sub-agents by role, tool calls, tokens (in/out/cache when available), wall-clock total and
     per phase, audit rounds vs limit, findings by severity/disposition, tasks by status,
     relands, lessons, issues — in chat and saves `<runId>-review.md` beside the manifest;
     missing sources render `n/a`.
  3. The friction section enumerates the signal classes (`held:*`, `env-blocked`, reland loops,
     roundLimit exhaustion, dropped agents, guard denials, sweep failures) with evidence;
     verdict **clean** or **friction found (N)**.
  4. On friction: one drafted issue, target resolved from plugin metadata, filed only on
     explicit confirm; unresolvable metadata → ask, never guess.
  5. `--scavenge` reconstructs historical runs, labeled as scavenged.
  6. `/war`'s closing handoff points at `/war-review`; README documents it in the pipeline.
  7. Release lands as its own trailing phase: next free patch above the live base, all four
     slots.

## Build order (for /war)

1. **Phase 1 — manifest + skill** (four parallel, file-disjoint tasks)
2. **Phase 2 — release** (trailing, shared slot files)

## Phase 1 — manifest + skill

### Task 1.1: /war SKILL.md — run-manifest bookkeeping

- Files: `skills/war/SKILL.md`
- Plan slice: add the Lead-side manifest discipline to the run prose:
  - **Where**: `.claude/war/runs/<runId>.json` under the **main checkout** — resolve the anchor
    via `git rev-parse --path-format=absolute --git-common-dir` (the survey-manifest anchor
    discipline), never the invoking worktree's `.claude/`. `runId` = `<plan-slug>-<YYYY-MM-DD>`;
    same-run resume updates in place (latest-wins per runId). Untracked-ness rides the existing
    `.claude/` line the provisioning `ensure-exclude` step maintains — no `.gitignore` change.
  - **When**: updated at phase boundaries — stamp `startedAt` at phase launch, and on phase
    return stamp `endedAt` plus the per-phase record: `workflowRunId` and `transcriptDir` as
    surfaced by the harness's task result (absent → `null`), dispatch counts by role derived
    from the decompose + the returned `auditLog`/fix rounds/`servitorResult`, task terminal
    statuses, `landDecision`, lessons written, issues filed. Top level: `runId`, `planPath`,
    `configProfile`, run `startedAt`/`endedAt`. Field set per spec §4.A (the spec's field
    contract; nesting refinements allowed, the MUST-carry list is binding).
  - **Fail-open**: every manifest write is best-effort — a failed write logs one line and the
    run proceeds unaffected; the manifest is telemetry, **never resume input** (ADR 0008
    ordering untouched).
  - **Closing handoff**: the end-of-run handoff prose points at `/war-review` as the post-run
    step.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: the /war-review skill + registration

- Files: `skills/war-review/SKILL.md` (new), `.claude-plugin/plugin.json`
- Plan slice: author the skill per spec §4.B and register it:
  - **Frontmatter description**: post-run telemetry + friction review; triggers on `/war-review`,
    "what did that run cost", "did WAR misbehave", "review the last war run".
  - **Run selection**: default = newest manifest in `.claude/war/runs/` (main-checkout anchor);
    `--run <runId>` pins one; `--scavenge [<plan-slug>]` reconstructs a pre-manifest run
    best-effort from session/journal artifacts by plan slug + date, output labeled *scavenged*.
  - **Mining**: per phase, read the workflow `journal.jsonl` / `agent-*.jsonl` under the
    manifest's `transcriptDir` for per-agent token usage and tool-call counts — shapes read
    defensively (harness-internal formats; absent usage fields → `n/a`); manifest supplies
    dispatch counts, statuses, timings. **Never fabricate**: any missing source renders `n/a`.
    Numbers are presented as best-effort harness reads, not billing truth.
  - **Tally**: the End-state-2 metric set, per phase + totals.
  - **Friction**: the End-state-3 signal classes, each row with evidence (status string, phase,
    task); verdict line **clean** / **friction found (N signals)**. Root-cause prose stays
    hypothesis-labeled unless proven (diagnosis-discipline promotion rule).
  - **Issue offer** (friction only): draft ONE issue (friction rows + evidence + runId + plugin
    version); resolve the target repo from the installed plugin's own metadata (`repository`
    slot); show draft + target; file **only on explicit confirmation**; unresolvable metadata →
    ask the user for a repo. gh writes ride the gh-preflight (`overrides.ghUser`) discipline.
  - **Emit**: chat report + `.claude/war/runs/<runId>-review.md` (always saved).
  - **Registration**: append the skill path to the `skills` array in
    `.claude-plugin/plugin.json` (no version slots touched — release owns those; marketplace
    enumerates no skills, verified at conversion).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: schemas.md — run-manifest reference

- Files: `skills/war/references/schemas.md`
- Plan slice: add a **Run manifest** section to the schema reference: path pattern, the
  MUST-carry field list (per-phase `transcriptDir`, `workflowRunId`, ISO-8601 timestamps,
  dispatch counts by role, task terminal statuses; top-level runId/planPath/configProfile/run
  timestamps), the fail-open + never-resume-input contract, and the `<runId>-review.md` sibling
  the review saves. Mark it telemetry (consumed by `/war-review`), distinct from the run ledger.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: README — pipeline mentions

- Files: `README.md`
- Plan slice: document `/war-review` — anchor by construct, not line:
  - the **command-set overview sentence** (the pipeline walk-through paragraph) gains the
    post-run step,
  - a short **`/war-review`** subsection in the command tour: what it tallies, the friction
    verdict, the confirmed-issue offer, `--scavenge`,
  - the **quick-reference command block** gains its line.
  Grep is a floor: after the token sweep for `war-review`/pipeline mentions, hand-scan the
  same-scope pipeline prose for sentences enumerating the command set (they claim completeness)
  and fix each straggler as a survey-derived correction.
  Do **not** touch the `## Status` line (release owns it, Phase 2).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — release

### Task 2.1: version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump the **next free patch above the live base at land time** across all four
  slots together — `plugin.json` `version`, `marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, no badge).
  Version literals anywhere in this plan are non-authoritative; resolve from the slots at land
  time (stacked predecessors may have consumed patches).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Manifest written + fail-open proven** (spec §10.1): a completed `/war` run leaves the
  manifest with the MUST-carry fields; a forced write failure does not alter the run outcome
  · why deferred: requires a live multi-phase `/war` run — no pre-merge gate spawns one
  · runner: the first `/war` run on this repo after merge; operator inspects
  `.claude/war/runs/`.
- **Review rendering, friction verdicts, issue confirm, scavenge, untracked report**
  (spec §10.2–10.6): metric rendering with `n/a` degradation, friction fixtures → listed with
  evidence / clean → no offer, nothing filed without explicit confirm + unresolvable-metadata
  ask, `--scavenge` reconstruction labeled scavenged, report file untracked where the
  `ensure-exclude` mechanism has run
  · why deferred: all interactive/live-artifact behaviors of the new skill — the repo gate has
  no manifest fixtures, no transcripts, no gh sandbox, no operator
  · runner: the first `/war-review` invocations (bare, `--run`, `--scavenge`, and one
  friction-bearing run) after merge; operator checks against the criteria.

## Notes / conscious deviations

- **`workflow-template.js` is deliberately untouched** — spec §5 named it as a possible surface,
  but conversion verified the workflow return (`auditLog`, `aced`, `minorsFiled`, `landResult`,
  `servitorResult`, handoff block) plus the harness task result (run id, transcript dir) already
  carry everything the manifest needs; the Lead copies, the engine stays closed. This rescope
  note supersedes the spec's §5 file list.
- **No `.gitignore` change**: `.claude/war/runs/` untracked-ness rides the existing `.claude/`
  exclude maintained by provisioning's `ensure-exclude`; spec criterion §10.6 is scoped to
  where that mechanism has run.
- The new skill ships without tests (prose-only, consistent with sibling skills that carry no
  doc-contract test); behavioral validation rides the backstops.
- Both drift-guard authoring rules are vacuous: no new inline mirror, no default flip.
- `plugin.json` is touched in Phase 1 (skills array) and Phase 2 (version slot) — cross-phase
  landed-first edge on disjoint keys.

## Open decisions

None — the design tree was resolved in the 2026-07-11 grill session (see the source spec).
