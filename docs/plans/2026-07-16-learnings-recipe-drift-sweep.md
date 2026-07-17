# Learnings recipe-drift sweep — a Lead-run retired-token sweep catches stale command recipes in memory lessons when land/merge/escalation mechanics change

Plan file: `docs/plans/2026-07-16-learnings-recipe-drift-sweep.md`
Source spec: [docs/specs/2026-07-16-learnings-recipe-drift-sweep-design.md](../specs/2026-07-16-learnings-recipe-drift-sweep-design.md)
Issues addressed: #930
Stacks on: `docs/plans/2026-07-16-structural-test-integrity.md` — **queue position 3** in its campaign; expected integration base is the **working tip after structural-test-integrity lands** (including its release bump), itself stacked on `2026-07-16-land-failure-recovery` (ADR 0011 stack-and-plow). Verified contention (2026-07-16, both predecessor plans read in full):

- `skills/war/SKILL.md` — shared with **land-failure-recovery** (position 1). Its Task 1.2 edits the `Run **one Workflow per phase**` launch paragraph, the §4.3 `held:land-failed` bullet, the "Resume vs. recovery relaunch" paragraph, the `/war` usage line, and the `held:phase-incomplete` resume bullet. This plan inserts a **new paragraph at a different named construct** — immediately after the **per-phase gh-write batch paragraph** (the `Then run …gh-preflight.sh…` paragraph under `## Per phase (in DAG order)`), before the **Post-servitor publication (Gate 2)** block — and must **rebase over the sibling's landed edits, neither modifying nor duplicating them**. Adjacency note: the sibling's nearest hunk (the launch paragraph) sits several lines above the insertion point with the Workflow outcome bullets between, so rebase context windows are expected non-overlapping; if a context collision occurs anyway, re-apply by the named anchor, never by offset.
- `CONTEXT.md` — shared with **land-failure-recovery** (its Task 1.5 adds the **Staged phase script** and **Dead-agent land failure** glossary entries). This plan adds a different named entry (**Retired-token sweep**, anchored after the existing **Phase-close coherence sweep** entry); same rebase-over duty. **Roadmap-author note (grill Q28):** plan 1's own contention header under-lists this overlap (it names only `workflow-template.test.mjs` / `skills/war/SKILL.md` / `war-campaign/SKILL.md`) — the campaign roadmap's shared-file contention table must carry `CONTEXT.md → plans 1 + 3`; recorded here because this plan cannot edit a sibling plan.
- `docs/learnings/` — **adjacent to, and file-disjoint from, structural-test-integrity** (position 2): its Task 1.3 edits `glob-literal-fools-block-comment-strip-regex-in-structural-tests.md` and `pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan.md`; this plan's only lesson file is `process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md` — **disjoint file sets, confirmed**. This plan's sweep mechanics and dry run **read** `docs/learnings/` — read-only, unaffected by the sibling's two dated body notes.
- `skills/war/assets/war-config.test.mjs` — **neither predecessor touches it** (verified: land-failure-recovery pins its doc-contract G as stay-green-untouched; structural-test-integrity's census work lives entirely in `workflow-template.test.mjs`/`workflow-scaffold.test.mjs`). This plan appends one test at the tail of the existing `doc-contract:` family — additive-only.
- Release slots — all three campaign plans bump the four slots, **serial by stack order**, each resolved from the **live slots** at land time (never a plan literal).

> **Spec deviation notice (verified 2026-07-16, adversarial-grill adjudication):** three spec details are corrected by this plan, reality winning in each case. (1) **§4 step-3's bare query command is wrong as written**: `node skills/_shared/war-memory.mjs query '<mechanism terms>'` searches **nothing** under the live CLI — `resolveRoots` has **no cwd fallback** (its own comment: read verbs treat an absent local root as an **empty corpus**; only `--local`/`$CLAUDE_MEMORY_LOCAL` and `--repo`/`$CLAUDE_MEMORY_REPO` resolve roots, and `appendQueryLog` logs nothing without a local root — a flagless query is a *silent no-op*, or a local-only search if an ambient `$CLAUDE_MEMORY_LOCAL` export happens to be set). The clause's fully-flagged invocation is the correction; CLAUDE.md's "stray `./memory` dir" warning describes the pre-fix CLI this comment memorializes and is out of this plan's footprint. (2) **§4 step-4's worked-example outcome is stale**: the token set {`--force-with-lease`, `update-ref`, `ls-remote`, raw `git push`} hits **six** hot lessons at the live tree (`aftermath-remote-stranded-differs-from-local-tip-reachability`, `held-escalation-lead-manual-completion`, `land-advance-push-first-cas-rejected-token`, `process-recipe-lesson-body-is-not-drift-guarded-by-any-test`, `push-to-deleted-pr-branch-silently-recreates-it`, `test-reframe-can-strand-adjacent-branch-coverage`), not two, plus 10 `archive/` files correctly outside scope — and two of the six are hit only by the generic `git push` token in contexts where pushing is still legitimate, which is the adjudication working on a *live-elsewhere* token, not narration. (3) **§3's "local hits named by slug in the phase report" contradicts the spec's own pivotal constraint 2**: the phase report is **mirrored onto the public epic issue** (the gh-write batch paragraph's mirror sentence, verified live), and a local slug is itself content (a real local slug in this project names a gh account). Resolved toward the constraint: gh-mirrored surfaces carry local **counts only**; slugs route to the uncommitted ledger notes. The spec file stays uncorrected (point-in-time record; this plan + the grill record is the authoritative correction, per the `redteam-adjudication-is-authoritative-version-source` lesson).

