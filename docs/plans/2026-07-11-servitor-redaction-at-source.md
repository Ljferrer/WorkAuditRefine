# Servitor redaction at source — repo-relative locate-cues on both prompt surfaces

Source spec: docs/specs/2026-07-11-servitor-redaction-at-source-design.md
Issues: **Closes #726.** Scope class: prompt-prose fix inside the existing
prompt-surface-split + Gate-2 doctrines — two production prompt surfaces edited, one
drift-guard registry row added, the redaction lint (`skills/_shared/war-memory.mjs`
family) deliberately **untouched and asserted unchanged**.

## Commander's Intent

- Purpose: Stop the servitor from writing absolute checkout paths (paths rooted at a
  home directory, e.g. the `/Users/...` shapes the `home-path` lint pattern catches)
  into lesson bodies in the first place. The D3 VERIFY-ON-WRITE locate-cue directive
  gives no format constraint on `<path>`, so every `type: project` lesson naming an
  inspected file trips the fail-closed `home-path` redaction lint at Gate-2 and
  forces a manual placeholder substitution (three recurrences in the 2026-07-08
  memory-frictions campaign). Fix the directive that produces the paths; the lint
  stays the unchanged net.
- Method: Implement the spec's resolved design tree — the plan does not re-litigate
  it. Add a path-hygiene clause **inside D3 VERIFY-ON-WRITE on both prompt surfaces
  in one task** (standing card `agents/war-servitor.md` + the dispatched servitor
  Wrap-up `pt` block in `skills/war/assets/workflow-template.js`): any path written
  anywhere in a lesson file (body, `description`, `metadata.keywords`, locate-cues,
  absence-notes — the Gate-2 lint scans the whole file) is repo-relative for
  referents tracked in this repo, or one of the three placeholders `<repo-root>`,
  `<session-worktree>`, `<local-memory-root>` (each with a one-line selection rule
  in the directive itself) for out-of-tree locations — never an absolute
  home/checkout path, with the forbidden shape **described in words, no
  slash-literal example** (a literal would self-trip this plan's own sweep and the
  release blurb, per the rename-absence-guard lesson) — and an explicit carve-out
  that `ServitorResult.files_written` stays **absolute** (the Return/RETURN contract
  is untouched by the task diff). Reword the locate-cue exemplar on both surfaces to
  a repo-relative example while preserving the phrase "verify still present before
  acting". Guard the shared wording with **one new row in the existing `D3 —
  both-surfaces directive registry`** in
  `skills/war/assets/workflow-template.test.mjs`, raising the `REGISTRY.length >=`
  floor **and its enumerating message** to the new true row count (per the #693
  off-by-one lesson — no slack; retires today's floor-8-vs-nine-rows slack too). No
  lint change, no hook, no gate, no enum (ADR 0005 surfaces untouched). Trailing
  release phase ships the prompt-behavior change.
- End state:
  1. `agents/war-servitor.md` D3 carries the path-hygiene directive: the card greps
     (case-insensitive) for `repo-relative` and each literal placeholder token
     `<repo-root>`, `<session-worktree>`, `<local-memory-root>`, all within the D3
     discipline (found-arm and absent-arm both covered by the one clause), each
     placeholder carrying its one-line selection rule.
  2. The dispatched servitor Wrap-up prompt carries the same directive: the
     `D3 VERIFY-ON-WRITE` `pt` clause in `workflow-template.js` greps for the same
     four tokens; the new prose is static (no new `${}` interpolations — no new
     `pt` throw surface).
  3. One task owns both surfaces: the task's cumulative diff (frozen phase base →
     task tip) touches `agents/war-servitor.md` and
     `skills/war/assets/workflow-template.js` together — no task or phase boundary
     ever separates them (the worker's default is still one commit for both, but
     the pass/fail invariant is task-diff-granular, so audit fix rounds touching
     one surface's wording do not fail it).
  4. The directive on both surfaces explicitly excludes
     `ServitorResult.files_written` from relativization (carve-out adjacent to the
     path-hygiene clause on each surface), and **no diff hunk of any task touches**
     the `## Return` section on the card or the `RETURN:` `pt` clause in the
     Wrap-up dispatch (diff-scope check — no byte-identity promise against any
     other baseline; the existing registry row's
     `files_written…absolute` anchor keeps holding on both surfaces).
  5. A new row exists in the `REGISTRY` array of the
     `D3 — both-surfaces directive registry` test binding
     `['war-servitor.md', servitorMd]` + `['servitor Wrap-up prompt', servitorP]`
     to the directive's anchors — at minimum: `repo-relative`, each of the three
     placeholder tokens (angle brackets regex-escaped, matched as literal
     load-bearing tokens), a never-absolute-home-path anchor (a mid-sentence
     fragment of the worded prohibition, e.g. `never an absolute`), and a
     files_written-stays-absolute carve-out anchor distinct in wording from the
     existing memory-discipline row's where feasible.
  6. The `REGISTRY.length >=` floor equals the new **true** row count and its
     assertion message's row enumeration names the new path-hygiene row (adding one
     row to today's nine ⇒ floor 10 — this also retires the pre-existing one-row
     slack, floor 8 vs. nine true rows, exactly the silent-drop gap spec
     constraint 5 names; a bare `+1` to the old floor is a plan violation).
  7. Delete-the-feature (directive): reverting the clause on **either single
     surface** in a scratch tree makes the registry test fail — run once per
     surface by the implementing worker before its done-report and both RED results
     recorded there (this also proves the anchors are non-vacuous, i.e. they match
     the new clause and not some other prompt text — the weak-test-assertion
     lesson; permanence then holds by the registry's per-surface anchor loop).
  8. Delete-the-feature (net unchanged): the union of task diffs for
     `skills/_shared/war-memory.mjs` and `skills/_shared/war-memory.test.mjs` is
     empty — the family is **hard-excluded**: even an additive "safety" test there
     violates this end state (a drive-by observation becomes a follow-up
     finding/issue, never an in-diff fix) — and the existing lint tests
     (`routeRoot('project', true, /*lintHit*/ true) === 'local'`; the `home-path`
     pattern test) pass unmodified.
  9. Sweep completeness: grep of both surfaces for `/Users/` returns **zero hits**
     (the directive words the prohibition without a path literal, so no exemption
     machinery exists or is needed), no unconstrained `found at <path>` exemplar
     remains, **and** the task report lists the manual same-scope prose survey
     (both surfaces end to end: every D-discipline, the finding-match clause, the
     Return/RETURN text, the full Wrap-up `pt` block) with survey-derived
     corrections applied or explicitly none found.
  10. The two pre-existing per-surface D3 tests stay green unmodified — `F05 —
      Wrap-up prompt: instructs VERIFY-ON-WRITE` and `F05 — war-servitor.md:
      admission checklist includes VERIFY-ON-WRITE (D3)` (their
      `verify…still…present|verify…before…act` regexes are gap-tolerant, and the
      reworded exemplar preserves the "verify still present before acting" phrase,
      so they hold by construction — named here so a worker never "fixes" a red by
      relaxing them).
  11. Full JS suite green: `node --test 'skills/**/*.test.mjs'`.
  12. Release: all four version slots (`.claude-plugin/plugin.json` `version`,
      `.claude-plugin/marketplace.json` `metadata.version` and
      `plugins[0].version`, the `README.md` `## Status` replace-in-place line)
      agree on the next free patch above the live integration base at land time.

## Build order (for /war)

Two phases, strictly serial. Phase 1 is a single task — the prompt-surface-split
constraint (both surfaces, one task) and the new-directive registry rule (a new
both-surfaces directive lands its registry row in the same task, per the registry's
own `ponytail:` authoring rule and SKILL.md §3 rule 5) bind all three files into one
cohesive unit; splitting them would ship a naked directive or split the surfaces
across land boundaries. Phase 2 is the release bump (SKILL.md §3 rule 4: release =
its own trailing phase; it touches the shared slot files).

- Phase 1 — Path-hygiene directive on both servitor prompt surfaces + registry row
  - Wave 1: Task 1
- Phase 2 — Release
  - Wave 1: Task 2

## Phase 1 — Path-hygiene directive on both servitor prompt surfaces + registry row

### Task 1: D3 path-hygiene clause (both surfaces, one task) + D3-registry row
- Files: agents/war-servitor.md, skills/war/assets/workflow-template.js,
  skills/war/assets/workflow-template.test.mjs
- Plan slice: Implement spec §4 with the reconciliations logged in ## Notes. Anchor
  every edit by named construct — the `D3 — Verify-on-write` bullet on the standing
  card, the `D3 VERIFY-ON-WRITE` `pt` line inside the servitor Wrap-up `agent(...)`
  dispatch (the call guarded by `landResult.status === 'landed' &&
  memoryLocalRoot`), the `REGISTRY` array inside the test titled `D3 —
  both-surfaces directive registry: every correctness-critical directive is on its
  standing card AND its dispatched prompt(s)`, and the `## Return` section — never
  line numbers (the Wrap-up block's position moves; this file also rebases onto the
  drift-guard-tightening plan's edits in the same campaign stack).
  (1) **Standing card** (`agents/war-servitor.md`): extend D3 with a path-hygiene
  clause covering both D3 arms (found → locate-cue; absent → absence-note). Content
  of the clause, in the worker's own words but carrying every element:
  **scope** — any path written anywhere in the lesson file (body, `description`,
  `metadata.keywords`, locate-cues, absence-notes), for every lesson type (the
  Gate-2 lint scans the whole file, and `type` is mutable across recurrence-updates
  and promotion);
  **vocabulary** — a bare repo-relative path (e.g.
  `skills/war/assets/workflow-template.js`) for any referent tracked in this repo;
  `<repo-root>` for the root of the inspected checkout — untracked under-checkout
  locations (e.g. `.claude/worktrees/…`) or when the root itself is the fact (this
  is exactly what replaces the servitor's absolute cwd prefix);
  `<session-worktree>` for paths meaningful only inside the ephemeral session/task
  worktree; `<local-memory-root>` for files under the local memory root (legitimate
  in locate-cues — the memory-about-memory case); a referent living in **another
  repo** (cross-repo campaign) is written relative to that repo, prefixed with that
  repo's name;
  **prohibition** — never an absolute path rooted at a home directory or checkout
  location, the forbidden shape **described in words with no slash-literal
  example** (a `/Users/`-style literal in the directive would trip End state 9's
  own sweep — the rename-absence-guard trap);
  **rationale line** — the checkout path is incidental, and the fail-closed Gate-2
  redaction lint demotes any `type: project` lesson carrying one;
  **carve-out** — in the same clause: this governs lesson-file content only — the
  `ServitorResult.files_written` return contract (see `## Return`) still requires
  **absolute** paths and is unchanged.
  Reword the locate-cue exemplar in the "Referent **found**" bullet to demonstrate
  a repo-relative path, **preserving the phrase "verify still present before
  acting"** (End state 10's two pre-existing tests anchor on it, gap-tolerantly).
  The finding-match clause references "the locate-cue" and inherits the fixed
  definition — no second edit point; verify no other absolute-path exemplar remains
  on the card.
  (2) **Dispatched prompt** (`workflow-template.js`): mirror the same clause into
  the `D3 VERIFY-ON-WRITE` `pt` line of the Wrap-up dispatch, wording structurally
  identical to the card — same clause order, same load-bearing tokens — so one
  anchor set matches both surfaces; **byte-identity across surfaces is explicitly
  NOT required** (the card uses markdown backticks/bold, the `pt` prompt is plain
  text). Static prose only — no new `${}` interpolations (the `pt` tag throws on
  undefined interpolation). Both surfaces in the same task, one commit by default.
  The `RETURN:` `pt` clause is read, never edited.
  (3) **Sweep**: grep both surfaces for remaining absolute-path exemplars and
  unconstrained `<path>` locate-cue prose (tokens: `found at`, `/Users/`,
  `absence-note`) — End state 9 requires the `/Users/` grep to return zero hits.
  **Grep is a floor, not a ceiling** — also hand-scan the full servitor-facing
  prose on both surfaces end to end (every D-discipline, the finding-match clause,
  the Return/RETURN text, the whole Wrap-up `pt` block) for exemplars the tokens
  miss; apply survey-derived corrections in this task and list them (or explicitly
  "none found") in the done-report.
  (4) **Drift guard** (`workflow-template.test.mjs`): add one row to the
  `REGISTRY` array in the `D3 — both-surfaces directive registry` test —
  name: `servitor path-hygiene (repo-relative / placeholder locate-cues;
  files_written stays absolute)`; surfaces: `['war-servitor.md', servitorMd]`,
  `['servitor Wrap-up prompt', servitorP]` (same pair as the existing servitor
  rows); anchors per the tolerance rule: case-insensitive substring regexes on
  distinctive mid-sentence fragments — never full-line, never containing markdown
  punctuation (backticks, asterisks, quotes: the card wraps tokens in backticks,
  the prompt doesn't; substring regexes match through both) — proximity pairs via
  the existing `[\s\S]{0,120}` idiom. Minimum anchor set: `repo-relative`, the
  three placeholder tokens as regex-escaped literals (`<repo-root>`,
  `<session-worktree>`, `<local-memory-root>` — load-bearing, never reworded), a
  fragment of the worded prohibition (e.g. `/never an absolute/i`), and a carve-out
  anchor — worded distinctly from the existing memory-discipline row's
  `files_written…absolute` anchor where feasible; the End-state-7 RED proofs are
  the vacuity check either way. Raise the `REGISTRY.length >=` floor to the new
  true row count **and rewrite the assertion message's enumeration to name the new
  row** (expected: 10 rows, floor 10 — today's array holds nine rows behind a
  floor of 8; per spec constraint 5 the bump sets floor = true count, retiring the
  inherited slack; a naive `8 → 9` reproduces the #693 gap and is wrong). If the
  rebase onto the campaign stack shows a different true count, recount the live
  array and set floor = actual count — resolved against the live artifact, never
  this plan's snapshot.
  (5) **Net untouched**: make no edit of any kind to `skills/_shared/war-memory.mjs`
  or `skills/_shared/war-memory.test.mjs` — the family is hard-excluded from this
  task's diff (End state 8; an incidental improvement spotted there is a follow-up
  issue, not an in-diff fix). Run
  `node --test skills/war/assets/workflow-template.test.mjs` and the full
  `node --test 'skills/**/*.test.mjs'` green before done.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2: Version bump across the four slots
- Files: .claude-plugin/plugin.json, .claude-plugin/marketplace.json, README.md
- Plan slice: Bump **all four version slots to the next free patch above the live
  integration base at land time** — `.claude-plugin/plugin.json` `version`,
  `.claude-plugin/marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place,
  never a badge, never an emptied field). Never a resolved `v<semver>` literal
  from this plan: version literals in plans are non-authoritative; resolve the
  next free patch from the four slots as they stand on the worktree base at land
  time. Expected integration base: this campaign's stacked tip (this plan shares a
  campaign with `2026-07-11-drift-guard-tightening.md`, which ships no release
  phase, and `2026-07-11-red-team-resilience.md`, which does — N stacked unlanded
  releases mean an N-step baseline lag, not a scope error; resolve off what the
  worktree base actually shows). Standalone fallback: a plain `/war` run of this
  plan outside the campaign resolves the next free patch from the four slots
  itself the same way. The `version-slots.test.mjs` lock-step drift guard is the
  arbiter of cross-slot agreement — keep it green, do not restate slot values
  anywhere else. Release-note/status blurb: describe the change as "servitor
  lesson-content paths are repo-relative or placeholder-based; the Gate-2
  redaction lint is unchanged" — do not overstate (no new enforcement was added),
  and the blurb must not quote a bare absolute-path exemplar (lesson
  `release-blurb-describing-a-rename-trips-the-renames-own-absence-guard`; the
  directive itself avoids the literal for the same reason).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Both-surfaces-in-one-task check (End state 3):** the task's cumulative diff
  (frozen phase base → task tip) touches both `agents/war-servitor.md` and
  `skills/war/assets/workflow-template.js` · why deferred: a diff-granularity
  fact, not a green-suite fact; commit-granular checking would false-fail on audit
  fix rounds · runner: Task 1's auditor at the pinned `audit_sha`; re-checked by
  the Lead at phase land.
- **Net-unchanged diff audit (End state 8):** the union of all task diffs shows an
  empty diff for `skills/_shared/war-memory.mjs` and
  `skills/_shared/war-memory.test.mjs`; the existing `routeRoot(...)` fail-closed
  demotion and `home-path` pattern tests pass unmodified · why deferred: "did NOT
  change" is a diff-level cross-task property · runner: Task 1's auditor (task
  scope) + Lead at phase land, `execution-evidence` gate-audit lens (plan scope).
- **Return-contract untouched (End state 4):** no hunk in the task diff overlaps
  the `## Return` section on the card or the `RETURN:` `pt` clause in the Wrap-up
  dispatch · why deferred: diff-scope fact · runner: Task 1's auditor at the
  pinned `audit_sha`.
- **Per-surface delete-the-feature RED proof (End state 7):** two scratch-tree
  reverts (clause removed from the card only; clause removed from the `pt` line
  only), each turning the registry test RED · why deferred: a mutation
  verification, not a committable test — a read-only auditor cannot run it, so it
  is worker evidence; permanence is then held by the registry's per-surface anchor
  loop · runner: Task 1's worker before done-report (both RED results recorded);
  re-provable by /red-team.
- **Behavioral outcome (the spec's success metric):** on the next campaign that
  runs a servitor with this directive live, count Gate-2 redaction-lint demotions
  caused by locate-cue/absence-note home paths; recurrence at the prior rate means
  the directive wording is insufficient — file a follow-up issue rather than
  tightening the lint · why deferred: LLM compliance is observable only in a live
  run; this plan's suite verifies directive **presence**, not compliance (ADR
  0017: stated here so it is a backstop, not prose-waived) · runner: the Lead of
  the next servitor-bearing campaign, at its Gate-2.
- **Full-repo suites (End state 11):** `node --test 'skills/**/*.test.mjs'` ·
  why deferred: each task's gate runs its self-discovered suites; the whole-repo
  sweep is the cross-task interference check · runner: Lead at each phase land,
  before push.
- **Issue lifecycle:** the phase-end PR body carries `Closes #726` · why
  deferred: land-time bookkeeping, not a task diff · runner: Lead at land.
- **Release-slot agreement (End state 12):** the four slots agree on the resolved
  next-free patch; `version-slots.test.mjs` green at the Phase 2 tip · why
  deferred: the patch number is resolvable only at land time against the live
  base · runner: Phase 2's gate + Lead at land.

## Notes / conscious deviations

- **No path literal inside the directive (grill Q1):** spec §4 showed
  `(`/Users/...`, `/home/...`)` as the forbidden example *inside* the directive
  text, while criterion 9 sweeps both surfaces for `/Users/` — mutually
  unsatisfiable (verified: neither surface carries `/Users/` today, so the literal
  would be the sweep's only hit). Resolved toward the sweep: the prohibition is
  worded, no slash-literal; the registry's never-absolute anchor matches the
  worded fragment. No exemption list needed — End state 9 is a clean zero-hit
  grep. Same rule already protected the release blurb.
- **Directive scope: all lesson types, whole file (grill Q4, Q15):** the spec's
  directive text carries no `type:` qualifier and the Gate-2 lint reads the whole
  file (`lint(fs.readFileSync(f))` in the `lint` subcommand), so the clause says
  "anywhere in the lesson file" and applies to every lesson type — `type` is
  mutable across the recurrence-update/promotion flow, and the placeholders keep
  local-only lessons fully resolvable (no information loss: each placeholder has a
  defined referent). Widened from the spec's four-field enumeration to match the
  lint's actual scan scope.
- **Placeholder selection rules live in the directive, not CONTEXT.md (grill Q5,
  Q6):** one line per placeholder at the point of use (the surface the servitor
  actually reads); precedent is the three hand-substituted lessons
  (`<repo-root>/…`, `<local-memory-root>/<slug>.md`). Spec §6's "no new CONTEXT.md
  terms" stands; Files list stays at three.
- **Cross-repo clause added (grill Q7):** spec exemplars were all meta-repo; one
  sentence extends the rule — referent in another repo ⇒ path relative to that
  repo, prefixed with the repo name. No new anchor for it (anchors cover the
  load-bearing tokens, not every sentence). Trivially reversible prose.
- **Same-task, not same-commit (grill Q8):** audit fix rounds can add commits
  touching one surface; the drift invariant that matters is that no *land*
  boundary separates the surfaces. End state 3 and its backstop are
  task-diff-granular; one commit remains the worker's authoring default.
- **Return-contract check is diff-scope, not byte-identity (grill Q10):**
  "byte-unchanged" has no mechanically checkable baseline other than the task
  diff — restated as "no hunk overlaps the construct", which the auditor checks at
  `audit_sha` (lesson `shared-string-constant-quote-literal-byte-anchor-fragility`
  argues against byte promises generally).
- **Registry floor 10 with message rewrite, recounted at rebase (grill Q2, Q12):**
  today's floor (`>= 8`) sits one below the true row count (nine) — the #693 gap
  already live. Task 1 sets floor = post-add true count (expected 10) and rewrites
  the message enumeration; a bare `+1` is named wrong in the task text so neither
  worker nor auditor can pick the slack reading. Verified: the sibling
  drift-guard-tightening plan touches `workflow-template.test.mjs` only at the
  disjoint `CALIBRATION_RULE_ANCHORS` construct and adds **no** REGISTRY row — but
  the count is still re-derived from the live array at rebase, never carried from
  this plan.
- **Campaign contention — `workflow-template.test.mjs`:** shared with
  `2026-07-11-drift-guard-tightening.md` (its Task 1). The survey manifest's
  `dependsOn` for this spec is `[]` (the draft's earlier "per the manifest
  dependsOn" claim was wrong); serialization of the two plans is a **roadmap**
  fact — the campaign roadmap must order them serially, and each
  registry-floor-touching plan re-derives the floor at rebase time. Constructs are
  disjoint, edits are anchored by named construct, so the rebase is clean either
  order.
- **Campaign contention — release slots:** Phase 2 touches the same four slot
  files as `2026-07-11-red-team-resilience.md`'s release task. Resolved by stack
  order + the next-free-patch directive (lessons
  `stacked-release-plan-version-literal-lags-operator-target`,
  `stacked-per-branch-releases-make-main-lag-cumulative`). No version literal
  appears in this plan.
- **One task, three files (Phase 1):** deliberate. The prompt-surface split
  requires both surfaces in one task (spec constraint 1) and the registry
  authoring rule requires the row in the same task as the directive (the
  registry's own `ponytail:` comment) — an unguarded directive is a plan defect,
  never a follow-up. Auditors: the three-file footprint is the cohesive unit, not
  scope creep.
- **Anchor tolerance rule (grill Q13):** case-insensitive substring regexes on
  mid-sentence fragments; never full-line; never containing markdown punctuation
  (the card backtick-wraps tokens, the `pt` prompt is plain — substring regexes
  match through both); proximity pairs via `[\s\S]{0,120}`; placeholder tokens
  anchored as regex-escaped literals. Byte-identity across surfaces is explicitly
  **not** required — "structurally identical" means same clause order and same
  load-bearing tokens so one anchor set matches both.
- **Pre-existing D3 tests are must-stay-green anchors (grill Q3):** the two F05
  VERIFY-ON-WRITE tests use gap-tolerant regexes (verified — not byte anchors);
  preserving "verify still present before acting" in the reworded exemplar keeps
  them green by construction. Named in End state 10 so a red is fixed in the
  wording, never by relaxing the tests.
- **Compliance is probabilistic (spec §8, grill Q14):** a servitor can still emit
  an absolute path; the lint demotes it exactly as today. The suite verifies
  directive presence only; the behavioral claim lives in the backstops (next
  campaign's Gate-2 demotion count), not in prose. No lint tightening, no hook
  enforcement, no Gate-2 auto-substitution, no retroactive sweep of existing
  `docs/learnings/` bodies (spec §9 non-goals — auditors should not flag their
  absence).
- **Rollback unit is the whole Task 1 unit (grill Q16):** directive prose + the
  registry row + the floor bump revert together (one task branch / one revert). A
  prose-only partial revert reds the registry row **by design** — that is the
  guard working; the fix is the full revert, never deleting the row or restoring
  slack. Lessons written under the new directive need no rework on revert:
  repo-relative paths and placeholders never trip the lint.
- **ADR 0005 / enum discipline:** not triggered — no enum member, no status value,
  no `HARD_ESCALATION_REASONS` surface is touched.
- **`pt` throw surface:** the new dispatched prose is static — no new `${}`
  interpolations — so no new undefined-interpolation throw path (spec §8).
- **requiresTest true on Task 1:** the diff carries the new registry row in
  `workflow-template.test.mjs`, so the `assert-test-in-diff.sh` floor passes by
  construction; noted so auditors don't read the flag as vacuous. Phase 2 is a
  version-slot bump (`requiresTest: false`, the floor's `no-test` route is the
  expected benign outcome).

## Open decisions

None — every grill fork is resolved above from the spec and the verified codebase;
the only live-artifact resolutions (registry true count, release patch number) are
deferred to land time by construction.
