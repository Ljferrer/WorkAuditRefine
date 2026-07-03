# WAR pipeline skills — /war-survey-corps, /war-machine, /war-aftermath

**Source spec:** [`docs/specs/2026-07-02-war-pipeline-skills-design.md`](../specs/2026-07-02-war-pipeline-skills-design.md)
(grilled + adversarially verified; committed at `77e3df6`). Turns the README Pro Tip's three prose steps
into war-native skills bracketing `/war-campaign`, plus the one doctrine amendment
(`## AI-Commander's Intent`, ADR 0014 amending ADR 0013) that makes the middle step schedulable.
Every code reference below is anchored by **construct name**; `~:N` hints WILL drift — re-locate by
construct ([[plan-line-number-refs-stale-use-construct-locator]]).

Memory hooks: [[frontmatter-tools-negation-check-single-line-only]] (criterion-2 negation must check
single-line AND YAML-block frontmatter), [[default-flip-must-audit-all-doc-surfaces]] (the heading-contract
flip hits every surface — grep the heading literal fresh at impl time for surfaces added since the spec),
[[weak-test-assertion-passes-without-feature-being-exercised]] (temp-break proof per token family),
[[release-bump-slots-canonical-no-badge]] + [[version-slots-no-cross-slot-consistency-test]] +
[[stacked-release-plan-version-literal-lags-operator-target]] (release task),
[[task-prompt-suite-count-stale-after-stacking]] (count suites self-discovered, never a literal),
[[war-branch-base-off-latest-master-not-prior-tip]] (basing),
[[gate-output-curated-excerpt-obscures-mapped-test-evidence]] (emit full runner output, not excerpts),
[[dont-leave-work-on-the-table]] (collateral fixes absorbed by the file's owning task).

**Ratify with `/red-team` before `/war`.** The spec's 11 design-tree resolutions are operator-resolved;
the `--afk` closing commit was explicitly **ratified by the operator at plan authoring** — ratify, don't
re-open.

## Commander's Intent

- **Purpose:** The README Pro Tip's outer loop — issues → specs → plans → campaign → cleanup — becomes
  four discoverable, cron-able slash commands instead of three re-typed prose blocks, with `/war-campaign`
  untouched and human-launched at its center.
- **Method:** Three new skills consume `/war-strategy`'s templates, never fork them. Survey hands off to
  machine via the uncommitted manifest under the **main checkout's** `.claude/aot/`; machine stops at
  plans + roadmap and prints the campaign handoff; aftermath deletes/closes only behind checkable evidence
  chains (git-wins truth), with `--scorched-earth` as the documented-dangerous widened mode and a
  non-negotiable protected core. The single doctrine change is the provenance-marked
  `## AI-Commander's Intent` (emitted only by `/war-machine --afk`, checked against predecessor intent
  blocks), amended on **every** surface that states the old absolute.
- **End state** (each condition individually checkable — coverage map below ties them to tasks):
  1. `/war-survey-corps`, `/war-machine`, `/war-aftermath` exist and are registered in `plugin.json`;
     only `war-aftermath` carries `disable-model-invocation: true`.
  2. All five §4.4 heading surfaces recognize both intent headings; `workflow-template.js` comments no
     longer assert the single-heading contract.
  3. README Pro Tip is exactly the four-command sequence; the `--afk --scorched-earth` danger callout
     appears in both README and the aftermath SKILL.md.
  4. `CONTEXT.md` carries the four new terms + the amended Commander's Intent entry; ADR 0014 exists and
     ADR 0013 carries a status note linking it.
  5. A structure test pins spec §10 criteria 2, 3, 4, 9, 10 and runs green in the self-discovering gate.
  6. Version is +0.1.0 over the land-time base across all four canonical slots — verified by hand.

## Build order (for /war)

- **Topology:** 2 phases. Phase 1 = content: nine wave-1 file-disjoint tasks + two wave-2 dep tasks
  (dep-wave visibility landed with ADR 0012 / PR #448 — a wave-2 worker rebases onto the integration tip
  and sees its deps' merged content). Phase 2 = release (version slots only).
- **Integration base:** latest `origin/master` if run standalone; the series tip if stacked
  ([[war-branch-base-off-latest-master-not-prior-tip]]). Version = **+0.1.0 over the land-time base** —
  the operator at release adjudication is the version authority; no literal in this file is.
- **File-disjointness map (Phase 1):** T1 → `skills/war-survey-corps/**`. T2 → `skills/war-machine/SKILL.md`.
  T3 → `skills/war-aftermath/**`. T4 → `skills/war/SKILL.md` + `skills/war/references/{schemas,design}.md`
  + `skills/war/assets/workflow-template.js` (comments only). T5 → `skills/red-team/**`. T6 → `CONTEXT.md`
  + `docs/adr/*`. T7 → `README.md`. T8 → `skills/war-help/SKILL.md`. T9 → `skills/war-strategy/**`.
  T10 → `skills/war-machine/war-pipeline-structure.test.sh` (new file — no collision with T2's SKILL.md).
  T11 → `.claude-plugin/plugin.json`. No overlaps. Phase 2 alone touches the version slots (plugin.json's
  `version` field edit in T12 is a **phase edge** away from T11's `skills` array edit — same file, never
  the same phase).
- **Gate:** the full self-discovering gate before every commit — `node --test 'skills/**/*.test.mjs'` +
  the `find … '*.test.sh'` sweep. Run **all** suites post-merge; count self-discovered, never a literal.
  Emit full runner output ([[gate-output-curated-excerpt-obscures-mapped-test-evidence]]).
- **Coverage — spec §10 criteria → tasks:** 1 → T11 (+T1–T3); 2 → T1/T2/T3 frontmatter + T10;
  3 → T3+T7 content + T10; 4 → T4/T5 + T10; 5 → T6; 6 → T7; 7 → T8; 8 → T9; 9 → T1/T2 content + T10;
  10 → T2 content + T10; 11 → T6; 12 → T12 (by hand — no cross-slot test exists); 13 → T10;
  14 → T3 content (greppable tokens), hand-verified at review + red-team.

---

## Phase 1 — the three skills + every doctrine surface (wave 1: T1–T9; wave 2: T10–T11)

### Task 1 — `/war-survey-corps` SKILL.md

- **Files:** `skills/war-survey-corps/SKILL.md`
- **Plan slice:** author the skill per spec §4.1. Frontmatter: `name: war-survey-corps`, model-invocable
  (NO `disable-model-invocation`), description with "use when" triggers; the body authorizes the
  `Workflow` tool (precedent: `/red-team`, `/lessons-learned`). Invocation `/war-survey-corps [--erwin]`.
  Mechanics, in order: **sweep** (`gh issue list --state open`; drop run-bookkeeping labels `phase:*`,
  `status:*`, `task`, `run:*`, legacy `coven`; `war-followup` explicitly first-class input; zero issues
  after filter → "nothing to survey", stop); **fan-out readers** (one agent per issue/small batch →
  structured summary: theme, affected files, severity, staleness); **cluster barrier** (all summaries at
  once; code-boundary thinking one level up — same-file-family groups merge or carry an ordering edge;
  `--erwin` = present groups, wait for approval; document that the flag makes the survey un-cronable by
  design); **synthesize** (one agent per group authors a war-shaped spec via the `/war-strategy` spec
  template — consumed by reference to `skills/war-strategy/SKILL.md` §2, never forked — written to
  `docs/specs/YYYY-MM-DD-<slug>-design.md`, listing the issue numbers it addresses); **completeness
  critic** (every swept issue claimed by exactly one spec or explicitly deferred with a reason; strays
  flagged, never dropped); **manifest + report** (schema verbatim from spec §4.1: `createdAt`, `surveyed`,
  `specs[{path,title,issues,dependsOn}]`, `deferred[{issue,why}]`, `consumed: null`). The manifest lives
  at `.claude/aot/YYYY-MM-DD-survey.json` under the **main checkout**, resolved from any linked worktree
  via `git rev-parse --path-format=absolute --git-common-dir` — never the invoking worktree's `.claude/`;
  uncommitted; latest-wins (same-day re-run overwrites — a re-survey supersedes; say so in the SKILL.md).
  Specs go to the working tree; the survey **never commits**.
- **requiresTest:** false (load-bearing tokens pinned by T10)
- **deps:** []
- **target repo:** superproject

### Task 2 — `/war-machine` SKILL.md

- **Files:** `skills/war-machine/SKILL.md`
- **Plan slice:** author the skill per spec §4.2. Model-invocable. Invocation
  `/war-machine [spec-paths…] [--afk]`. **Input precedence** (state all three): (1) explicit paths;
  (2) fresh survey manifest — latest `.claude/aot/*-survey.json` (main-checkout anchor, same
  `--git-common-dir` rule as T1) with `consumed: null` whose specs still exist, filtered to specs with no
  corresponding plan → take exactly that list, no questions; (3) fallback inference — scan
  `docs/specs/*.md` for specs no plan references, matching `docs/specs/<name>`, `../specs/<name>`, **or
  basename** (the corpus cites by relative link); absence is a **hint, not proof** — present the inferred
  list for the operator to confirm and edit, never auto-convert. **`--afk` + no fresh manifest + no
  explicit paths → report the inferred list and exit without converting.** **Per spec, strictly serial:**
  drafter agent + adversarial grill agent in parallel, fresh context per spec; unresolved questions
  classified by the ADR triad (hard to reverse / surprising / real trade-off); interactive = one
  `AskUserQuestion` volley per spec (mandatory Commander's Intent echo-back confirm + triad survivors);
  `--afk` = triad survivors self-adjudicated into `## Notes / conscious deviations`, plan carries
  **`## AI-Commander's Intent`** — before committing to it, read prior intent blocks (either heading)
  across `docs/plans/*.md` and check predecessor consistency (tone, scope, standing constraints);
  divergence recorded in the deviations log, never silently shipped; a spec unconvertible without an
  operator decision is **skipped and reported**, never stalled on. Plans written to
  `docs/plans/YYYY-MM-DD-<slug>.md` (**no `-plan` suffix**), each citing its source spec path near the
  top (the line `/red-team` step 1 greps for and the third link in aftermath's evidence chain). **After
  the last spec:** author the roadmap (`docs/roadmaps/YYYY-MM-DD-<slug>-roadmap.md` per the
  `/war-strategy` roadmap template; spine from manifest `dependsOn` + real plan `Files:` footprints;
  contention table from the same); stamp the manifest `consumed`
  (`{by, at, plans: {specPath: planPath}}`); **under `--afk`, close with one commit of the pipeline
  artifacts** (consumed specs + plans + roadmap) onto the current branch — operator-ratified; interactive
  runs leave the tree for review. Print the `/war-campaign docs/roadmaps/…` handoff (roadmap = authoring
  input + snapshot, never the live queue) + the reminder that standalone `/war` users red-team manually;
  stop. Document the upgrade path: `/war-strategy <plan>` replaces `## AI-Commander's Intent` with an
  interviewed `## Commander's Intent`.
- **requiresTest:** false (tokens pinned by T10)
- **deps:** []
- **target repo:** superproject

### Task 3 — `/war-aftermath` SKILL.md

- **Files:** `skills/war-aftermath/SKILL.md`
- **Plan slice:** author the skill per spec §4.3. Frontmatter **must** carry
  `disable-model-invocation: true`. Invocation `/war-aftermath [--afk] [--scorched-earth]`. **Default
  scope — the four evidence-gated classes** as a table (stray WAR branches / orphaned run worktrees / WAR
  bookkeeping issues / survey-swept issues) with their evidence gates verbatim from the spec:
  `git merge-base --is-ancestor` against `git ls-remote` truth, `gh pr view` = `MERGED`, ledger-says-landed
  AND sha-reachable. **Dead runs** (`held:phase-incomplete` / `held:workflow-error`) are **needs-human
  rows, never in the safe list, never touched under `--afk`** — doctrine preserves a dead phase's git
  state; only `--scorched-earth` may burn them, ⚠-flagged. **Active-campaign predicate stated verbatim
  enough to grep** (spec criterion 14): a campaign ledger is active iff any plan entry is non-terminal
  (`status: "queued"`, or a recorded `stopPoint` with `status ≠ "landed"`), reconciled toward git before
  being trusted. **Class-4 join rule:** ledger plan paths are absolute (Lead's cwd, possibly a dead
  worktree) vs. manifest repo-relative paths → join by plan **basename/slug**, never full path;
  `gh pr list --search "<plan filename>"` is the sanctioned fallback; close with a comment linking the
  landing PR (note: issue-close comments are outward-facing — under `--afk` they post unattended;
  accepted, but say so). **Interaction model:** categorized dry-run report first (safe rows + evidence
  vs. needs-human rows); interactive = one confirm, execute safe list only; `--afk` = skip confirm,
  execute only the provably-safe class, report the rest. **`--scorched-earth`:** candidates widen to
  *every* local branch + worktree (`claude/*`, `feat/*`, stale `dev/*`, their `.claude/worktrees/` dirs);
  bar lowers to force-delete (`git branch -D`, `git worktree remove --force`), unmerged rows ⚠-flagged not
  skipped; interactively still report → one confirm. **Protected core (survives even
  `--scorched-earth --afk`):** current branch + worktree, default branch, running-session worktrees,
  anything referenced by an active run/campaign ledger; `.claude/aot/` survey manifests are never deleted.
  **Running-session heuristic**, layered by descending trust: the process's own worktree (floor); the
  per-worktree transcript project dir (`~/.claude/projects/<munged-worktree-path>`) with **mtime within
  the last 24 h** — the primary liveness signal (dir *existence* is no signal; dirs outlive worktrees);
  uncommitted changes are an unmerged-**work** ⚠ flag, never a liveness signal. The 24 h window is this
  plan's value — `/red-team` probes it (Open decisions). **Teardown ordering:** worktrees reaped **by path
  before** their branches are deleted. **The `--afk --scorched-earth` combo is documented as dangerously
  destructive** (literal token for T10) with a loud warning banner before proceeding.
- **requiresTest:** false (tokens pinned by T10)
- **deps:** []
- **target repo:** superproject

### Task 4 — war-skill intent surfaces recognize both headings

- **Files:** `skills/war/SKILL.md`, `skills/war/references/schemas.md`,
  `skills/war/references/design.md`, `skills/war/assets/workflow-template.js`
- **Plan slice:** spec §4.4, the war-owned four of the five heading surfaces + the comment touch-up.
  `skills/war/SKILL.md` — the plan-read **intent-extraction step** (construct: the step defining
  `args.intent`, ~:27): extract *either* `## Commander's Intent` or `## AI-Commander's Intent` verbatim
  into `args.intent`; the "The Lead **never** invents intent (ADR 0013)" sentence gains the amended
  pointer — the Lead still never invents intent; `/war-machine --afk` is the sole *authoring* surface
  allowed to (ADR 0014). `references/schemas.md` — the `args.intent` contract (~:183): name both headings
  + the sanctioned exception. `references/design.md` — the intent-threading bullet (~:133): same
  amendment. `assets/workflow-template.js` — **contract comments only, no functional change** (it
  consumes the `args.intent` string); update comments naming the single heading so they don't assert a
  superseded contract; the existing `workflow-template.test.mjs` suite must stay green untouched.
- **requiresTest:** false (prose/comment surfaces; pinned by T10; template suite already guards behavior)
- **deps:** []
- **target repo:** superproject

### Task 5 — red-team intent surfaces recognize both headings

- **Files:** `skills/red-team/assets/workflow-scaffold.js`,
  `skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/red-team/references/lenses.md`
- **Plan slice:** spec §4.4, the red-team pair. `workflow-scaffold.js` — the **`intent-vs-plan` probe
  prompt** (construct: the prompt beginning `Read the plan ${planFile}. If it has a "## Commander's
  Intent" section…`, ~:140) hardcodes the single heading in **both** branches; as written it judges an
  `## AI-Commander's Intent` plan as having *no* intent section. Amend both branches: the positive branch
  (checkability / mapping / sufficiency checks) fires on *either* heading; the negative "NO section"
  branch fires only when **neither** heading is present and stays Minor-never-Major/`status:"pass"`. An
  `## AI-Commander's Intent` block is intent-present, judged identically, plus a Minor note recommending
  the human upgrade path (`/war-strategy <plan>`). `references/lenses.md` — the `intent-vs-plan` prose
  lens mirrors the same rules. Extend `workflow-scaffold.test.mjs`: assert the emitted probe prompt names
  **both** headings in **both** branches — temp-break proof required (revert the prompt, watch the
  assertion fail; [[weak-test-assertion-passes-without-feature-being-exercised]]).
- **requiresTest:** true
- **deps:** []
- **target repo:** superproject

### Task 6 — doctrine records: CONTEXT.md + ADR 0014 + ADR 0013 status note

- **Files:** `CONTEXT.md`, `docs/adr/0014-ai-commanders-intent.md` (new),
  `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- **Plan slice:** `CONTEXT.md` gains the four spec §6 terms — **Survey manifest**, **AI-Commander's
  Intent**, **Scorched-earth sweep**, **Protected core** (with their *Avoid:* lines) — and the
  **Commander's Intent** entry is amended with the one exception. Glossary discipline: terms only, no
  implementation detail. ADR 0014 per spec §7: "AI-Commander's Intent — the sanctioned synthetic-intent
  exception"; records the trade-off (un-cronable pipeline vs. Lead-invented intent → provenance-marked
  heading + predecessor-consistency check); status: amends ADR 0013. ADR 0013 gains a status note linking
  0014. (0014 assumed next-free — re-verify by `ls docs/adr/` at impl time.)
- **requiresTest:** false
- **deps:** []
- **target repo:** superproject

### Task 7 — README Pro Tip rewrite

- **Files:** `README.md`
- **Plan slice:** keep the `### Pro Tip` heading; replace the body with the spec §4.0 four-command
  sequence (`/war-survey-corps` → `/war-machine` → `/war-campaign docs/roadmaps/<date>-<slug>-roadmap.md`
  → `/war-aftermath`) and the autonomous-mode note (every step cron-able; `/war-campaign` unattended by
  default with **no operator flags** — it passes `--afk --ace` to each `/war` itself; the clean-tree
  prerequisite is owned by `/war-machine --afk`'s closing commit). None of the three replaced prose
  blocks may survive (criterion 6). Add the `--afk --scorched-earth` **"dangerously destructive"**
  callout (criterion 3's README half — literal token for T10). Do **not** touch `## Status` — the
  release task owns that slot.
- **requiresTest:** false (pinned by T10)
- **deps:** []
- **target repo:** superproject

### Task 8 — war-help card +3 rows

- **Files:** `skills/war-help/SKILL.md`
- **Plan slice:** the command table gains one row each for `/war-survey-corps`, `/war-machine`,
  `/war-aftermath` in pipeline order — ten commands total counting `/war-help` (criterion 7). Keep the
  card's every-claim-is-a-link discipline (rows link README anchors; `#pro-tip` exists). Update the
  frontmatter `description:` command-set enumeration to match
  ([[default-flip-must-audit-all-doc-surfaces]] — the card's own description is a doc surface).
- **requiresTest:** false
- **deps:** []
- **target repo:** superproject

### Task 9 — war-strategy §5 closing offer repoint

- **Files:** `skills/war-strategy/SKILL.md`, `skills/war-strategy/war-strategy-structure.test.sh`
  (conditional — only if it pins §5 tokens)
- **Plan slice:** §5 "Closing offer" stops narrating the manual spin-up-a-workflow pattern and points at
  `/war-survey-corps` (criterion 8), keeping the ponytail-audit/repo-scan optional-seeds caveat if it
  survives the rewrite. Check `war-strategy-structure.test.sh` for assertions pinned to the old §5
  narration; if any, update them **in the same commit**
  ([[relaxed-assertion-test-title-must-update-together]]).
- **requiresTest:** false (existing structure test guards the file; update-in-place if pinned)
- **deps:** []
- **target repo:** superproject

### Task 10 (wave 2) — pipeline structure test

- **Files:** `skills/war-machine/war-pipeline-structure.test.sh` (new)
- **Plan slice:** the criterion-13 structure test, repo `*.test.sh` convention (self-discovered by the
  gate's `find` sweep — no gate edits). Pins the greppable tokens behind: **criterion 2** —
  `war-aftermath` frontmatter has `disable-model-invocation: true`, `war-survey-corps` + `war-machine` do
  **not**, checked against single-line AND YAML-block frontmatter forms
  ([[frontmatter-tools-negation-check-single-line-only]]); **criterion 3** — "dangerously destructive"
  tied to `--afk` + `--scorched-earth` in BOTH `skills/war-aftermath/SKILL.md` and `README.md`;
  **criterion 4** — all five heading surfaces name both `## Commander's Intent` and
  `## AI-Commander's Intent` (`skills/war/SKILL.md`, `workflow-scaffold.js` both branches, `lenses.md`,
  `schemas.md`, `design.md`) and `workflow-template.js` comments no longer assert the single-heading
  contract; **criterion 9** — both survey + machine SKILL.mds state `.claude/aot/YYYY-MM-DD-survey.json`
  AND the `--git-common-dir` main-checkout anchor; machine's states the selection precedence and
  consumed-stamp semantics; **criterion 10** — machine's predecessor-consistency instruction,
  skip-and-report rule, `--afk` no-fresh-manifest rule, `--afk` closing commit. Temp-break proof per
  token family ([[weak-test-assertion-passes-without-feature-being-exercised]]): each assertion shown to
  fail against a reverted surface before final commit.
- **requiresTest:** true (the deliverable IS the test)
- **deps:** [1, 2, 3, 4, 5, 7]
- **target repo:** superproject

### Task 11 (wave 2) — plugin.json skill registration

- **Files:** `.claude-plugin/plugin.json`
- **Plan slice:** append `./skills/war-survey-corps`, `./skills/war-machine`, `./skills/war-aftermath` to
  the `skills` array (currently seven entries, one line) → ten total (criterion 1). **No version change**
  — the release phase owns the `version` field; this task touches only the `skills` array.
- **requiresTest:** false
- **deps:** [1, 2, 3] (defensive wave edge: the entries point at dirs those tasks create)
- **target repo:** superproject

---

## Phase 2 — release

### Task 12 — version bump +0.1.0 across the four canonical slots

- **Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- **Plan slice:** bump **+0.1.0 relative to the version at land time** (the operator at release
  adjudication is authoritative — [[stacked-release-plan-version-literal-lags-operator-target]]) across
  the four canonical slots: `plugin.json` `version`, `marketplace.json` ×2, README `## Status`
  (replace-in-place, [[release-status-is-replace-slot-not-empty-field]]). Verify all four by hand — no
  cross-slot consistency test exists ([[version-slots-no-cross-slot-consistency-test]],
  [[release-bump-slots-canonical-no-badge]] — no badge slot).
- **requiresTest:** false
- **deps:** []
- **target repo:** superproject

---

## Notes / conscious deviations

- **Structure test location:** `skills/war-machine/war-pipeline-structure.test.sh` — the machine is the
  pipeline's hub (criteria 9, 10 both concern it); precedent is in-skill-dir
  (`skills/war-strategy/war-strategy-structure.test.sh`). One test file, not one per skill.
- **Single content phase with dep waves** instead of the corpus's older dependency-⇒-phase-edge shape:
  dep-wave visibility landed with ADR 0012 / PR #448, so T10/T11 ride wave 2 of Phase 1 rather than a
  third phase. Release remains its own phase (rule 4).
- **T11 waved defensively:** plugin.json's `skills` entries reference dirs T1–T3 create; nothing textual
  requires the wave, but a validation of listed paths would fail off the frozen tip.
- **ADR number 0014** assumed next-free (`docs/adr/` currently ends at 0013) — re-verify at impl time.
- **T9 conditionally touches its structure test** — same task owns both files, so no collision.
- **The `--afk` closing commit is operator-ratified** (plan-authoring volley, 2026-07-02) — no longer
  veto-able; red-team ratifies, doesn't re-open.
- **Criterion 14's tokens ride T3's content** and are hand-verified; the spec pins only criteria
  2/3/4/9/10 in the structure test (see Open decisions).

## Open decisions (resolved by /red-team)

1. **Running-session mtime window (T3):** this plan sets 24 h (conservative — protects idle-but-open
   sessions at the cost of sparing some dead worktrees until tomorrow). Ratify or tighten; the spec
   explicitly routes this probe to red-team.
2. **Pin criterion 14 in T10 too?** The spec's criterion 13 pins 2/3/4/9/10 only; adding the dead-run
   routing + active-predicate tokens to the structure test is cheap. Red-team decides whether the extra
   pin is worth the brittleness.
