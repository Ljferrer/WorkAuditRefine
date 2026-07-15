# Lessons-learned repo-projection integrity — archive re-renders with `--repo`, safe-swap verify gains a repo-row completeness hard fail

Plan file: `docs/plans/2026-07-14-lessons-learned-repo-projection-integrity.md`
Source spec: docs/specs/2026-07-14-lessons-learned-repo-projection-integrity-design.md
Issues addressed: #891
Stacks on: campaign-decided (ADR 0011 stack order); the 2026-07-14 siblings share only the four
release slots with this plan — see Build order contention.

## AI-Commander's Intent

- **Purpose:** Two coupled defects let a `/lessons-learned` housekeeping pass swap a projection
  that has silently lost every repo-root lesson row (#891): the Phase 5 archive bullet in
  `skills/lessons-learned/SKILL.md` invokes `war-memory archive --local "$STAGING"` without
  `--repo`, and `cmdArchive`'s trailing `cmdRenderIndex(argv)` re-renders from the roots argv
  names — so on a repo-adopted store the staged `MEMORY.md` drops every `[repo]` row (observed
  2026-07-13: ~24 KB / 144 lines → ~4 KB / 30 lines); and `do_verify` in
  `skills/lessons-learned/assets/safe-swap.sh` cannot detect the loss because its row→file hard
  fail deliberately excludes `[repo]` rows (the load-bearing Rule 2) and it is never told about a
  repo root. Close both: thread `--repo` through the Phase 5 archive invocation, and teach the
  single shared `do_verify` gate a repo-completeness hard fail driven by the `CLAUDE_MEMORY_REPO`
  env convention `resolveRoots` already honors — so `verify` AND the `commit` pre-swap re-verify
  both refuse a wholesale-dropped projection.
- **Method:** Exactly the spec's resolved design tree — **env-var threading, zero new argument
  parsing** on `safe-swap.sh`; a **zero-`[repo]`-row wholesale-drop detector** (per-slug
  reconciliation is a named non-goal); **fail-closed on presence, fail-open on absence** (the hard
  fail fires only when `CLAUDE_MEMORY_REPO` is set, resolves to a directory, and that directory
  holds ≥ 1 top-level `*.md` hot lesson excluding `MEMORY.md` — so a local-only store, an unset
  env, and the post-evict emptied repo root are all skips, and the evict flow's deliberate
  local-only re-render stays untouched); **Rule 2 survives byte-intact** (the `grep -v '\[repo\]'`
  exclusion feeding the row→file hard fail is proven load-bearing by temp-break1 — the new check
  is a *different, additive* predicate over the same marker); **one root-resolution convention**
  (reuse the exact `CLAUDE_MEMORY_REPO` name `resolveRoots` reads — never a second channel);
  **legacy invocations byte-identical** (env unset ⇒ zero new output; existing fixtures pass
  unchanged). Script and prose move together (the standing-instruction drift lesson): the same
  commit threads the SKILL.md Phase 5 archive command, the Phase 6/7 command-block
  `CLAUDE_MEMORY_REPO="$REPO_ROOT"` prefixes (without which the new check never fires in a real
  pass), the Phase 6 "It checks:" fourth clause, the widened Common-mistakes bullet, the
  `safe-swap.sh` header comment, and doc-contract locks mirroring the in-file precedent that
  already guards the Phase 5 *render* bullet's `--repo`. All new shell-test arms are bash-3.2-safe
  and cwd-independent (mktemp fixtures, absolute paths — the file's existing discipline), and the
  suite sanitizes ambient `CLAUDE_MEMORY_REPO` before the pre-existing cases (the migration
  playbook's env preamble exports it). Every grep sweep is a floor with a mandatory manual
  same-scope survey recorded in the commit-body `Survey:` block. Every mapped test arm takes the
  mentally-delete check (delete the branch it pins — the arm must fail).
- **End state:**
  1. `bash skills/lessons-learned/assets/safe-swap.test.sh` exits 0 with the new
     repo-completeness case counted in its summary; the file unsets/empties `CLAUDE_MEMORY_REPO`
     after the `SCRIPT` guard and before CASE 1; CASES 1–6, CASE 4's commit path, and all three
     temp-break proofs are byte-untouched and green.
  2. **FAIL arm** (spec criterion 3), three independent assertions: a staging dir whose
     `MEMORY.md` carries zero `[repo]` rows, verified with `CLAUDE_MEMORY_REPO` pointing at a
     directory containing one top-level `*.md` hot lesson, (i) exits nonzero, (ii) prints a
     `FAIL` line naming the repo root (with the re-render recovery hint), and (iii) prints the
     `VERIFY: FAIL` trailer — the trailer is the no-premature-death proof (a `set -e` death
     before the report tail also exits nonzero) and, with (i), catches a FAIL line whose
     `FAILED=1` was forgotten. This arm IS the rule-fires proof — no temp-break script copy
     (spec design tree).
  3. **PASS arm** (criterion 4): the same invocation after adding one `[repo]`-marked row
     (CASE 1's `gamma` fixture pattern) exits 0 and prints `VERIFY: PASS` with no `FAIL` line.
  4. **WARN arm** (criterion 6): `CLAUDE_MEMORY_REPO` set to a nonexistent path on an
     otherwise-clean dir exits 0 with a `WARN` line naming the path — never a `FAIL`.
  5. **Empty-repo-root skip arm** (criterion 8): `CLAUDE_MEMORY_REPO` pointing at a directory
     holding only `archive/` contents plus a `MEMORY.md` file (no other top-level `*.md`) does
     not fail — the evict-adjacent state is a skip, proving the hot-lesson predicate is
     load-bearing AND exercising both the non-recursion and the `MEMORY.md` exclusion in one
     fixture.
  6. **Legacy-invisibility arm** (criterion 5): the FAIL-arm fixture with `CLAUDE_MEMORY_REPO`
     unset exits 0 and emits no repo-completeness output line — env unset is a silent skip,
     legacy output byte-identical.
  7. **Commit is gated** (criterion 7): `commit` with the env var threaded and a
     zero-`[repo]`-row staging dies with `commit: staging FAILED verification` and leaves the
     live dir untouched — proving the check landed inside the single shared `do_verify`, not in
     the `verify` subcommand branch.
  8. `grep -n 'CLAUDE_MEMORY_REPO' skills/lessons-learned/assets/safe-swap.sh` matches inside
     `do_verify` and the check appears exactly once (criterion 2); the Rule-2
     `grep -v '\[repo\]'` exclusion and every existing check are byte-unchanged; the `recover`
     subcommand's "Re-verify with:" hint echo names the optional `CLAUDE_MEMORY_REPO` prefix so
     a post-crash operator is not steered into a repo-blind verify.
  9. `grep -n 'archive --local "\$STAGING" --repo "\$REPO_ROOT"' skills/lessons-learned/SKILL.md`
     matches the Phase 5 Archive command block, accompanied by the same
     omit-only-when-no-repo-root-resolves conditional prose the render bullet carries, plus a note
     that archive's trailing re-render now walks both roots (criterion 1).
  10. SKILL.md Phase 6 "It checks:" prose names the repo-completeness hard fail as the fourth
      check, and the Phase 6 `verify` and Phase 7 `commit` command blocks carry the conditional
      `CLAUDE_MEMORY_REPO="$REPO_ROOT"` prefix (criterion 10); the Common-mistakes `--repo` bullet
      covers the archive invocation and the new verify backstop while retaining the
      evict-exception sentence and the exact ``silently drops every `[repo]` row`` phrase an
      existing doc-contract lock anchors on (criterion 11).
  11. `node --test skills/lessons-learned/lessons-learned-doc-contract.test.mjs` green: every
      pre-existing lock untouched and passing, plus new locks pinning the Phase 5 archive
      `--repo`, the Phase 6 and Phase 7 `CLAUDE_MEMORY_REPO` prefixes, and the fourth "It checks:"
      clause (case-tolerant, mid-sentence anchors).
  12. The backing lesson
      `docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md`
      carries a FIXED-phase resolution note (existing provenance-line convention), and
      `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  13. No hook, engine (`workflow-template.js`), or `skills/_shared/war-memory.mjs` file changes
      (spec §5); full suites green at each phase's land; all four release slots bumped together to
      the next free patch (Phase 2), `skills/war/assets/version-slots.test.mjs` green.

## Build order (for /war)

- **Contention (verified):** campaign plan 1
  (`docs/plans/2026-07-14-gate-evidence-and-prose-truth.md`) touches `skills/war/**`,
  `agents/war-refiner.md`, `CONTEXT.md`, `docs/adr/`, `docs/specs/` sweep targets, one landed
  2026-07-12 plan, and two `docs/learnings/` lessons (`plan-bullet-replacement-…`,
  `refiner-dispatched-gate-…`); campaign plan 2
  (`docs/plans/2026-07-14-red-team-fallback-and-anchor-hygiene.md`) touches `skills/red-team/**`.
  Neither touches `skills/lessons-learned/**`, `skills/_shared/**`, nor this plan's learnings
  file — the only shared surface is the four release slots (three files), serial by stack order
  and resolved from the live tip at land time.
- **Why one content phase, one task:** the spec records no internal ordering ("a single coherent
  fix"; carve only for parallelism). The script, its shell test, the SKILL.md prose, and the
  doc-contract locks are same-commit couplings — the gate check without the prose threading never
  fires in a real pass, and the prose without the gate is an unenforced directive — so splitting
  them would ship each half a wave naked. No deps, no waves.

1. **Phase 1 — Repo-projection integrity (#891)** (Task 1.1, single task)
2. **Phase 2 — Release** (four version slots, lands last)

## Phase 1 — Repo-projection integrity (#891)

### Task 1.1: `do_verify` repo-completeness hard fail + `--repo` archive threading + prose/lock lock-step

- Files: `skills/lessons-learned/assets/safe-swap.sh`, `skills/lessons-learned/assets/safe-swap.test.sh`, `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, `docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md`
- Plan slice:
  - **`safe-swap.sh` — the repo-completeness check, inside `do_verify` only** (placement within
    `do_verify` is the implementer's call — after the budget block or adjacent to the other hard
    checks; both `verify` and `commit` route through `do_verify`, so one landing site gates both):
    - Read `repo="${CLAUDE_MEMORY_REPO:-}"` (set-u-safe; the exact variable `resolveRoots` in
      `skills/_shared/war-memory.mjs` reads as the `--repo` fallback — never a second convention).
    - **Empty/unset → skip silently**: emit nothing; legacy output byte-identical.
    - **Set but not a directory → `WARN` line naming the path**, never `FAILED=1`
      (misconfiguration signal; the store may still be internally consistent). The existence test
      is a plain `[ -d "$repo" ]` — never `abspath`, whose `die` exits 2 on a missing dir and
      would turn the WARN path into a hard death.
    - **Set and a directory →** count top-level hot lessons with the script's existing listing
      idiom (`ls -1 *.md` in `$repo` excluding `MEMORY.md`; non-recursive, so `archive/` is
      naturally excluded — cold lessons never arm the check; filename-level count, per the spec's
      listing idiom). If the count is ≥ 1 and the **row-scoped** `[repo]`-row count over `$mem`
      is 0 — mirror Rule 2's own pipe (`grep -E '^\|' | grep '\[\[' | grep -c '\[repo\]'`), never
      a whole-file `grep -c` (a non-row literal `[repo]` in a surviving local row's summary or in
      prose would silently defeat a whole-file detector — the exact silent-pass direction the
      check exists to close): emit a `FAIL` line that names the repo root and hints the recovery
      (re-render with `render-index --local <staging> --repo <repo root>`), set `FAILED=1`.
      Otherwise emit an `ok` line (worker owns the exact phrasing — semantics, not bytes; e.g.
      the spec's `ok    [repo] rows present for a populated repo root`).
    - **Implementation notes, both load-bearing under `set -euo pipefail`:** guard the two
      counting pipelines with the script's existing `|| true` idiom — `grep` exits 1 on zero
      matches (under `pipefail` the row-scoped pipe is nonzero whenever any stage matches
      nothing) and `ls -1 *.md` errors on an empty glob; either would kill `verify` on exactly
      the FAIL-triggering input, before it prints `VERIFY: FAIL`. Declare every new variable in
      `do_verify`'s existing `local` list — the leaked `mem` regression CASE 4 pins is exactly
      the un-`local`-ed-variable failure mode.
    - **`recover` hint threading (one line):** the `recover` subcommand's
      `Re-verify with: safe-swap.sh verify …` echo gains a generic mention of the optional
      `CLAUDE_MEMORY_REPO=<repo root>` prefix (static hint text only — `recover` cannot resolve
      a repo root itself), so a post-mid-swap-crash operator is not steered into a repo-blind
      verify. This is the token sweep's only actionable match outside the Phase 6/7 blocks.
    - **Untouched, verified in review:** argument parsing, the `verify`/`commit`/`stage`/`recover`
      dispatch, the Rule-2 `grep -v '\[repo\]'` exclusion (temp-break1 stays the proof it is
      load-bearing), Rule 1's archive-aware `resolves_in`, and the budget checks.
    - **Header comment, same commit** (comments lag rewritten code — grep old terms in the same
      diff): the `Subcommands:` block's `verify` line mentions the optional `CLAUDE_MEMORY_REPO`
      input and the repo-completeness check.
  - **`safe-swap.test.sh` — sanitation + one new case block** (bash-3.2-safe, cwd-independent:
    mktemp fixtures via the existing `mkmem` helper, absolute paths, no globstar/associative
    arrays — the file's stated discipline):
    - **Ambient-env sanitation:** after the `SCRIPT` guard, before CASE 1, `unset`
      `CLAUDE_MEMORY_REPO` — the migration playbook's env preamble
      (`skills/lessons-learned/references/migration.md`) exports it, and a developer's ambient
      export must not inject the new check into the pre-existing cases (the spec's ratified
      test-sanitization call). The sanitation is load-bearing: CASES 4/5/6 build
      zero-`[repo]`-row projections and assert success, so an ambient populated repo root reds
      all three without it.
    - **New case — repo completeness**, arms mapped one-to-one to End state 2–7: build a `mkmem`
      staging dir with a local hot lesson and a projection containing **no** `[repo]` rows, plus a
      second mktemp dir standing in for the repo root holding one hot lesson file. FAIL arm
      (`CLAUDE_MEMORY_REPO=<repodir> bash "$SCRIPT" verify <dir>` → the three separate assertions
      of End state 2: nonzero exit; `FAIL` line mentioning the repo root; `VERIFY: FAIL`
      trailer); PASS arm (`add_row` a `gamma`-style `[repo]`-marked row, CASE 1's exact fixture
      pattern → exit 0 + `VERIFY: PASS`, no `FAIL` line); WARN arm (nonexistent path → exit 0 +
      `WARN` line, no `FAIL`); empty-repo-root skip arm (repo dir holding only `archive/` content
      plus a `MEMORY.md` file → no fail — one fixture exercising non-recursion AND the
      `MEMORY.md` exclusion, which is otherwise defensive-only today: `docs/learnings/` carries
      no `MEMORY.md`, verified); legacy-invisibility arm (env unset on the FAIL-arm fixture →
      exit 0, no repo-completeness output line); commit-gate arm (reuse CASE 4's stage/commit
      wrapper pattern: a staged store whose staging has zero `[repo]` rows, `commit` **with the
      env var** pointing at the populated repo dir → nonzero exit, `NOT swapping` message, live
      dir untouched — the arm that reds if the check lands anywhere but the shared `do_verify`).
      All fixtures use absolute mktemp paths via the existing helpers; forbidden bash-4-isms
      stay out (no globstar, no associative arrays, no `${var,,}`, no `mapfile`).
    - Mentally-delete per arm: drop the check → FAIL arm reds; drop the hot-lesson predicate →
      skip arm reds; drop the dir-exists branch → WARN arm reds; make unset non-silent → the
      invisibility arm reds; move the check out of `do_verify` → the commit-gate arm reds.
    - **Header comment, same commit:** the Rule 1/Rule 2 header roster gains the new rule's
      one-liner so the file's own map matches its cases.
  - **`skills/lessons-learned/SKILL.md` — four surfaces, same commit as the script:**
    - **Phase 5 "Archive" bullet:** the command becomes
      `war-memory archive --local "$STAGING" --repo "$REPO_ROOT" <slug>...` with the same
      when-the-repo-root-resolves conditional prose the render bullet already carries (omit only
      when no repo root resolves); note in the bullet that archive's trailing re-render now walks
      both roots, so the staged projection keeps its `[repo]` rows even if the pass dies before
      the explicit render step.
    - **Phase 6 block:** prefix the verify invocation with `CLAUDE_MEMORY_REPO="$REPO_ROOT"`
      (same conditional), and extend the "It checks:" sentence with the fourth hard check — a
      populated repo root with a zero-`[repo]`-row projection is a hard fail.
    - **Phase 7 block:** the `commit` invocation gains the same `CLAUDE_MEMORY_REPO="$REPO_ROOT"`
      prefix (commit re-verifies staging itself). For both blocks the prose treats `$REPO_ROOT`
      as the Phase-0-detected repo root, **re-resolvable in a fresh shell** — each command block
      runs in its own shell invocation, so the prefix must never assume live shell state; same
      conditional posture as the render bullet.
    - **Common mistakes, the "Dropping `--repo` from the Phase 5 render…" bullet:** widen to
      cover the archive invocation and note the verify gate now backstops the mistake when the
      repo root is threaded. **Two anchors are frozen:** the evict-exception sentence stays
      exactly as is (a doc-contract lock asserts the evict re-render is local-only by design),
      and the ``silently drops every `[repo]` row`` phrase survives the rewording (an existing
      doc-contract lock regex-anchors it).
  - **`lessons-learned-doc-contract.test.mjs` — new locks, semantics not bytes** (the worker owns
    phrasing; the plan-bullet byte-literal trap is the recorded failure mode): mirror the in-file
    precedent lock that guards the Phase 5 *render* bullet's `--repo` (same defect class — #891
    IS that defect on the archive bullet). New locks: (a) the Phase 5 archive command line carries
    `--repo` (anchor on the archive-command token, not the render line — the existing render lock
    anchors on `render-index --local "$STAGING"` and must keep matching its own line); (b) the
    Phase 6 verify command line carries the `CLAUDE_MEMORY_REPO` prefix; (c) the Phase 7 commit
    command line carries it too; (d) the Phase 6 "It checks:" sentence names the
    repo-completeness hard fail (case-tolerant, mid-sentence anchor — the
    prompt-only-clause grep-guard lesson). **Anchor distinctness is binding:** lock (a)'s needle
    must match the archive command line specifically and not the render line (an
    `archive --local "$STAGING"`-class token — the render line carries
    `render-index --local "$STAGING"` and must keep matching its own existing lock), and locks
    (b) and (c) carry separate needles for the verify-invocation and commit-invocation lines —
    one lock that passes when either block has the prefix would let the other block rot. Whole
    file green proves every pre-existing lock — including the evict local-only lock and the
    Common-mistakes phrase lock — stays intact; never state a lock count (counts stale).
  - **Backing-lesson resolution note:** append the FIXED-phase provenance note to
    `docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md`
    (the existing `FIXED phase …` convention in sibling lessons; body note + provenance line, no
    frontmatter surgery beyond the convention). Redaction lint must stay clean.
  - **Token sweep 1 (verify/commit invocations):** `grep -rn 'safe-swap.sh'
    skills/lessons-learned/` — handle every match: each `verify`/`commit` invocation site must
    either thread `CLAUDE_MEMORY_REPO` or be a documented non-gate mention. Known matches at
    survey base, pre-adjudicated: SKILL.md Phase 6 + Phase 7 command blocks (THREAD — edited
    above); the `recover` subcommand's own "Re-verify with:" echo inside `safe-swap.sh` (THREAD
    the generic prefix mention — the hint-threading bullet above); Phase 1 `stage` block (no
    verify — no threading); the cardinal-invariant `assets/safe-swap.sh` link, the Phase 2
    "defers to the central archive-aware safe-swap verify" prose, the Phase 5 "safe-swap treats
    it as resolved" prose, and the resume-table `recover` rows (non-gate mentions — disposition
    as accurate). **Grep is a completeness floor,
    not a ceiling — after the grep, hand-scan the same-scope titles and comments
    (`SKILL.md` phase headers and Common mistakes, `references/migration.md` — its
    `CLAUDE_MEMORY_REPO` export preamble makes ambient activation the desired
    fail-toward-completeness direction, and its evict flow never invokes the swap script, so
    expect zero-diff there; the `safe-swap.sh` header comment; the `safe-swap.test.sh` header
    comment) and list each straggler as a survey-derived correction in the commit-body `Survey:`
    block** (empty list stated, never implied).
  - **Token sweep 2 (archive invocations):** `grep -rn 'archive --local'
    skills/lessons-learned/` — handle every match; the Phase 5 command block is the sole known
    site at survey base (verified); any other `--local`-only archive example gains the same
    conditional `--repo`. Same floor-not-ceiling survey duty and `Survey:` block as sweep 1.
  - **Non-goals restated (spec §9):** no per-slug repo reconciliation (wholesale-drop detector
    only — a projection that lost *some* `[repo]` rows still passes, deferred until a
    partial-drop failure mode is observed); no `war-memory.mjs` change (`cmdArchive` already
    accepts `--repo` — only its invocation and the shell gate move); no change to the evict
    flow's deliberate local-only re-render or the migrate playbook; no new positional arguments
    or flags on `safe-swap.sh` — the env var is the sole channel. **Scope guard:** the `Files:`
    lists are exhaustive per task — a diff touching `skills/_shared/`, `hooks/`, or the engine
    is out-of-plan and auditor-flaggable.
- requiresTest: true (mapped evidence: the new repo-completeness case arms in
  `safe-swap.test.sh` plus the new doc-contract locks in `lessons-learned-doc-contract.test.mjs`,
  both in this diff. Floor satisfiability verified against the live floor script: `match_sh_suite`
  in `skills/war/assets/assert-test-in-diff.sh` matches any `*.test.sh` path outside
  `node_modules/`, `.git/`, and `.claude/` — the shell test qualifies — and the doc-contract
  `.test.mjs` also matches the floor's skills-scoped `.test.mjs` arm; the composed phase gate's
  unconditional shell-suite discovery loop and the `node --test` glob execute both suites.)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes a shipped skill's gate script, tests, and SKILL.md prose — users
  only receive it via a release. Bump all four release slots together to the **next free patch
  above the live integration base at land time** (never a resolved semver literal in this plan,
  per the /war-strategy §2 next-free-patch convention): `plugin.json` `version`,
  `marketplace.json` `metadata.version` AND `plugins[0].version`, and the `README.md` `## Status`
  line (replace-in-place, never emptied, no badge). Expected integration base: the working-branch
  tip after this plan's Phase 1 lands; the campaign siblings land ahead of this plan by stack
  order, so their bumps advance the base — version literals anywhere are non-authoritative.
  Standalone fallback: a run of this plan through plain `/war` resolves the next free patch from
  the four slots themselves. `skills/war/assets/version-slots.test.mjs` is the lock-step
  arbiter — a partial bump is a red test.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- **Live-pass confirmation on the real repo-adopted store:** the next `/lessons-learned`
  housekeeping pass observes the threading end-to-end — the Phase 5 archive step keeps `[repo]`
  rows in the staged projection before the explicit render, and the Phase 6/7 invocations carry
  the env prefix so the completeness check actually fires · why deferred: the SKILL.md threading
  is a prose directive executed by an agent — the doc-contract locks guard its *presence*, the
  shell arms prove the gate *mechanics* on fixtures; only a live pass proves the two compose on
  the operator's store · runner: operator of the next `/lessons-learned` run (fallback: a
  /red-team sandbox probe of this plan staging a fixture store through the full
  stage→archive→verify→commit sequence).
- **`--repo` on archive widens the archivable set (accepted residual):** with `--repo`,
  `cmdArchive`'s `bySlug` map includes repo-root hot lessons, so a Phase 5 slug typo matching a
  repo slug would `git mv` it into `docs/learnings/archive/` instead of erroring
  `no hot lesson` · why accepted: the Phase 3 action plan is operator-surfaced before Phase 5
  executes, archiving is a reversible move + note (never a delete), and `cmdArchive`'s
  concept-hub WARN still fires · runner/tripwire: the first observed wrong-root archive files a
  `war-followup` proposing root disambiguation on `cmdArchive` (e.g. `--root`); until then the
  residual is inert.
- **Partial-drop detection (deferred non-goal with tripwire):** the check is a wholesale-drop
  detector; a projection that lost some but not all `[repo]` rows still passes · why deferred:
  spec §9 — full row↔file reconciliation against the repo root (the repo-side mirror of the local
  Rule-2 check) waits for an observed partial-drop failure mode · runner/tripwire: any future
  housekeeping pass or issue reporting a partial `[repo]`-row loss files the reconciliation
  follow-up citing this plan and the backing lesson.

## Notes / conscious deviations

- **All calls below are AFK self-adjudicated (ADR 0014) — what an operator volley would have
  settled, with the ruling and its ground.**
- **Doc-contract locks added beyond the spec's §5 surface table** (adds
  `lessons-learned-doc-contract.test.mjs` to Task 1.1's Files). Ground: the surface table is a
  floor, and the in-file precedent lock exists because the Phase 5 *render* bullet's `--repo`
  rotted once already — #891 is the identical defect class on the archive bullet, and the Phase
  6/7 env prefixes are the wire without which the shell check never fires in a real pass;
  leaving them as unlocked prose re-creates the rot the spec is closing (spec criteria 1/10/11
  are otherwise hand-run greps — the locks mechanize them). No new file: the test already exists
  and already reads this SKILL.md.
- **WARN, empty-root-skip, legacy-invisibility, and commit-gate arms made required** (the spec's
  test-shape row marks WARN "optionally" and maps no arm to criteria 5/7/8). Ground: each arm
  mechanizes a numbered validation criterion, and the commit-gate arm is the only proof the check
  landed in the shared `do_verify` (pivotal constraint 1) rather than the `verify` dispatch
  branch — without it a wrong-placement implementation passes every other arm.
- **Backing-lesson FIXED note written in-task, not post-land** (spec §8 marks it optional / not
  gating). Ground: the sibling convention (the 2026-07-12 Floor-fixes lessons carry in-phase
  `FIXED phase …` notes) and the campaign's own predecessor (plan 1's Task 2.3 does its learnings
  notes in-task). Kept non-gating in spirit: it is a body/provenance note only, lint-clean.
- **One task, no parallel carve.** The spec permits carving by file disjointness "if parallelism
  is wanted" — declined: script + shell test are same-commit by test discipline, SKILL.md prose
  is same-commit by the script-and-prose-move-together design-tree row, and the doc-contract
  locks read that same prose. Four files, one cohesive unit, zero contention inside the phase.
- **requiresTest: true routed honestly, floor verified against the live script** — the mapped
  test is a `*.test.sh` shell suite; `match_sh_suite` in `assert-test-in-diff.sh` accepts any
  such path outside `node_modules/`/`.git/`/`.claude/` (read at survey base), so the floor is
  satisfiable by this diff without `--pattern`; the doc-contract `.test.mjs` independently
  satisfies the skills-scoped arm. Not a vacuous route: the arms are the plan's primary evidence.
- **Row-scoped `[repo]` predicate — a reversal of this drafter's round-1 whole-file ruling,
  forced by the grill's silent-pass argument (verified).** A surviving *local* row whose summary
  cell legitimately contains the literal `[repo]` (this campaign's own lessons about `[repo]`-row
  drops are the concrete class — the servitor will write one) would satisfy a whole-file
  `grep -c` even after every actual repo row dropped: a false PASS in exactly the direction the
  check exists to close. The row-scoped pipe mirrors the script's own established predicates
  (the two row extractors feeding `.ll_idx`/`.ll_local_idx` are both `grep -E '^\|'`-scoped) and
  resolves toward the spec design tree's authoritative wording ("zero **rows** carrying the
  `[repo]` marker") over the §4 mechanics shorthand (`grep -c` over `$mem`) — the
  resolve-toward-the-checkable-pair lesson. Residual: a local row's summary containing `[repo]`
  still counts as a repo row — the identical residual Rule 2 already carries (marker-in-row IS
  the ratified convention); accepted.
- **Set-e guards named in the slice** (`grep -c` exits 1 on zero; `ls -1 *.md` errors on an empty
  glob; new vars join `do_verify`'s `local` list) — the script's own CASE-4 regression comment
  records the un-`local`-ed-variable failure mode; naming these in the plan keeps a green-looking
  broken verify from shipping.
- **Ambient-env sanitation scoped to the test file, not the script** — the spec ratifies ambient
  `CLAUDE_MEMORY_REPO` activation as the desired fail-toward-completeness direction for real
  passes (the migration preamble export); only the test suite must be hermetic against it. The
  sanitation is one `unset` line, placed exactly where the spec says (after the `SCRIPT` guard,
  before CASE 1).
- **Two frozen anchors named for the Common-mistakes rewording** — the evict-exception sentence
  and the ``silently drops every `[repo]` row`` phrase are both regex-anchored by pre-existing
  doc-contract locks (verified at survey base); the slice freezes them so the widening cannot
  red a lock this plan does not own the intent to change.
- **`references/migration.md` excluded from `Files:` — read-only sweep target, zero-diff
  expected.** Its prose is anchored by pre-existing doc-contract locks (verified: the evict
  local-only re-render lock, the CLAUDE.md-pointer lock, the migrate-confirm/evict-justification
  lock, and the OLD-absent loop that reads both docs), and the evict re-render **must not** gain
  `--repo` — the local-only lock reds any accidental addition, which is the standing guard, not
  this plan's diff. Its `CLAUDE_MEMORY_REPO` export preamble is the ratified ambient-activation
  path (fail-toward-completeness) and stays byte-untouched.
- **Relative `CLAUDE_MEMORY_REPO` is an accepted residual — no normalization.** The value feeds
  only a `[ -d ]` test and a subshell `cd` for the listing, so a relative path resolves against
  the invoking cwd exactly as the shell would anywhere else; SKILL.md threads the
  Phase-0-detected `$REPO_ROOT`, absolute in practice, and every new test fixture uses absolute
  mktemp paths. Normalizing would add code for a caller shape no surface produces.
- **`recover` hint threading ruled IN (one static echo line)** — the token sweep's only
  actionable match outside the Phase 6/7 blocks: the restored-live-dir hint otherwise steers a
  post-crash operator into a repo-blind verify. `recover` cannot resolve a repo root, so the
  hint names the optional env prefix generically; hint text, not logic — no test pins it (the
  sweep + review cover an echo string; a lock on advisory prose inside the script would be
  guard-noise).
- **Sanitation deletion is CI-invisible — accepted, no self-check arm.** CI carries no ambient
  export, so removing the `unset` stays green there; in any shell WITH the export the breakage
  self-reports (CASES 4/5/6 red — the sanitation's own mentally-delete proof, stated in the
  slice). An in-file self-check assertion would be deletable alongside the `unset` itself, so no
  independent guard exists short of a second suite — declined as guard-theater.
- **Backstops-vs-Notes split (ADR 0017 posture):** the backstops section carries the three
  deferred *validations* — live-pass composition (named runner), archive-slug-typo widening
  (tripwire + follow-up route), partial-drop reconciliation (tripwire). The ambient-var
  mid-evict state and relative-path behavior are behavior residuals with nothing to
  defer-validate (the evict flow never invokes `safe-swap.sh` — spec §8; the relative form is
  cwd-consistent by construction), so they live here in Notes, not as backstop entries.
- **MEMORY.md exclusion in the hot-lesson count is defensive today and tested anyway** —
  `docs/learnings/` carries no `MEMORY.md` (verified; projections render into the local root
  only), but the exclusion is spec-pinned one-token insurance against a committed projection;
  folding a `MEMORY.md` file into the skip-arm fixture makes it exercised rather than
  defensive-untested, at zero extra arms. Count stays filename-level (the spec's listing
  idiom) — content-level classification is out of scope.
- **No lock counts, no suite counts, anywhere** — the doc-contract file grows; hardcoded counts
  stale (recorded lesson). "Every pre-existing lock green" is the assertion shape.
- **Sweep matches pre-adjudicated at survey base** (SKILL.md `stage`/prose/resume-table mentions
  non-gate; migration.md expected zero-diff; sole `archive --local` site is Phase 5) — listed in
  the slice so the worker re-verifies at the dispatch base instead of re-deriving, and so the
  auditor reads a zero-diff `references/migration.md` as dispositioned, not missed.
- **No CONTEXT.md term, no ADR** — spec §6/§7 record None ("repo-completeness check" is described
  in situ; the gate extension lives inside ADR 0015's two-root architecture).
- **requiresPackaging: false on both tasks** — meta-repo shell/prose/test changes; no Dockerfile
  in the footprint.
- **Anchors by named construct throughout** — `do_verify`, the Phase 5 Archive bullet, the
  `Subcommands:` header block, `resolveRoots`, `cmdArchive`, `match_sh_suite` — never line
  numbers (they rot across the serial merge queue).
- **Predecessor-consistency:** intent heading is `## AI-Commander's Intent` (AFK-drafted, ADR
  0014), matching the 2026-07-12 AFK set and the red-team-fallback sibling; campaign plan 1
  (gate-evidence-and-prose-truth) uses the operator `## Commander's Intent` heading — it had an
  operator conversion volley (its "Ratified decisions" section records it), this plan does not;
  both headings are recognized by extraction surfaces (ADR 0014). Tone/scope conventions match:
  bold Purpose/Method/End-state keys, `Stacks on:` line, mentally-delete test discipline,
  comment/code lock-step, sweep + commit-body `Survey:` block, directive-form trailing release
  phase, backstops with named runners.
- **Grill round (22 questions, AFK self-adjudicated — deltas not already covered above):**
  - **Q1 hot-lesson count:** filename-level, exclusion defensive-but-tested — own bullet above.
  - **Q2 predicate scope:** REVERSED to row-scoped — own bullet above (the one substantive
    round-1 correction this grill forced).
  - **Q3/Q14 no-premature-death + partial-deletion redness:** the FAIL arm's three assertions
    are separate and named in End state 2 and the slice; the `VERIFY: FAIL` trailer is the
    proof the `|| true` guards held, and RC+trailer together catch a FAIL line whose `FAILED=1`
    was forgotten (weak-assertion lesson).
  - **Q4 `local` declaration:** already-covered round 1; the slice names the CASE-4 leaked-`mem`
    regression class explicitly.
  - **Q5 WARN path:** `[ -d "$repo" ]` plain test pinned in the slice; `abspath` named as the
    forbidden form (its `die` exits 2 on a missing dir — verified).
  - **Q6 relative env value:** accepted residual — own bullet above.
  - **Q7 migration.md:** excluded from Files, read-only sweep — own bullet above (grill's lock
    list corrected against the file: the migration.md-reading locks are the evict local-only,
    CLAUDE.md-pointer, and migrate-confirm locks plus the OLD-absent both-docs loop; the
    `test -f` pre-flight lock reads SKILL.md).
  - **Q8 recover hint:** threaded, one static echo line — own bullet above.
  - **Q9 fresh-shell `$REPO_ROOT`:** re-resolvable posture added to the Phase 6/7 slice bullet.
  - **Q10 sanitation blast radius:** load-bearing note in the slice (CASES 4/5/6 red under an
    ambient populated root); CI-invisibility accepted, no self-check arm — own bullet above.
  - **Q11 commit-FAIL arm:** already-covered round 1; the arm carries the env var explicitly.
  - **Q12 archive-bullet lock:** the anchor-distinctness sentence pins a needle matching the
    archive line specifically — criterion 1 has a mechanical home.
  - **Q13 per-block locks:** separate needles for the Phase 6 and Phase 7 invocation lines,
    binding — one-lock-passes-on-either named as the rejected shape.
  - **Q15 fixture disciplines:** forbidden constructs enumerated in the slice (no globstar, no
    associative arrays, no `${var,,}`, no `mapfile`); `mkmem`/`add_row`/gamma reuse stated.
  - **Q16 release phase:** already-covered — directive form, no semver literal anywhere.
  - **Q17 narrative confinement + lesson note:** already-covered — the observed-shrink numbers
    live only in Purpose; the FIXED note is in-task (round-1 ruling c).
  - **Q18 recovery-hint text:** the FAIL line's re-render hint (`render-index --local <staging>
    --repo <repo root>`) is pinned in the slice — the in-flight-run migration story.
  - **Q19 one task incl. doc-contract:** already-covered — the lock and the prose it grips are
    same-task by construction.
  - **Q20 requiresTest/requiresPackaging:** already-covered; `requiresPackaging: false` is an
    explicit per-task decision (no Dockerfile in the footprint), not an inherited default.
  - **Q21 backstop split:** enumerated — own bullet above.
  - **Q22 scope creep:** the non-goals bullet now states Files-exhaustiveness and names
    `skills/_shared/`/`hooks/`/engine touches as auditor-flaggable out-of-plan.
- **Contention (this campaign):** shared with both siblings — only the four release slots
  (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` two slots, `README.md`),
  serial by stack order, resolved from the live tip at land time. Plan 1's two `docs/learnings/`
  edits are different lessons from this plan's one — disjoint paths, no edge needed beyond the
  release-slot serialization.

## Open decisions

None — the spec's resolved design tree settled the channel (env var over args), the predicate
(zero-row wholesale-drop with the three-condition arming rule), the WARN/skip semantics, the
evict compatibility shape, and the test shape; the drafter's latitude (lock additions, required
arms, in-task lesson note, single-task carve, predicate scoping) and all 22 adversarial-grill
questions are self-adjudicated in Notes per ADR 0014 (AFK — no operator volley; conservative
rulings where spec + code underdetermine; one round-1 ruling reversed on verified evidence — the
row-scoped predicate).