## Commander's Intent

- **Purpose:** Lesson bodies under `docs/learnings/` carry hand-authored *operational recipes* — numbered
  literal git commands a Lead is told to run (canonical instance: `held-escalation-lead-manual-completion`'s
  old raw `git push … --force-with-lease` step). Unlike hand-mirrored code constants, **no drift-guard
  test, floor, or grep-parity check binds lesson prose** — when a phase retires, renames, or consolidates a
  land, merge, or escalation mechanism, stale recipes survive silently until a human happens to reread them
  (#930, memory-mined from `process-recipe-lesson-body-is-not-drift-guarded-by-any-test`). Mechanize the
  backstop that lesson's "How to apply" paragraph could only describe as manual process: a **Lead-run,
  judgment-triggered, adjudicated, debt-filing** check at every landed phase close. It can never be a
  fail-closed gate, floor, or hook — legitimate teaching narration deliberately names retired tokens, and a
  token can be retired for one procedure while staying live elsewhere — so a hard grep gate would flag
  exactly the lessons that were correctly rewritten; the sweep files debt and records, and **never blocks
  or holds a land**.
- **Method:** One new Lead-run prose step — the **retired-token sweep** — in `skills/war/SKILL.md` under
  `## Per phase (in DAG order)`, anchored immediately after the per-phase gh-write batch paragraph (whose
  preflighted batch its issue filing rides — never a bare `gh` call). Trigger is **Lead judgment at each
  landed phase close** — where "landed" includes a phase the Lead completed **manually** via the §4.3
  escalation-completion recipe (the canonical citing lesson is exactly that path); held phases get no
  record line. The judgment's **mandatory input is the landed phase diff** (working tip before the phase →
  landed tip), informed by the plan slice / Commander's Intent — diff-mandatory so retirements that emerge
  from ace commits or fix rounds, which no plan prose names, are still caught: did this phase retire,
  rename, or consolidate a **land, merge, or escalation mechanism** (a command, script subcommand,
  procedure step, or status token prior lesson prose could cite as a recipe)? Deliberately **not
  plan-declared** — a plan field would reopen the gap whenever the plan forgets, which is the failure mode
  being fixed. Detection is **two nets over the hot corpus only**: (1) literal grep of both **hot** memory
  roots — the repo learnings root (`docs/learnings/`, or a non-null `overrides.learningsTarget`) **read at
  the just-landed tip** (`git fetch origin <working>`, then `git grep <token> origin/<working> --
  docs/learnings/` with `archive/` excluded — never the possibly-lagging session checkout, the
  servitor-verify staleness family; the motivating instance was itself a lesson-touching phase), and the
  Setup-resolved local root (filesystem grep; no git) — for each derived token; this grep is a
  **completeness floor, not a ceiling**: (2) after it, the ranked query
  `node ${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs query '<mechanism terms>' --local
  <Setup-resolved local root> --repo <resolved repo root>` (**both flags are load-bearing** — the CLI has
  no cwd fallback and silently walks an *empty corpus* without them; `--repo` only when the repo root
  resolved, mirroring the prefetch paragraph's discipline), **discarding any `archive/` rows it returns**
  (archived lessons stay queryable forever; cold lessons are `/lessons-learned` territory — both nets stay
  hot-only), then a **bounded hand-scan** — the query's returned rows plus any lesson whose title/keywords
  name the mechanism (order ~6–12 lessons; the verified worked example reads six) — listing each
  same-meaning straggler as a survey-derived correction, with any hit inside a lesson this phase itself
  rewrote adjudicated against the **tip-true** content (`git show origin/<working>:<path>`).
  **Adjudication per hit** (no allowlist file — exemption is a judgment call, and an allowlist is config
  for a judgment call): **load-bearing** = recipe-position (an imperative step the reader is told to run
  now) **and** the recipe as written is no longer the sanctioned path; **exempt** (counted, K) =
  narration-position (past-tense, negated, or teaching mention) **or** still-live-in-context (the token is
  retired only for a specific procedure and this usage is a different, legitimate one — e.g. raw
  `git push` in a lesson about PR-branch pushes; prefer multi-token anchored derivation, e.g.
  `git push` + `--force-with-lease` as a pair, to cut this false-hit class). **Routing:** repo-root
  load-bearing hits → **one consolidated issue per triggering phase**, labeled exactly `war-followup`
  (survey-corps first-class debt input), each hit as lesson slug + the stale recipe fragment (quoted from
  the already-public, already-redaction-linted repo lesson — never from a local lesson) + the replacing
  mechanism + the close condition ("close when each named lesson's recipe is corrected; the correcting
  change cites this issue" — the closer is whoever lands the correction, a later plan task or
  `/lessons-learned` pass), filed **inside the same preflighted per-phase gh-write batch**, **dedup-checked
  first** (`gh issue list --label war-followup --state open` in the batch: an open retired-token issue
  already naming the same mechanism gets this phase's hits as a comment, never a duplicate issue); no
  tip-dependent claims (SHAs) in the body. Local-root hits: **counts only on every gh-mirrored surface**
  (the record line, and the phase report that mirrors onto the public epic issue); slugs + one-line
  adjudications go to the **uncommitted ledger notes only** (`.claude/war/` is git-excluded and never
  gh-mirrored) where the next `/lessons-learned` pass reads them — local lesson body text and local
  filesystem paths appear **nowhere** outside the local machine. **No in-run auto-repair of lesson
  bodies.** A **mandatory record line on every landed phase** (manual completions included), verbatim
  grammar: `retired-token sweep: <tokens> — <N repo hits / M local hits / K exempt>`, with the no-trigger
  arm `retired-token sweep: n/a` and the no-local-root arm
  `retired-token sweep: <tokens> — <N repo hits / local skipped (memory disabled) / K exempt>` — written
  into the phase report + ledger notes; identical under `--afk` (the sweep is Lead-self-adjudicated in
  both modes, never waits, never halts — nothing to escalate that debt-filing doesn't already cover).
  Guardrails: one new `doc-contract:` test in `skills/war/assets/war-config.test.mjs` locks the clause
  (case-insensitive mid-sentence anchors over a clause-scoped slice in the #534 prefetch-clause style —
  **provably red pre-fix**: `retired-token` has zero occurrences in SKILL.md/CONTEXT.md at the authoring
  base, verified 2026-07-16, and neither predecessor introduces it); the clause, the CONTEXT.md entry,
  **and the source lesson** never call the new mechanism a bare "phase-close sweep" (that name is ADR
  0012's findings-queue-driven, engine-dispatched coherence sweep — explicitly untouched, along with
  `workflow-template.js`, `workflow-template.test.mjs`, `agents/*.md`, `skills/lessons-learned/SKILL.md`,
  and `phaseCloseQueue`); the source lesson gains a dated mechanization note citing #930 and the clause —
  **and a surgical correction of its own "How to apply" sentence**, whose "as part of the phase-close
  sweep" phrase is exactly the banned conflation — with the fail-closed redaction lint staying green.
- **End state:**
  1. **Clause present and complete** — `skills/war/SKILL.md` carries the retired-token sweep paragraph
     under `## Per phase (in DAG order)`, immediately after the per-phase gh-write batch paragraph, and
     each element is individually greppable in the clause: the trigger family (retire / rename /
     consolidate a land, merge, or escalation mechanism) judged **from the landed phase diff** (mandatory
     input) plus plan slice / Commander's Intent, at each landed phase close **including Lead
     manual completions**, never plan-declared; the tip-true repo grep (`git grep … origin/<working>`,
     `archive/` excluded) plus the local-root filesystem grep; the grep stated as a **completeness floor,
     not a ceiling** with the fully-flagged ranked `war-memory` query (`--local` and `--repo` both stated
     load-bearing — no cwd fallback, empty corpus without them), archive-row discard, and the bounded
     hand-scan with stragglers as survey-derived corrections; the load-bearing vs exempt adjudication
     including the **still-live-in-context** exempt class and anchored multi-token derivation (no
     allowlist); the routing (repo-root load-bearing → one dedup-checked consolidated `war-followup`
     issue inside the preflighted per-phase gh-write batch, quoting only repo-lesson fragments, carrying
     the close condition; local hits → **counts only on gh-mirrored surfaces, slugs in the uncommitted
     ledger notes only**); the memory-disabled skip arm; never-blocks-a-land; `--afk`-identical; and the
     record-line duty. Proof: End state 3's doc-contract anchors mechanically + a per-element grep review
     on the landing PR (prose truth beyond the anchors is the doc-contract family's known ceiling — see
     Notes).
  2. **Record-line grammar exact and greppable** — the clause states all three arms verbatim (trigger
     arm, `n/a` arm, `local skipped (memory disabled)` arm) with the literal greppable prefix
     `retired-token sweep:`, on **every landed phase** (manual completions included; held phases
     excluded), destination phase report + ledger notes. The prefix and the `n/a` arm are pinned by End
     state 3's test.
  3. **Drift guard red/green** — one new test at the **tail** of the `doc-contract:` family in
     `skills/war/assets/war-config.test.mjs` (additive-only diff; every existing doc-contract test,
     including G on recovery-relaunch, **byte-untouched**): slice the clause in the **#534
     prefetch-clause style** — `readDoc('skills/war/SKILL.md')`, case-insensitive `indexOf` on the
     `retired-token sweep` anchor, region bounded to the next bold-lead-in paragraph (the
     `**Post-servitor publication` block), the same bounding move as the `held:workflow-error` bullet
     test — assert the region sits inside `## Per phase (in DAG order)` (after that heading, before
     `## Resume`), and within the region assert (case-insensitive, mid-sentence anchors — lesson
     `prompt-only-clause-grep-guard-must-tolerate-sentence-case`): the trigger-family tokens (`retire`,
     `rename`, `consolidate`, and `land`/`merge`/`escalation`), the `war-followup` routing token
     (region scope discriminates it from the 3 pre-existing occurrences elsewhere in the file), and the
     record duty (the literal prefix `retired-token sweep:` plus the `n/a` arm). **Red-proof is
     per-anchor, not just whole-clause**: (a) the test run at the pre-edit dispatch base fails on region
     extraction (the anchor token has zero occurrences pre-fix — re-verify at the dispatch base); (b) on
     a scratch copy of the post-edit SKILL.md, deleting each anchor family in turn (a trigger token, the
     `war-followup` token, the record-line literal) flips the test red — all runs pasted as a
     `Red-proof:` block in the commit body. `node --test skills/war/assets/war-config.test.mjs` green
     post-fix.
  4. **Naming hygiene across all three touched prose surfaces** — `grep -in 'retired-token sweep'
     skills/war/SKILL.md CONTEXT.md docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md`
     hits all three; the CONTEXT.md entry's `_Avoid_` line names the ADR 0012 phase-close coherence sweep
     as the thing it is not; none of the three calls the new mechanism a bare "phase-close sweep" — in
     particular the source lesson's "How to apply" sentence no longer reads "as part of the phase-close
     sweep" (Task 1.3's surgical correction). Grep is a floor: a manual read of each edited region backs
     it. Reviewed on the PR (End state 3 covers the SKILL.md hit mechanically).
  5. **Glossary entry** — `CONTEXT.md` gains the **Retired-token sweep** term in the existing entry style
     (bold term, body, `_Avoid_` line), placed after the **Phase-close coherence sweep** entry: Lead-run,
     judgment-triggered at every landed phase close (manual completions included); diff-mandatory
     trigger; two hot-only nets (tip-true grep floor + fully-flagged ranked query + bounded hand-scan);
     load-bearing vs exempt adjudication (narration or still-live-in-context); one dedup-checked
     consolidated `war-followup` issue for repo-root load-bearing hits; local counts on mirrored
     surfaces, slugs in ledger notes; mandatory record line. *Avoid:* conflating it with the ADR 0012
     phase-close coherence sweep (findings-queue-driven, engine-dispatched, fail-open polish); treating
     it as a gate (it never blocks a land); an exemption allowlist (adjudicated per hit); it never edits
     lessons.
  6. **Source-lesson note + phrase correction + lint** —
     `docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md` gains a dated
     (2026-07-16 or later) **additive** mechanization note in the body citing #930 and the retired-token
     sweep clause under `## Per phase (in DAG order)` in `skills/war/SKILL.md` (named construct, never a
     line number; annotated *defined-but-not-yet-emitted; produced in Task 1.1, same phase*), worded
     **"Mechanized (#930, <date>)"** — deliberately **not** a `[RESOLVED]` literal, so the lesson does not
     become a `/lessons-learned migrate` archive candidate: the residual gap (a Lead can misjudge `n/a`)
     keeps the lesson's warning live, and its one inbound wikilink (from the archived
     `status-equality-leak-detector…` lesson, verified 2026-07-16) needs no repair since the lesson stays
     hot and in place. The body's "How to apply" sentence gets the **one surgical correction** — "as part
     of the phase-close sweep" → "as part of the retired-token sweep (mechanized 2026-07-16, #930)" — and
     is otherwise untouched as the origin record; frontmatter `description`/`keywords` untouched (no
     MEMORY.md projection impact). `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  7. **Worked-example dry run recorded, tip-pinned** — Task 1.1's worker executes the sweep procedure for
     tokens {`--force-with-lease`, `update-ref`, `ls-remote`, raw `git push`} over `docs/learnings/`
     (repo root only) at its dispatch tree, runs the fully-flagged ranked query
     (`--repo docs/learnings`; `--local` per the live CLI's requirement — a flagless query silently
     searches an empty corpus, which is itself part of what the dry run demonstrates), adjudicates every
     hit, and records commands + per-hit adjudication as a `Dry-run:` block in the commit body. Expected
     at authoring (re-verified at the dispatch tree): **six hot lessons hit** —
     `aftermath-remote-stranded-differs-from-local-tip-reachability`,
     `held-escalation-lead-manual-completion`, `land-advance-push-first-cas-rejected-token`, the source
     lesson itself, `push-to-deleted-pr-branch-silently-recreates-it`,
     `test-reframe-can-strand-adjacent-branch-coverage` — plus ~10 `archive/` files correctly excluded by
     scope; **all six adjudicated exempt** (narration-position, or still-live-in-context on the generic
     `git push` token), **zero follow-ups filed** — that outcome is the adjudication rule working on a
     realistic six-lesson read (the sweep's true per-firing cost: minutes, not hours), not the sweep
     failing. Repo root only: nothing from any local root enters the committed artifact.
  8. **Diff-scope negative check, per phase** — the **Phase 1** diff touches only the four content files
     (`skills/war/SKILL.md`, `skills/war/assets/war-config.test.mjs`, `CONTEXT.md`,
     `docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md`); the **Phase 2**
     diff touches only the three release-slot files — and the full landing diff touches **none of**
     `workflow-template.js`, `workflow-template.test.mjs`, `agents/*.md`,
     `skills/lessons-learned/SKILL.md`, `skills/war-review/SKILL.md`, or ADR 0012. Reviewed on the PR /
     gate-audit execution-evidence lens.
  9. **Suite green** — `node --test 'skills/**/*.test.mjs'` passes at the landed tip (the existing
     `no stale _polish token` doc-contract sweep over SKILL.md + CONTEXT.md stays green — the new prose
     adds no `_polish` token).
  10. **Release** — all four version slots bump in lock-step to the next free patch above the live
      integration base; `skills/war/assets/version-slots.test.mjs` is the arbiter.

## Build order (for /war)

- **Contention (verified):** queue position 3 — `skills/war/SKILL.md` and `CONTEXT.md` overlap
  land-failure-recovery (position 1) at **different named constructs**, and the `docs/learnings/`
  adjacency with structural-test-integrity (position 2) is **file-disjoint** — cross-plan, serial
  overlaps handled by rebasing onto the post-land tip, never a same-phase collision. Within this plan all
  Phase-1 tasks are file-disjoint.
- **Why one content phase:** every surface can land together; there are no cross-task symbol dependencies
  (Tasks 1.2/1.3 reference the clause by named construct, annotated defined-but-not-yet-emitted), so
  Phase 1 runs as one wave, no `deps` edges. The clause and its drift guard interlock and are forced into
  one task (Task 1.1) — the guard travels with the fact it guards, same commit.

1. **Phase 1 — Retired-token sweep clause, drift guard, glossary term, and lesson note**
   (wave 1: Task 1.1 ∥ 1.2 ∥ 1.3, file-disjoint; no waves)
2. **Phase 2 — Release** (four version slots, lands last per doctrine)

## Phase 1 — Retired-token sweep clause, drift guard, glossary term, and lesson note

### Task 1.1: The SKILL.md clause + its doc-contract drift guard (coupled task)

- Files: `skills/war/SKILL.md`, `skills/war/assets/war-config.test.mjs`
- Plan slice: **First act: rebase onto the integration tip** — land-failure-recovery's SKILL.md edits
  (launch-paragraph staging step, §4.3 bullets, Resume-paragraph additions) are on that tip; insert
  around them, neither modifying nor duplicating them (nearest sibling hunk is the launch paragraph,
  expected non-overlapping — on any context collision, re-apply by the named anchor, never by offset).
  - **The clause (`skills/war/SKILL.md`):** one new paragraph under `## Per phase (in DAG order)`,
    immediately **after** the per-phase gh-write batch paragraph and **before** the **Post-servitor
    publication (Gate 2)** block. Suggested lead-in `**Retired-token sweep (every landed phase;
    #930).**` — house bold-lead-in style; exact wording is worker latitude **within the End state 1
    element list and End state 3 anchors** (the checkable pair). Required content, in order: (1) the
    trigger — at each landed phase close, **including a phase the Lead completed manually via the §4.3
    escalation-completion recipe** (held phases get no record line), judge **from the landed phase diff**
    (mandatory input — ace/fix-round commits carry retirements no plan prose names), informed by the plan
    slice / Commander's Intent: did this phase retire, rename, or consolidate a **land, merge, or
    escalation mechanism** (a command, script subcommand, procedure step, or status token prior lesson
    prose could cite as a recipe)? Never plan-declared; no trigger → write the `n/a` record line and
    stop. (2) token derivation — the *old* mechanism's literal command fragments, per-refactor and
    Lead-derived (no hardcoded list), **anchored multi-token pairs preferred** (e.g. `git push` +
    `--force-with-lease`) to cut still-live false hits. (3) the two nets, hot corpus only — the repo
    learnings root (`docs/learnings/` or non-null `overrides.learningsTarget`) grepped **at the
    just-landed tip**: `git fetch origin <working>` then `git grep <token> origin/<working> --
    docs/learnings/` with `archive/` excluded — never the possibly-lagging session checkout; plus a
    filesystem grep of the Setup-resolved local root (`archive/` excluded); **this grep is a completeness
    floor, not a ceiling** — after it, run
    `node ${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs query '<mechanism terms>' --local
    <Setup-resolved local root> --repo <resolved repo root>` (**both flags load-bearing**: the CLI has no
    cwd fallback and a flagless query silently walks an empty corpus; `--repo` only when the repo root
    resolved — the prefetch paragraph's flag discipline), **discard any `archive/` rows** the query
    returns (cold lessons are `/lessons-learned` territory — both nets stay hot-only), and **hand-scan,
    bounded**: the query's returned rows plus any lesson whose title/keywords name the mechanism (order
    ~6–12 lessons), listing each same-meaning straggler as a survey-derived correction; adjudicate any
    hit in a lesson this phase itself rewrote against the tip-true content
    (`git show origin/<working>:<path>`). (4) adjudication per hit — **load-bearing** = recipe-position
    *and* no longer the sanctioned path; **exempt (counted)** = narration-position *or*
    still-live-in-context (retired for one procedure, legitimate in this usage); **no allowlist file**.
    (5) routing — repo-root load-bearing hits: **one consolidated issue per triggering phase**, label
    exactly `war-followup`, **dedup-checked inside the preflighted batch** (`gh issue list --label
    war-followup --state open`; an open retired-token issue naming the same mechanism gets this phase's
    hits as a comment instead), each hit as lesson slug + stale recipe fragment (quoted only from the
    already-public repo lesson) + replacing mechanism, plus the close condition ("close when each named
    lesson's recipe is corrected; the correcting change cites this issue"); no tip-dependent claims
    (SHAs) in the body; never a bare `gh` call. Local-root hits: **counts only on gh-mirrored surfaces**
    (the record line; the epic-mirrored phase report); slugs + one-line adjudications in the
    **uncommitted ledger notes only**, where the next `/lessons-learned` pass reads them; local body text
    and local paths appear nowhere else. Repo-root exempt hits are named (slug + one-line reason) in the
    phase report so K is auditable. **No in-run auto-repair of lesson bodies.** (6) the record line,
    every landed phase, verbatim grammar per End state 2 (trigger arm / `n/a` arm /
    `local skipped (memory disabled)` arm when memory was disabled at Setup — the repo root is still
    swept whenever it exists), written into the phase report + ledger notes. (7) the sweep **never
    blocks or holds a land** (a detection step that routes findings, ADR 0017-consistent), runs
    **identically under `--afk`** (Lead-self-adjudicated in both modes, never waits), and is **not** the
    ADR 0012 phase-close coherence sweep — never call it a bare "phase-close sweep".
  - **The drift guard (`skills/war/assets/war-config.test.mjs`):** one new test appended at the **tail**
    of the `doc-contract:` family (additive-only; every existing doc-contract test, including G,
    byte-untouched; suggested title: `doc-contract: SKILL.md Per-phase retired-token sweep clause —
    trigger family, war-followup routing, record line (#930)`), in the family's house style per End
    state 3: `readDoc` + lowercase + `indexOf` clause slicing bounded at the `**Post-servitor
    publication` lead-in (#534-pattern), section containment, trigger-family / region-scoped
    `war-followup` / record-literal anchors — mid-sentence anchors only, never whole sentences
    (rewording tolerance). **Red-proof duty per End state 3**: pre-fix red at the dispatch base +
    per-anchor scratch-copy deletions each red, pasted as the commit-body `Red-proof:` block.
  - **Dry run (End state 7):** execute the worked example over `docs/learnings/` at the dispatch tree —
    token greps, fully-flagged ranked query, bounded hand-scan, per-hit adjudication — recorded as the
    commit-body `Dry-run:` block. Expected six hot hits, all exempt, zero follow-ups (re-verify counts at
    the dispatch tree — authoring-base snapshot, non-authoritative). Repo root only; nothing local enters
    the committed artifact.
  - **Grep-is-a-floor note (every token-sweep instruction in this task):** the dry run's greps and the
    naming-hygiene grep are completeness floors — each is followed by the mandatory manual same-scope
    survey (hand-scan of hit lessons / a read of the edited SKILL.md region), stragglers listed as
    survey-derived corrections in the commit body.
- requiresTest: true (mapped evidence: the new doc-contract test in `war-config.test.mjs` in this diff,
  matched by the `skills/**/*.test.mjs` floor pattern)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: CONTEXT.md — the Retired-token sweep glossary term

- Files: `CONTEXT.md`
- Plan slice: Add the **Retired-token sweep** entry per End state 5, in the existing entry style (bold
  term + colon, short body, `_Avoid_:` line), anchored **immediately after the Phase-close coherence
  sweep entry** (the two sweeps' distinction reads side by side; named construct, never a line number).
  Body per End state 5 (trigger incl. manual completions and the diff-mandatory input; two hot-only nets
  with the flagged query; load-bearing vs exempt incl. still-live-in-context; dedup-checked consolidated
  `war-followup` issue; local counts on mirrored surfaces, slugs in ledger notes; record line; files debt
  and records, never edits lessons, never blocks a land). `_Avoid_:` conflating it with the ADR 0012
  phase-close coherence sweep (findings-queue-driven, engine-dispatched, fail-open polish); treating it
  as a gate; an exemption allowlist. References the SKILL.md clause by named construct —
  *defined-but-not-yet-emitted; produced in Task 1.1 (same phase)*. Adds no `_polish` token (the existing
  doc-contract sweep over CONTEXT.md stays green). Rebase note: land-failure-recovery's Task 1.5 adds two
  glossary entries elsewhere in this file — rebase over them untouched.
- requiresTest: false — prose-only glossary entry (docs tier); the End state 4 naming-hygiene grep and PR
  review are the guard (no-test route recorded here for the floor; the asymmetry with the SKILL.md
  clause's mechanical guard is deliberate — see Notes)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Source-lesson mechanization note + "How to apply" phrase correction

- Files: `docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md`
- Plan slice: Two body edits per End state 6, nothing else. (a) One dated (2026-07-16 or later)
  **additive** note — worded **"Mechanized (#930, <date>): …"**, deliberately not a `[RESOLVED]` literal
  (keep-hot: the judgment-trigger residual keeps the warning live, and `/lessons-learned migrate` treats
  RESOLVED literals as archive candidates) — citing the retired-token sweep clause under
  `## Per phase (in DAG order)` in `skills/war/SKILL.md` (two hot-only nets, load-bearing/exempt
  adjudication, one dedup-checked consolidated `war-followup` issue, mandatory record line) and its
  `doc-contract:` guard in `skills/war/assets/war-config.test.mjs` — both by named construct, annotated
  *defined-but-not-yet-emitted; produced in Task 1.1 (same phase)*, never line numbers or test-title
  bytes. (b) The **surgical phrase correction** in the existing "How to apply" sentence: "as part of the
  phase-close sweep" → "as part of the retired-token sweep (mechanized 2026-07-16, #930)" — the lesson
  predates the vocabulary split and its current phrasing names exactly the ADR 0012 mechanism that
  deliberately does *not* do this. Everything else — including the verification note and the Related
  links — stays untouched as the origin record; frontmatter `description`/`keywords` untouched (body
  edits only, no MEMORY.md projection impact). The note carries no home paths, emails, handles, or
  credential shapes — check `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  Inbound-link check performed at authoring (2026-07-16): one inbound wikilink, from the **archived**
  lesson `status-equality-leak-detector-false-positive-ceiling-on-mergeresult-prose` — the lesson is not
  retired or moved, so no link repair is due.
- requiresTest: false — docs-tier (lesson body only); the fail-closed redaction lint is the guard
  (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan rewrites shipped skill prose (`skills/war/SKILL.md`) and a shipped test asset
  (`war-config.test.mjs`) — users only receive it via a release. Bump all four release slots together to
  the **next free patch above the live integration base at land time** (never a resolved semver literal,
  per the /war-strategy §2 next-free-patch convention): `plugin.json` `version`, `marketplace.json`
  `metadata.version` **and** `plugins[0].version`, and the `README.md` `## Status` line
  (replace-in-place, never emptied, no badge). Expected integration base: the working tip after this
  plan's Phase 1 lands, which stacks on the tip left by structural-test-integrity **including its own
  release bump** (queue position 3) — resolve from the **live slots**, never from any version literal in
  any plan of this campaign (stacked-release lag lesson). Standalone fallback: a run of this plan through
  plain `/war` resolves the next free patch from the four slots itself.
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red test
  (End state 10).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- First live firing of the sweep: at a future `/war` phase (on the released plugin) that actually
  retires/renames/consolidates a land/merge/escalation mechanism, the record line shows a non-`n/a` sweep
  with adjudicated counts, any repo-root load-bearing hit files exactly **one** dedup-checked consolidated
  `war-followup` issue inside the preflighted batch, and **every** landed phase in between carries the
  `retired-token sweep:` record line (`n/a` allowed) · why deferred: the trigger is Lead judgment over a
  future refactor — no in-repo test can exercise a live judgment call; the automated proxy is the
  doc-contract clause lock (End state 3) plus the Task 1.1 dry-run artifact (End state 7) · runner:
  **the operator, reading the epic-mirrored phase reports and ledger notes** — stated honestly:
  `/war-review` does **not** mechanically ingest this record line today (it mines run manifests and
  workflow transcripts, neither of which carries the phase report), and a `/war-review` ingestion
  extension is deliberate future debt outside this plan's spec-scoped footprint, filed only if the
  honor-system record proves insufficient.
- Dry-run-discovered load-bearing hits: any load-bearing hit the Task 1.1 worked example finds at its
  dispatch tree (expected zero — all six known hits adjudicate exempt at authoring) is
  found-but-not-fixed in-task · why deferred: lesson-body repair is outside Task 1.1's Files, and the
  spec forbids in-run auto-repair — a plan that retires a mechanism owns its lesson rewrite as an
  explicit task; the sweep's output is debt, not edits · runner: the Lead files one consolidated
  `war-followup` issue at phase close, from the `Dry-run:` block (ADR 0017 — named owner, never a prose
  waiver).

## Notes / conscious deviations

- **Grill dispositions (2026-07-16), where not already embedded above:**
  - **Q1 — trigger family stays land/merge/escalation (changed nothing, argued):** #930 and the source
    lesson scope exactly this family, the spec's design tree ratified it, and spec §9 already defers
    wider recipe-rot (e.g. memory-CLI recipes — ironically instanced by the spec's own Q8 defect) to
    `/lessons-learned`'s generic on-demand verification "until evidence shows the generic pass missing
    them". Widening the family multiplies every phase's judgment burden for a class with a standing net;
    re-scoping a ratified tree without evidence is scope creep, not diligence.
  - **Q2 — landed diff is the mandatory trigger input** (changed-plan): ace commits and fix rounds
    introduce retirements no plan prose names; judging from prose alone re-opens the gap for emergent
    changes.
  - **Q3 — manual completions covered** (changed-plan): "landed" includes the §4.3
    escalation-completion path — the canonical citing lesson (`held-escalation-lead-manual-completion`)
    is exactly a manually-completed phase; excluding it would exempt the motivating case.
  - **Q6 — still-live-in-context exempt class + anchored token pairs** (changed-plan): verified live —
    two of the six worked-example hits are generic `git push` usages in lessons where pushing remains
    sanctioned; a two-bucket narration-only model would misfile them. The record token is accordingly
    `K exempt` (spec literal `narration-exempt` refined — conscious deviation, reality wins).
  - **Q8 — the spec's bare query command is corrected by the clause** (changed-plan, header notice):
    verified in `resolveRoots` — no cwd fallback, absent roots = silently empty corpus, no query log
    without `--local`; the current code is authoritative over CLAUDE.md's older stray-`./memory` warning
    (that warning memorializes the pre-fix CLI; CLAUDE.md is out of footprint and high-contention — not
    edited here, noted for a doc-truth sweep).
  - **Q10 — corpus scope reconciled hot-only across both nets** (changed-plan): archived lessons stay
    queryable forever, so the ranked net *will* surface `archive/` rows the grep net excluded — the
    clause discards them (cold is `/lessons-learned` territory, spec §9).
  - **Q11 — memory-disabled skip arm** (changed-plan): a distinct, greppable record variant
    (`local skipped (memory disabled)`); the repo root is still swept whenever it exists.
  - **Q12 — K auditable** (changed-plan): repo-root exempt hits named slug + reason in the phase report
    (repo slugs are already public); local-root detail lives in the uncommitted ledger notes.
  - **Q13 — visibility claim stated honestly** (changed-plan): the record line is operator-audited via
    the epic mirror and ledger; `/war-review` ingestion is explicitly *not* claimed (see backstop 1) —
    the spec's "visible to /war-review" sentence overstated today's ingestion surfaces.
  - **Q15 — tip-true sweep** (changed-plan): fetch-first `git grep` at `origin/<working>` for the repo
    net; hand-scan adjudication against `git show origin/<working>:<path>` for phase-rewritten lessons.
    The ranked query walks the checkout filesystem (its role is recall/candidate discovery); final
    adjudication is tip-true.
  - **Q16/Q17/Q29 — test mechanics pinned** (changed-plan): #534-style clause slicing named; per-anchor
    red-proof; family-tail additive-only placement with doc-contract G byte-untouched.
  - **Q18 — CONTEXT.md entry deliberately unguarded** (deviation-note): the spec ratified exactly one
    doc-contract test (SKILL.md); glossary entries are broadly unguarded repo-wide except the `_polish`
    sweep, and opening a new guard class for a glossary paragraph is the same declined class as plan 1's
    engine-comment residual. Accepted residual.
  - **Q19 — cross-phase dedup** (changed-plan): `gh issue list --label war-followup --state open` inside
    the preflighted batch; same-mechanism open issue gets a comment, never a duplicate.
  - **Q20 — `--afk` arm** (deviation-note): the sweep is Lead-self-adjudicated in *both* modes (the
    interactive mode never asked the operator to adjudicate hits either) and never waits or halts, so
    `--afk` changes nothing and no record-line marker is added — the run's afk-ness is already recorded
    in the run manifest's `configProfile`, and a per-line marker would duplicate it.
  - **Q21 — issue-body redaction** (already-covered, made explicit): the only quoted fragments are from
    repo-root lessons — committed, public, and already through the fail-closed redaction lint at
    promotion time; local content is never quoted (Q22 routing). No new lint surface needed.
  - **Q22 — local information on gh-mirrored surfaces** (changed-plan, header notice): counts only;
    slugs are content (a live local slug in this project names a gh account) and the phase report
    mirrors onto the public epic — slugs live in the uncommitted, non-mirrored ledger notes where
    `/lessons-learned` reads them. Resolved toward the spec's own pivotal constraint 2, which outranks
    its routing-table row.
  - **Q25 — banned vocabulary in the touched lesson** (changed-plan): Task 1.3 surgically corrects the
    "How to apply" sentence's "phase-close sweep" phrase — the one guaranteed-touched file carried the
    exact conflation the naming-hygiene criterion bans; End state 4 now sweeps all three prose surfaces.
  - **Q26 — keep-hot wording chosen deliberately** (deviation-note): "Mechanized (#930, …)", not a
    `[RESOLVED]` literal — the judgment-trigger residual keeps the lesson's warning live and out of
    archive candidacy; inbound links verified (one, from an already-archived lesson; no repair due).
  - **Q31 — hand-scan bounded, per-phase placement defended** (deviation-note): the scan is the query's
    returned rows plus title/keyword matches (~6–12 lessons; the verified worked example is six —
    minutes). Per-phase beats aftermath-time batching because the retiring diff and intent are in the
    Lead's context at phase close, `/aftermath` is never auto-invoked, and batching would let a whole
    campaign's recipes rot before the first sweep — the spec's placement tree already rejected the
    deferred homes.
- **Q5 cost model corrected** (header notice): the worked example reads six hot lessons, not two; the
  per-firing cost statement and dry-run expectations above reflect the measured hit set, re-verified at
  the dispatch tree (authoring-base snapshot, non-authoritative).
- **Q30 diff-scope check rescoped per phase** (End state 8): the Phase-2 release bump is part of the
  landing diff by design; the four-content-file bound applies to Phase 1's diff, the three-slot bound to
  Phase 2's.
- **Q28 roadmap duty recorded in the header:** plan 1's contention header under-lists `CONTEXT.md`; the
  campaign roadmap's shared-file contention table must carry `CONTEXT.md → plans 1 + 3`. This plan
  cannot edit a sibling plan — the note rides here for the roadmap author.
- **Q32 — revert units:** Task 1.1's two files revert only **as a pair** (clause without guard = naked
  fact; guard without clause = red suite). Tasks 1.2 and 1.3 are independently revertible prose. The
  Phase-2 bump reverts per stack doctrine (slots re-resolve from the live base).
- **No Checkpoint-template edit:** the record-line duty lives in the clause itself (destination: phase
  report + ledger notes); the `## Checkpoint` phase-report template is deliberately untouched — spec §5
  names exactly four content files, and the report already flows to the epic-issue mirror where the line
  becomes operator-auditable.
- **Task 1.1 is deliberately one coupled task:** the clause and its doc-contract guard move in the same
  commit (the drift guard travels with the fact it guards); splitting the test into a later task would
  ship the clause a phase naked and make the pre-fix red-proof unrunnable against its own base.
- **Doc-contract test locks tokens, not semantics** — a reworded-but-hollow clause could keep the
  anchors; accepted, same ceiling as every test in the family
  (`structure-test-check-f-locks-presence-anywhere` lesson). End state 1's per-element grep review on the
  PR is the human half of the pair.
- **The sweep's own greps are floors** (clause-mandated second net + hand-scan), and every token-sweep
  instruction *in this plan* (dry run, naming-hygiene grep) carries the mandatory manual same-scope
  survey with stragglers listed as survey-derived corrections.
- **Explicitly untouched surfaces (spec §5/§9):** `skills/war/assets/workflow-template.js`,
  `workflow-template.test.mjs`, `agents/war-servitor.md` (and all `agents/*.md`),
  `skills/lessons-learned/SKILL.md`, `skills/war-review/SKILL.md`, `phaseCloseQueue`, the plan/spec
  templates in `skills/war-strategy/SKILL.md`, CLAUDE.md, and `archive/`. End state 8 is the negative
  check. No new ADR (spec §7 — a Lead-duty prose step plus its drift guard moves no architectural
  boundary; ADR 0012 is referenced, never amended).
- **requiresTest/tier routing:** Tasks 1.2/1.3 are docs-tier (prose/lesson only; redaction lint and PR
  review are their guards); Task 1.1 routes the base worker tier with mapped `skills/**/*.test.mjs`
  evidence in-diff; requiresPackaging false everywhere (meta-repo, no Dockerfile in the footprint).
- **Anchors by named construct throughout** — the per-phase gh-write batch paragraph, the
  **Post-servitor publication (Gate 2)** block, the **Phase-close coherence sweep** CONTEXT.md entry,
  the `doc-contract:` family tail, the "How to apply" paragraph — never line numbers (they rot across
  the serial merge queue; this plan's grep results and hit counts are authoring-time snapshots,
  re-verified at dispatch).

## Open decisions

- None — the spec's resolved design tree survived conversion with three reality-corrected details
  (flagged query invocation, six-lesson worked example, count-only local routing — header deviation
  notice), and every grill question is dispositioned in the Notes. The Commander's Intent was ratified
  by the operator at the conversion volley (2026-07-16).
