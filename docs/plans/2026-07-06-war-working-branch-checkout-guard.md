# WAR working-branch checkout guard

Source: docs/specs/2026-07-06-war-working-branch-checkout-guard-design.md (design tree resolved via `/war-strategy` grilling; converted to war shape by `/war-strategy`). Validate with `/red-team` before `/war`.

## Commander's Intent

- Purpose: `/war` must land every phase autonomously from *any* launch context — including a worktree that
  has the run's own working branch checked out — eliminating the `held:land-failed` footgun and the manual
  per-phase lands it forces.
- Method: Prevent the collision at Setup (auto-create a dedicated `dev/<date>-<slug>` working branch +
  bootstrap it on origin), plus a strictly-scoped `--afk` auto-recover for a checkout-collision land failure
  on a clean fast-forward superset. Confine git-topology logic to the tested `provision-worktrees.sh`; never
  weaken the push-first-CAS / never-force invariants; the recover gates green before any push and never fires
  on a real conflict or red gate.
- End state:
  1. `provision-worktrees.sh resolve-working-branch <desired> <slug> <date>` returns a fresh
     `dev/<date>-<slug>` branch (created at the desired tip, checked out nowhere) when the desired branch is
     checked out in any worktree, and returns the desired branch unchanged otherwise — both pinned by
     `provision-worktrees.test.sh`.
  2. WAR Setup resolves the working branch via that subcommand, ensures it exists on origin before Phase 1,
     and announces + records the resolved branch in the ledger.
  3. WAR Checkpoint outcome-handling auto-performs the `--no-ff` land (gate-green, push) for a
     checkout-collision `held:land-failed` on a clean fast-forward superset under `--afk`; every other
     `held:land-failed` cause remains a hold.
  4. A new ADR records the dedicated-working-branch + origin-bootstrap decision, and `CONTEXT.md` defines
     `launch-worktree collision` and `dedicated working branch`.
  5. Version bumped across all four release slots — relational, next free patch resolved at land time.

## Build order (for /war)

1. Phase 1 — Guard implementation (3 tasks, 2 waves)
2. Phase 2 — Release

## Phase 1 — Guard implementation

### Task 1: resolve-working-branch subcommand + tests

- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: Add a `resolve-working-branch <desired> <slug> <date>` subcommand to
  `provision-worktrees.sh` (bash-3.2-safe, matching the file's existing subcommand style). Behavior: detect
  whether `<desired>` is checked out in ANY worktree via `git worktree list --porcelain`. No collision → echo
  `<desired>` unchanged (byte-identical to today's default). Collision → create a dedicated branch
  `dev/<date>-<slug>` at `<desired>`'s tip — reuse-if-ours on resume (the ADR 0003 ownership seam; accept the
  same `--owned-file`/`--owned` inputs the other subcommands use), suffix or fail-loud on a foreign
  pre-existing name — checked out nowhere, and echo it. Provide the origin-ensure step (`git push -u origin
  <resolved>`) as a dedicated **`provision-worktrees.sh` sibling verb** (e.g. `ensure-origin <resolved>`) that Setup calls
  immediately after `resolve-working-branch` — matching spec §4's two-step Setup (resolve, then ensure-origin)
  and keeping `resolve-working-branch` single-responsibility. It lives in `provision-worktrees.sh`, **never a
  raw `git push` in `SKILL.md` prose**, so the origin push stays in the single tested owner of git-topology mutation and is
  exercised by validation criterion (c)/§10.3's mock-remote test. Keep the push idempotent — a branch already
  on origin is a no-op, never a force. Add
  `provision-worktrees.test.sh` coverage: (a) collision → echoed branch `≠ <desired>`, matches
  `dev/<date>-<slug>`, created at the desired tip, checked out nowhere; (b) no-collision → `<desired>` echoed
  unchanged; (c) origin-ensure against a local mock remote (`git ls-remote` shows the ref); (d) resume-reuse —
  a second call with the same slug/date reuses the run-owned branch, never re-cuts or errors.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: ADR + CONTEXT terms

- Files: `docs/adr/0018-war-working-branch-checkout-guard.md`, `CONTEXT.md`
- Plan slice: Author a new ADR recording the decision — WAR resolves a **dedicated working branch** when the
  desired one is checked out in the launching worktree, and bootstraps it on origin at Setup; prevention-first
  with a narrow `--afk` auto-recover; tolerating the collision inside `land-advance` was rejected (a ref
  checked out elsewhere is un-advanceable by design, not a bug to work around). Reference ADR 0003
  (plan-namespaced branches) and ADR 0004 (push-first CAS land). **Resolve the ADR number to the next free one
  at land time** (0018 as of authoring — do not trust the literal if other ADRs land first). Add `CONTEXT.md`
  glossary entries for `launch-worktree collision` and `dedicated working branch` (definitions per spec §6).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Setup working-branch resolution + Checkpoint auto-recover

- Files: `skills/war/SKILL.md`
- Plan slice: (Setup, `## Setup`) After resolving the *desired* working branch (default current branch /
  `--working` / `overrides.workingBranch`), call `provision-worktrees.sh resolve-working-branch <desired>
  <slug> <date>` and use its result as the run's working branch; then call `provision-worktrees.sh ensure-origin <resolved>`
  to bootstrap it on origin before Phase 1;
  announce (`using working branch <resolved> …`) and record it in the ledger. (Outcome-handling, `##
  Checkpoint`) On a `held:land-failed`, **append a new bullet to the existing `Outcome handling (§4.3)` list**
  (which today handles `held:workflow-error` / `held:phase-incomplete` / `held:submodule-pr` and has no
  `held:land-failed` case) — the narrow checkout-collision auto-recover: iff the working branch
  is checked out in the Lead worktree AND `git merge-base --is-ancestor <working> <integration>` holds (clean
  fast-forward superset), under `--afk` auto-perform the manual land (merge `integration/*` → working
  `--no-ff` in the Lead worktree, run the resolved gate, push); interactively, offer it. Every other
  `held:land-failed` cause is unchanged (stays a hold). The recover MUST gate-green before push and MUST NOT
  fire on a real conflict or red gate. Single surface: the refiner's `land-advance` algorithm is unchanged, so
  no `agents/war-refiner.md` + `workflow-template.js` mirror is needed (the prompt-surface-split rule does not
  trigger — this is Lead standing instruction only).
- requiresTest: false
- requiresPackaging: false
- deps: [1]
- target repo: superproject

## Phase 2 — Release

### Task 4: version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump the patch version across all four slots — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, no
  badge). Resolve the target relationally at land time: read the current slots and take the next free patch
  (do not trust any literal here — master may already be at 0.14.7 from the doc-rot PR #557, so the next free
  patch depends on landing order). The Status blurb summarizes the working-branch checkout guard in general
  terms.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- End-to-end guard validation: a full `--afk` `/war` run launched from a worktree sitting on the would-be
  working branch completes with all phases **auto-landed** (no manual Lead land) and no post-land
  stale-worktree desync · why deferred: requires a live multi-phase run against a real repo — the collision,
  the CAS baseline, and the auto-recover cannot be exercised by a unit test · runner: **the operator**, on the next
  `/war` run launched from a session worktree after this guard ships (this repo has no CI beyond the redaction
  lint, so the check is operator-observed, not automated). The run **self-validates**: it either auto-lands
  every phase (guard works) or forces a manual Lead land / shows a post-land stale-worktree desync (guard
  regressed) — both directly observable in the per-phase `handoff`. Expected imminently: WAR is routinely run
  from session worktrees in this repo.

## Notes / conscious deviations

- The `land-advance` create-if-absent-on-origin belt (spec §9) is **deferred** — Task 2's Setup origin
  bootstrap covers the CAS baseline, so `land-advance` needs no change; revisit only if a belt is later
  wanted. Ratify in `/red-team`.
- Task 2 is **single-surface** (Lead standing instructions in `SKILL.md` only): the refiner's land algorithm
  is untouched, so the standing-instruction-vs-dispatched-prompt split (`agents/war-refiner.md` +
  `workflow-template.js`) does not apply here. Ratify in `/red-team`.
- ADR number `0018` is the next free as of authoring; resolve to the actual next free number at land time.
- Phase 2 release: the version target is resolved relationally at land time — landing order relative to the
  doc-rot PR (#557, which bumps to 0.14.7) determines the next free patch (stacked-release baseline lag).
- `requiresPackaging` is `false` on all tasks: the repo has no Dockerfiles, so the packaging floor no-ops.

## Open decisions

None — scope, the prevention mechanism (auto-create a dedicated working branch), the origin bootstrap, and the
`--afk` auto-recover were resolved in the `/war-strategy` grilling; the Commander's Intent block above is
operator-confirmed.
