# Campaign add cross-branch plan resolution — fault-tolerant `/war-campaign add`

## Commander's Intent

- **Purpose:** A plan authored in another chat and PR'd onto master can be added to a running campaign
  without the cross-branch confusion we hit — `/war-campaign add` becomes fault-tolerant about *where the
  plan file lives*.
- **Method:** Resolve at add time, materialize at the plan boundary. `add <plan> [<ref>]` (default
  `origin/master`) checks the local path first; if missing, probes the ref after a fresh fetch and records
  the ref as provenance in the inbox drop — failing loudly if the plan is nowhere. At the next plan boundary
  the Lead materializes the plan file, plus **any** files it references that are missing locally and present
  on the ref (specs, ADRs, anything — applied transitively over each materialized file), via
  `git show <ref>:<path>`, committing them onto that plan's own `dev/<slug>` branch. Never a merge or rebase
  of master into the stack — identical file content merges clean when the stack lands, and ADR 0011's
  stacked-PR model stays intact.
- **End state:**
  1. `/war-campaign add <plan> [<ref>]` accepts a path missing locally but present on the ref; the inbox
     drop records the ref; a path found nowhere fails loudly *at add time*, not at 3am in the Lead's sweep.
  2. `sweep` consumes both legacy one-line and new two-line inbox drops (first line = path, second = ref).
  3. At the plan boundary, the missing plan and — transitively — any referenced files missing locally and
     present on the ref are materialized from the recorded ref and committed onto the plan's `dev/<slug>`
     branch; no master merge/rebase ever enters the stack.
  4. `campaign-ledger.test.mjs` covers ref recording, two-line parse, and legacy compat; gate green.
  5. `war-campaign/SKILL.md` and design-spec §7 document the resolution protocol; release slots bumped.

## Build order (for /war)

1. Phase 1 — cross-branch add resolution (helper + tests → docs wave)
2. Phase 2 — release

## Phase 1 — cross-branch add resolution

### Task 1: ledger helper — ref provenance in the inbox drop

- Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice:
  - `addToInbox(campaignDir, planPath, opts)` gains `opts.ref`: when given, the drop file is two lines —
    line 1 the resolved plan path (unchanged), line 2 `ref: <git-ref>` (e.g. `ref: origin/master`). Without
    `ref`, the drop stays byte-identical to today's single-line shape.
  - CLI `add` subcommand gains `--ref <git-ref>` passthrough to `addToInbox`. **Interface layers (not
    conflicting forms):** the user-facing skill invocation is *positional* — `/war-campaign add <plan>
    [<ref>]` — and the Lead translates that positional `[<ref>]` into the helper's `--ref <ref>` flag when
    it shells out to `campaign-ledger.mjs add`. Same ref, two layers.
  - `sweep` parses the drop's **first line** as the plan path (today it `.trim()`s the whole file, which a
    two-line drop would break). No other sweep behavior changes; sweep stays git-free — materialization
    happens *before* sweep, in Lead prose (Task 2's protocol). A drop whose path is still missing at sweep
    time throws exactly as today: that is the deliberate fail-loud backstop for a skipped materialization.
  - Mapped tests (each must fail with the feature deleted — weak-assertion discipline):
    1. `add` with `ref` → drop contains the path line plus a `ref: <ref>` line.
    2. `add` without `ref` → single-line drop, legacy shape preserved.
    3. `sweep` of a two-line drop → the ledger entry's `plan` is the path from line 1 (fails without the
       first-line parse).
    4. `sweep` of a legacy one-line drop → still consumed correctly (compat guard).
    5. `sweep` of a drop whose line-1 path does **not** exist on disk → **throws with an ENOENT /
       no-such-file message**: `assert.throws(() => sweep(dir), /ENOENT|no such file/)`. The message match
       is load-bearing — a bare `assert.throws` is **vacuous** here, because `assertOrderable` *also* throws
       (`unparseable footprint`) on a missing plan, so a bare throws would still pass even if the ENOENT
       fail-loud backstop were swallowed. Matching `/ENOENT/` goes RED when the backstop is deleted (the
       fallback throw doesn't match), satisfying the weak-assertion discipline. This is the explicit
       executable guard End-state #3 relies on.
- requiresTest: true
- deps: []
- target repo: superproject

### Task 2: document the resolution + materialization protocol

- Files: `skills/war-campaign/SKILL.md`, `docs/specs/2026-07-01-war-companion-skills-design.md`
- Plan slice:
  - **SKILL.md — Invocation:** `add` line becomes `/war-campaign add <plan-path> [<ref>]` (ref defaults to
    `origin/master`; only consulted when the local path is missing).
  - **SKILL.md — add resolution protocol** (new bullets under Invocation):
    0. **Path is anchored to the repo toplevel, never the add-chat cwd.** `add` may run from any directory,
       so the Lead first resolves the argument to a repo-relative token `rel` (the argument made relative to
       `git rev-parse --show-toplevel`) and uses `rel` for every git call below; the drop's line-1 absolute
       is `toplevel/rel`. This closes the foreign-cwd hole — `path.resolve` against a stray cwd can never
       store a path that fails to map onto the ref. `rel` is the single `<repo-relative-path>` token reused
       by the materialize step (`git show <ref>:<rel>`).
    1. Local path exists → drop as today (line-1 absolute `toplevel/rel`; byte-identical legacy shape).
       Local always wins; the fallback never fires over a present file.
    2. Local path missing → `git fetch origin <branch>` then probe `git cat-file -e <ref>:<rel>`.
       Present → drop with `--ref <ref>`. Absent → **fail loudly at add time**, naming both locations tried.
  - **SKILL.md — a new "Materialize" action at the head of lifecycle step 1 (Sweep + select), before the
    `sweep` call.** Ordering is forced: `sweep` reads each drop's plan file (`extractFilesFromPlanFile`), so
    materialization must run **before** `sweep` — the lifecycle is `[Materialize → sweep() → next]` within
    step 1, then step 2 Provision. Prepend an explicit Materialize action to SKILL.md lifecycle step 1 (and
    mirror it into spec §7.1 step 1) that runs *before* `sweep`: read the inbox drops; for each whose path is missing locally and
    whose drop carries a `ref:` line, `git fetch` then `git show <ref>:<repo-relative-path> > <path>` into
    the Lead checkout (untracked at this point). Then scan each materialized file for referenced repo paths
    — backticked path-shaped tokens and markdown link targets that resolve inside the repo — and
    materialize any that are missing locally and present on the ref, **transitively** (each newly
    materialized file gets the same scan; terminates because a file materializes at most once). Report
    every materialized path loudly in the step-1 (Sweep + select) report. The **fail-loud backstop** stays: a drop whose path
    is still missing at `sweep` time throws (Task 1 **test 5** asserts this explicitly), so a skipped
    materialization can never pass silently — that is the executable owner End-state #3 needs, without
    moving git I/O into the stdlib helper.
  - **SKILL.md step 2 (Provision) + spec §7.1 step 2 — commit the materialized files (new edit target).**
    Amend **both** step-2 prose blocks: immediately after `dev/<slug>` is created (off fresh `origin/master`
    or the prior plan's tip) and **before** `/war` runs, `git add` the materialized plan file and its pulled
    references and commit them onto `dev/<slug>`. This is the load-bearing handoff — `/war`'s worker
    worktrees branch off `dev/<slug>` and only see the plan if it is committed there, never as an untracked
    file in the Lead checkout. Never merge or rebase master into the stack; identical-content files merge
    clean when the stack lands, so ADR 0011 is untouched.
  - **Spec §7** (`docs/specs/2026-07-01-war-companion-skills-design.md`): update the invocation block's
    `add` line (§7, ~line 197), the §7.1 step-1 sweep prose (~line 205), **prepend the materialize action to
    §7.1 step 1 (before the `sweep` read) and add the commit clause to §7.1 step 2 (Provision, ~line 207)**,
    the §7.2 inbox bullet
    (~line 230), and resolved-design-tree row 11 (~line 64) to state the two-line drop format, add-time ref
    resolution, and the materialize-then-commit-at-plan-boundary contract. Line numbers are authoring-time
    locators — re-locate by construct, not line (memory `plan-line-number-refs-stale-use-construct-locator`).
- requiresTest: false
- deps: [1]
- target repo: superproject

## Phase 2 — release

### Task 3: version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: read the **current** version from `plugin.json` at execution time (expected `0.14.2`, but a
  stacked campaign may have advanced it — memory `stacked-release-plan-version-literal-lags-operator-target`;
  the live value wins) and bump the patch component in all three slots: `plugin.json` ×1,
  `marketplace.json` ×2. Replace the README `## Status` paragraph **in place** (replace-slot, never emptied)
  with a blurb of this change: `/war-campaign add <plan> [<ref>]` now resolves a plan missing on the current
  branch from the given ref (default `origin/master`) at add time, records the provenance in the inbox drop,
  and the Lead materializes the plan plus any referenced missing files onto that plan's own branch at the
  plan boundary — no merge or rebase of master ever enters the stack. Word the blurb as what `add` *does*,
  not as a guard guarantee (memory `release-blurb-overstates-guard-semantics`).
- requiresTest: false
- deps: []
- target repo: superproject

## Notes / conscious deviations (ratify in /red-team)

- The helper stays Node-stdlib and git-free; all git actions (fetch, probe, show, commit) are Lead/add-chat
  prose steps in SKILL.md. Keeps `campaign-ledger.mjs` deterministic and unit-testable.
- Transitive materialization is naturally bounded: only paths *missing locally* AND *present on the ref*
  qualify, and each file is fetched at most once. Referenced paths that exist locally are never overwritten.
- The original sketch's "no rebase/merge conflicts" pre-check is dropped as unnecessary: the fallback only
  fires for files absent locally, and a newly materialized file identical to master's copy cannot conflict.
- The original sketch's "next phase boundary" is deliberately narrowed to the **plan boundary** — the
  existing inbox-sweep point. Mid-plan mutation of the working branch (while `/war` phases are in flight) is
  out of scope and stays out.
- The Phase 2 version literal is expected-value + self-discover, not authoritative.

## Open decisions (resolved by /red-team 2026-07-06)

- Reference-scan precision — **RATIFIED as proposed**: backticked path-shaped tokens plus markdown link
  targets that resolve inside the repo; `[[wikilinks]]` excluded (memory-store convention, not repo docs).
  Mirrors the existing `isPathShaped` heuristic in `campaign-ledger.mjs`, so no new precision surface.
- Warn when the delivering commit touched files beyond the plan — **RATIFIED out of scope (YAGNI)**:
  transitive materialization covers doc references; code prerequisites are a roadmap-ordering concern, not an
  add-time concern.

## Red-team resolutions applied (2026-07-06)

- **Materialization had no lifecycle home / no executable owner (Major, was BLOCKED).** Task 2 now prepends an
  explicit **Materialize** action to the head of SKILL.md lifecycle step 1 — *before* the `sweep` call, since
  `sweep` reads each drop's file — and mirrors it into spec §7.1 step 1; End-state #3 gains an executable owner
  via the fail-loud backstop (Task 1 **test 5**: `sweep` throws with an ENOENT/no-such-file message on a
  still-missing path — message-matched so it can't be satisfied by the unrelated `unparseable footprint` throw).
- **Commit-to-`dev/<slug>` handoff was promised but unscheduled.** Task 2's edit list now explicitly amends
  **SKILL.md step 2 and spec §7.1 step 2 (Provision)** to `git add` + commit the materialized plan and pulled
  references onto `dev/<slug>` after branch creation and before `/war` runs — so `/war`'s worker worktrees see
  the plan. (Anchors verified present: SKILL.md lifecycle steps 1–2, spec §7.1 steps 1–2.)
- **Path form (absolute drop vs repo-relative git token; foreign-cwd resolution).** The add-resolution
  protocol now anchors resolution to `git rev-parse --show-toplevel` (never the add-chat cwd), defines a single
  repo-relative token `rel` reused by `git cat-file -e <ref>:<rel>` and `git show <ref>:<rel>`, and keeps
  line-1 absolute as `toplevel/rel` (Task 1 stays byte-identical). Re-verify probe: **pass**.
