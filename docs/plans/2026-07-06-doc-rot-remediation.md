# Doc-rot remediation — restore audited surfaces to code-truth

Source: session-verified doc-rot inventory (2026-07-06 `/init` reader sweep over ADRs, the WAR engine,
hooks, the memory CLI, and companion skills); no standalone spec — converted to war shape by
`/war-strategy`. Every item below was code-verified against master in the authoring session.

## Commander's Intent

- Purpose: The spec-of-record and operator-facing docs have drifted from what the code provably does.
  Restore every audited surface to code-truth and make the fixes rot-resistant, so contributors and
  WAR's own agents can trust the prose again.
- Method: Small, file-disjoint corrections grounded in the session's code-verified findings. Prefer
  class fixes over instance fixes — a version-less status line instead of a bumped literal; a
  drift-guard test pinning agent frontmatter to war-config defaults instead of a one-time edit.
  Include only the two behavior-adjacent code cleanups already verified (the dead `warned` variable;
  the resolveGate `.claude/` exclusion, with the floor-mirror kept aligned). Never weaken an existing
  guard or test.
- End state:
  1. `skills/war/references/design.md` header carries no version literal, and its §2/§8 role-model
     prose matches `war-config.mjs` DEFAULTS (worker = opus/max).
  2. `agents/war-worker.md` frontmatter model matches the war-config worker default, and a drift
     guard in `war-config.test.mjs` pins agent frontmatter models to DEFAULTS.
  3. `war-config.mjs` usage string documents `--resolve-gate`, test-pinned.
  4. `resolveGate`'s `*.test.sh` discovery loop excludes `.claude/`, test-pinned, and
     `assert-test-in-diff.sh`'s mirrored pattern and comment are verified aligned in the same diff.
  5. ADR-0011's status line reads `accepted` (dated), matching operating practice.
  6. lessons-learned `SKILL.md` and `references/migration.md` describe Node < 24 behavior as "every
     verb exits non-zero; callers fail open" — doc-contract suite stays green.
  7. `hooks/warn-bash-write-scope.sh` has no dead `warned` variable and the dead-var grep guard
     covers it; `hooks.json` registers both Bash hooks in one matcher block; all hook suites green.
  8. The clean-audit-series roadmap is renamed `2026-07-02-clean-audit-series-roadmap.md` under
     `docs/roadmaps/`, its 3 inbound links (in `docs/plans/`) updated, zero broken references
     repo-wide.
  9. Version bumped across all four release slots — relational, next free patch resolved at land
     time.

## Build order (for /war)

1. Phase 1 — Doc-truth + hygiene (6 file-disjoint tasks, no deps)
2. Phase 2 — Release

## Phase 1 — Doc-truth + hygiene

### Task 1: design.md truth pass

- Files: `skills/war/references/design.md`
- Plan slice: Rewrite the `**Status:**` opening sentence (currently `**Status:** v0.4.1. …`) to a
  version-less status — keep the Gas Town lineage sentence, state that the shipped version lives in
  `.claude-plugin/plugin.json`. Correct §2's "**Workers** = worktree-isolated `Agent`s (sonnet)" and
  §8's "`war-worker`/fix/`war-refiner` = sonnet; `war-auditor` = opus" so per-role model claims defer
  to `war-config.mjs` DEFAULTS as the authority (de-literalize: name the authoritative construct
  rather than restating model names that rot; where a concrete example helps, mark it as an example
  of the current defaults, worker = opus/max). Sweep the rest of the file for other model/version
  literals presented as current defaults; leave clearly-historical prose intact. The stale header is
  the anchor: locate by the `**Status:**` construct, not a line number.
- requiresTest: false
- deps: []
- target repo: superproject

### Task 2: war-config surface truthing

- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`,
  `agents/war-worker.md`, `skills/war/assets/assert-test-in-diff.sh`,
  `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: (a) The CLI usage string (the `usage: war-config.mjs (--preset <name> | <path> |
  --stdin) [--fill-defaults]` write site) gains the implemented `--resolve-gate <cmd>` form; add a
  test pinning the usage text to the implemented verb set. (b) `resolveGate()`'s appended `*.test.sh`
  discovery loop gains a `.claude/` path exclusion alongside the existing `node_modules`/`.git`
  exclusions (a repo-root gate run currently executes ~100 stale duplicate suites from
  `.claude/worktrees/`); add a test pinning the exclusion. In the same diff, re-verify
  `assert-test-in-diff.sh`'s default pattern and its mirror comment stay byte-aligned with the
  resolved gate's discovery set (ADR 0006 floor/gate alignment — the floor diffs task branches, but
  the mirrored expressions must not drift). (c) `agents/war-worker.md` frontmatter `model: sonnet` →
  `model: opus` (the effective default, `DEFAULTS.agents.worker.model`); add a drift-guard test in
  `war-config.test.mjs` asserting each `agents/war-{worker,auditor,refiner,servitor}.md` frontmatter
  `model:` equals the corresponding `DEFAULTS.agents.<role>.model`, so frontmatter can never silently
  disagree with the config authority again.
