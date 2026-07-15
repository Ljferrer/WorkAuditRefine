# Campaign state anchors at the main checkout — hook, ledger CLI, and placement prose stop trusting the Lead's cwd

Source spec: `docs/specs/2026-07-15-campaign-state-anchor-design.md`

## Commander's Intent

- Purpose: ADR 0016's compaction-survival guarantee must hold in the normal case — a campaign
  Lead running from a session git worktree — with campaign state living in exactly one durable
  place (the main checkout's `.claude/campaigns`), so it survives worktree reaping and never
  again needs per-worktree symlinks or copies.
- Method: anchor every campaign-state surface — the hook's scan root, the ledger CLI's relative
  `--campaign` resolution, and the war-campaign SKILL placement prose — at the main checkout via
  the already-ratified `git rev-parse --path-format=absolute --git-common-dir` idiom, exactly as
  survey-corps/war-machine do; every git probe fails open to today's behavior; the
  formerly-silent no-campaigns path warns when an *active* ledger sits stranded under a
  worktree; the prose gains a structure-test drift guard.
- End state:
  1. Hook invoked with a linked-worktree cwd (`CLAUDE_PROJECT_DIR` unset or set to the worktree)
     injects the main checkout's active `CAMPAIGN-STATE.md` — test-proven.
  2. Existing non-git hook fixtures (cases 1–11) pass unmodified — the fail-open fallback is
     intact.
  3. An active ledger stranded under `<main>/.claude/worktrees/*` produces a bounded warning
     payload naming the path; an all-landed stranded ledger stays silent.
  4. A relative `--campaign` passed to `campaign-ledger.mjs` from a worktree cwd resolves under
     the main checkout; an absolute path passes through; a non-git cwd keeps today's behavior —
     test-proven.
  5. `init()` through a dangling `campaigns` symlink throws an error naming the campaign dir,
     never a bare ENOENT stack.
  6. `skills/war-campaign/SKILL.md` states the anchor rule and `war-pipeline-structure.test.sh`
     locks it.
  7. ADR 0016 carries the dated amendment superseding the cwd-anchoring note.
  8. All four version slots bump in lock-step to the next free patch above the live base.

## Build order (for /war)

1. Phase 1 — Anchor the three surfaces (3 parallel tasks, file-disjoint, no waves)
2. Phase 2 — Release (version bump; trailing phase per doctrine)

## Phase 1 — Anchor the three surfaces

### Task 1: Hook — anchored scan root + stranded-state warning

- Files: `hooks/inject-campaign-state.sh`, `hooks/inject-campaign-state.test.sh`
- Plan slice: In the hook, after the existing scan-root resolution (the "Scan root" comment
  block) and before the campaigns-dir existence guard, add one anchor block — **two-step,
  failure-distinguishable form (red-team blocker fix 2026-07-16):**
  `common=$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) &&
  [ -n "$common" ] && root=$(dirname "$common")` — capture git's output FIRST so the
  assignment propagates git's exit status and the `&&` chain gates the reassignment; only then
  `dirname` it. The spec §3 composed one-liner
  (`main=$(dirname "$(git … 2>/dev/null)")` + non-empty guard) is REJECTED as the
  implementation: `dirname` of a failed/empty command substitution returns `.` (never empty),
  so the composed form silently sets `root=.` in a non-git dir — proven on bash 3.2.57 —
  violating this plan's own fail-open constraint. On any failure (git absent, not a repo,
  bare) `$root` stays untouched — preserving the fail-open discipline stated in the header
  comment (never nonzero, never partial output; bash 3.2, jq-only hard dependency). The hook has THREE
  silent no-inject exits (red-team enumeration correction 2026-07-16): the no-campaigns-dir
  guard, the empty-candidates exit (campaigns dir present but holding no `*/ledger.json` —
  the site between the other two that the original two-site enumeration missed), and the
  no-active-ledger exit after the mtime scan. Factor the stranded-state probe into ONE helper
  function invoked at ALL THREE sites (a single landing site is the drift-proof shape — a
  fourth future exit should have one obvious call to copy): probe
  `"$root"/.claude/worktrees/*/.claude/campaigns/*/ledger.json`; if any passes the existing
  `is_active` predicate, emit the standard single-JSON-object payload whose `additionalContext`
  is a bounded two-line warning naming the stranded ledger path and stating that campaign state
  outside the main checkout's `.claude/campaigns` will not survive worktree reaping — then exit
  0. All-landed stranded ledgers stay silent. Mtime selection, size gate, and existing payload
  variants are untouched. Extend the test suite (same fixture idioms as the existing cases,
  which remain unmodified as fallback coverage): a real temp git repo + `git worktree add`
  linked worktree with an active campaign under the main checkout only — stdin cwd = worktree
  path with `CLAUDE_PROJECT_DIR` unset injects the state sentinel (End state 1); same fixture
  with `CLAUDE_PROJECT_DIR` set to the worktree path injects identically (End state 1); with
  `git` shadowed off `PATH`, a non-git fixture still injects via the unanchored root (End
  state 2); an active ledger present only under the main checkout's
  `.claude/worktrees/x/.claude/campaigns/` yields the warning payload and exit 0, while an
  all-`landed` one yields empty stdout and exit 0 (End state 3); AND the same stranded-active
  fixture with a PRESENT-BUT-EMPTY `<main>/.claude/campaigns/` directory (the empty-candidates
  exit) also yields the warning payload — the arm that reds if the probe is wired into only
  the two originally-named sites (red-team coverage fix 2026-07-16).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Ledger CLI — anchored relative `--campaign` + named init error

- Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice: Add a `resolveCampaignDir` helper used only at the CLI layer (the `campaignDir`
  assignment at the top of `main()`): an absolute `--campaign` passes through untouched; a
  relative path (including the `.claude/campaigns/default` default) joins to the main checkout
  resolved via a `node:child_process` `execFileSync('git', ['rev-parse',
  '--path-format=absolute', '--git-common-dir'])` probe (dirname of the result), falling back
  to cwd-relative (today's behavior) when the probe fails for any reason. Exported library
  functions keep taking `campaignDir` verbatim — existing tests and callers are unaffected. In
  `init()`, wrap the two `mkdirSync` calls: on ENOENT, rethrow an error naming `campaignDir`
  and the dangling-symlink possibility (a dangling `campaigns` symlink makes recursive mkdir
  throw ENOENT — the 2026-07-15 incident). Tests: from a temp git repo's linked worktree,
  invoking the CLI with a relative `--campaign` writes under the main checkout; an absolute
  `--campaign` is used verbatim; from a non-git temp cwd the relative path resolves against cwd
  (End state 4); `init()` pointed through a dangling symlink throws an error whose message
  names the campaign dir (End state 5).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Placement prose, drift guard, ADR amendment

- Files: `skills/war-campaign/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`, `docs/adr/0016-campaign-compaction-survival.md`
- Plan slice: In `skills/war-campaign/SKILL.md`'s State & resume section, add the anchor rule in
  the same wording family as survey-corps/war-machine — resolve the main checkout via
  `git rev-parse --path-format=absolute --git-common-dir`; never the invoking worktree's
  `.claude/` — and pass an anchored `--campaign` in every `campaign-ledger.mjs` invocation
  example. In `skills/war-machine/war-pipeline-structure.test.sh`, add a criterion adjacent to the
  survey+machine anchor criterion asserting `skills/war-campaign/SKILL.md` states
  `--git-common-dir` (existing case-sensitive `has` helper — the flag literal is case-stable)
  AND the `main checkout` prose rule via a CASE-INSENSITIVE match (a `has_i` variant using
  `grep -qiF`, or an inline `grep -qi`) — the recorded sentence-case false-negative class: a
  benign re-casing of the SKILL prose must not false-negate the drift guard (red-team fix
  2026-07-16; the existing survey+machine criterion inherits the same fragility — out of this
  plan's footprint, noted for a follow-up) (End state 6).
  In `docs/adr/0016-campaign-compaction-survival.md`, add a dated amendment: the Decision's
  hook half gains the anchored scan root and the stranded-state warning; the Consequences note
  that the 2026-07-03 spec's "campaigns live under the session's project dir" assumption is
  superseded — campaign state lives under the main checkout's `.claude/campaigns` because
  session worktrees are disposable (`/aftermath` reaps them) and campaign state must outlive
  any one session (End state 7).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 1: Version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump the four version slots in lock-step to the next free patch above the live
  base — `plugin.json` `version`, `marketplace.json` `metadata.version` and
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, no badge).
  `skills/war/assets/version-slots.test.mjs` is the arbiter (End state 8).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Manual compaction smoke (spec validation criterion 8): with the live campaign in the main
  checkout and no worktree symlink/copy present, `/compact` + resume from a session-worktree
  Lead re-injects the brief · why deferred: requires an interactive session compaction, which no
  task gate can execute · runner: operator, at the first compaction of the next campaign-Lead
  session on the released plugin.
- Operator cleanup of stranded/duplicated local state (spec §8 checklist: the all-landed
  `2026-07-12-memory-mined-debt` dir in `survey-corps-06a1c3`, the byte-identical campaign copy
  in `sleepy-kepler-e49e59`, the symlink in `survey-corps-8cc638`) · why deferred: uncommitted
  local machine state — no commit can land it · runner: operator, immediately after the release
  is installed.

## Notes / conscious deviations

- The behavioral flip (scan root cwd → main checkout) is locked by the new hook test cases
  rather than an OLD-absent doc gate: the only doc surface carrying the old contract is
  `docs/specs/2026-07-03-campaign-compaction-survival.md`, which stays untouched by design
  (point-in-time record; the ADR 0016 amendment carries the supersession).
- The stranded-state warning deliberately does not inject a stranded ledger's state body —
  injecting would legitimize the wrong placement and reintroduce the latest-by-mtime race
  between duplicated ledgers.
- Any version literal in this plan or its spec is non-authoritative; Phase 2 resolves the next
  free patch from the live slots at land time.

## Open decisions

- None.