- requiresTest: true
- deps: []
- target repo: superproject

### Task 3: ADR-0011 status truth

- Files: `docs/adr/0011-campaign-stack-and-plow-branch-model.md`
- Plan slice: The `**Status:**` line (currently `proposed (design ratified in the
  war-companion-skills grill; implementation pending — see the spec)`) becomes `accepted`, dated
  2026-07-06, noting stack-and-plow shipped in `/war-campaign` and is treated as operating doctrine
  by later ADRs (0016 references it as the campaign model). Body untouched.
- requiresTest: false
- deps: []
- target repo: superproject

### Task 4: lessons-learned Node<24 wording

- Files: `skills/lessons-learned/SKILL.md`
- Plan slice: The migrate-mode prerequisite bullet "on older Node every verb no-ops with a message"
  becomes accurate to the code: every verb exits non-zero with a one-line message and does nothing
  (callers fail open; no partial migration) — matching `references/migration.md`, which already
  states the exit-non-zero behavior and needs no change (verified in authoring). Confirm
  `lessons-learned-doc-contract.test.mjs` pins none of the old phrasing (grep-verified in authoring:
  it does not; leave it untouched).
- requiresTest: false
- deps: []
- target repo: superproject

### Task 5: hooks hygiene

- Files: `hooks/warn-bash-write-scope.sh`, `hooks/hooks.json`,
  `hooks/validate-worktree-scope.test.sh`
- Plan slice: Remove the dead `warned` variable from `warn-bash-write-scope.sh` (assigned twice,
  never read — the hook is advisory and always exits 0; behavior unchanged). Extend the existing
  dead-variable grep guard in `validate-worktree-scope.test.sh` to also cover
  `warn-bash-write-scope.sh` so the class stays closed. Consolidate `hooks.json`'s two separate
  `Bash` matcher blocks into one block carrying both hooks — `validate-auditor-git.sh` first, then
  `warn-bash-write-scope.sh` (registration order preserved; behavior-equivalent, removes the
  one-hook-looks-unregistered misread). All hook suites must stay green.
- requiresTest: true
- deps: []
- target repo: superproject

### Task 6: roadmap rename

- Files: `docs/roadmaps/2026-07-02-clean-audit-series.md` (renamed to
  `docs/roadmaps/2026-07-02-clean-audit-series-roadmap.md`),
  `docs/plans/2026-07-02-war-clean-handoff.md`, `docs/plans/2026-07-02-issue-422-nit-sweep.md`,
  `docs/plans/2026-07-02-variable-audit-roster.md`
- Plan slice: `git mv` the roadmap to the `-roadmap.md` suffix (the convention the other three
  roadmaps follow), update the 3 inbound references (the only ones repo-wide, verified in
  authoring: a relative markdown link in war-clean-handoff, a backticked path in issue-422-nit-sweep,
  a relative markdown link in variable-audit-roster). Post-change, a repo-wide grep for the old
  basename must return zero hits outside git history.
- requiresTest: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 7: version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump the patch version across all four slots — `plugin.json` `version`,
  `marketplace.json` `metadata.version` and `plugins[0].version`, and the `README.md` `## Status`
  line (replace-in-place, no badge). Resolve the target version relationally at execution time: read
  the current version from the slots and take the next free patch (do not trust any literal in this
  plan). The Status blurb summarizes the doc-rot round in general terms and must not quote the old
  roadmap filename (a rename's own absence check trips on release blurbs that restate the retired
  token).
- requiresTest: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

None

## Notes / conscious deviations

- No standalone spec exists for this plan: it was converted by `/war-strategy` from a
  session-verified inventory (2026-07-06 `/init` reader sweep); every item was code-verified in the
  authoring session. Ratify this deviation in `/red-team`.
- `requiresPackaging` is omitted on all tasks: the repo contains no Dockerfiles, so the packaging
  floor no-ops.
- Task 1 deliberately ships no prose drift-guard for design.md: a guard would live in
  `war-config.test.mjs` (Task 2's file — same-file collision) and would grep prose, which is brittle;
  the version-less rewrite is the class fix.
- `skills/war-help/SKILL.md`'s "on older Node they no-op and the run is unaffected" was reviewed and
  is accurate at the feature/caller level (callers fail open) — deliberately out of scope for Task 4.
- Pure-docs tasks (1, 3, 4, 6) should be proposed with solo `{ lens: 'correctness', depth:
  'neighbors' }` rosters at decompose, per the war SKILL.md pure-docs guidance; the human approves at
  the gate.

## Open decisions

None — scope, the roadmap rename (with inbound-link updates), and the version-less design.md header
were resolved in the authoring interview; the Commander's Intent block above is operator-confirmed
verbatim.
