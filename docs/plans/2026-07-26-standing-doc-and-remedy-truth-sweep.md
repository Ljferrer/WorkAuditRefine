# Standing-doc, release-prose & remedy-path truth sweep — seven surfaces converge on what their own code enforces

Source spec: `docs/specs/2026-07-26-standing-doc-and-remedy-truth-sweep-design.md` (issues #1153,
#1115, #1146, #1152, #1107, #1136, #1096 — every anchor below re-verified live on this working
tree: the README `## Status` blurb carries both overclaims, ADR 0019's Amendment carries the
one-site clause, the "restarts per banner" and "(b)+(c)+(d) TOGETHER" comments are present, the
war-review `## 3` total rows read "manifest `phases[].envelope`, else mined" with zero
mixed-source language in the file, the Gate-2 pre-push bullet's remedy never touches the branch
ref, and `agents/war-worker.md`'s escalation section offers `PLAN-DEFECT:` as its only
classification token).

**Cross-plan ordering (binding via the roadmap spine):** this plan stacks on the landed tip of
`docs/plans/2026-07-26-dispatch-args-and-floor-coverage.md`. The sole shared non-release file is
`skills/war/SKILL.md` (verified against that plan's actual `Files:` lines — its SKILL.md edit is
the "Stage the per-phase script first (ADR 0037)" launch paragraph, which never touches the
`**Post-servitor publication (Gate 2` construct, so Task 1.6's D22 anchors are byte-stable under
it; `agents/war-worker.md` appears in **no** sibling's footprint and is exclusive to this plan).
This plan's `skills/war/SKILL.md` hunks are authored as construct-anchored insertions against
that plan's landed state, never context-heavy patches (spec §2.1, §8). The **enforcing** record
of this ordering is the campaign roadmap's spine entry (this plan sequenced after dispatch-args);
this paragraph is the rationale, not the mechanism. Relative to
`2026-07-26-war-memory-cli-correctness` this plan is **unordered** — zero shared non-release
files — and needs no interleaving tolerance: stack-and-plow (ADR 0011) lands each plan whole
(both phases) before the next starts, so no sibling release can land between this plan's Phase 1
and Phase 2; a sibling release landing *before* Phase 1 is handled inside Task 1.1.

## Commander's Intent

- **Purpose:** make seven live doc/comment surfaces tell the truth their adjacent code, ADR, or
  procedure already enforces — six prose/comment corrections (#1153, #1115, #1146, #1152, #1107,
  #1096) and one real remedy-path defect (#1136: the Gate-2 pre-push stale-staged remedy
  re-provisions but never removes the poisoned commit from the working branch, leaving a
  release-reverting docs commit one `ensure-origin` from origin — three auditor seats filed it
  independently). Two of the fixes also gain their first mechanical guard: a Status-blurb
  authoring checklist locked for presence (the 7-recurrence overclaim family's first
  authoring-time surface) and a D22 undo-arm extension (so the remedy cannot regress to
  detect-only without a red test).
- **Method:** one content phase of seven **file-disjoint, fully parallel** tasks, then the
  release. Zero runtime behavior change anywhere: every edit is standing-doc prose, a source
  comment, or a doc-contract test (spec §2.2) — no engine code path, exit code, enum, prompt
  byte, or floor changes; #1136 changes what the operatorless Lead is *instructed* to do, not
  any script. Coupled doc+lock pairs travel inside one task (README blurb/checklist + its
  `version-slots.test.mjs` presence lock; the Gate-2 undo step + the D22 regex extension) so no
  lock ever ships pointing at prose that isn't there. Doc-contract idiom is preserved: ONE
  ordered-match key, by-construct extraction (marker → next `##` heading), markup tolerance on
  emphasis spans. Every validation grep is a completeness **floor** (spec §2.7): after each
  grep, hand-scan the target file's same-scope tests/comments and record every straggler in the
  done report. **Straggler routing rule (binds every floor and every "no other byte/line
  changes" clause):** a straggler *inside the task's own Files list and of the same defect
  class* is **fixed in-task** and recorded — the "no other byte/line changes" clauses forbid
  gratuitous edits, never floor-mandated corrections; a straggler *outside the task's Files
  list* is **never** fixed in-task (file-disjointness is inviolate mid-phase) — record it in
  the done report as a `follow-up`-routed observation for the Lead//aftermath, never an absorb.
  **Grep-floor phrasing:** every "prints 0" / "prints no hits" below is an **output**
  comparison — `grep -c` prints `0` (and `grep -n` prints nothing) on zero matches while grep
  itself exits 1; the exit status is never the pass signal. Anchor every edit by named
  construct — heading, banner, or sentence fragment — never line number. The #1136 remedy prose must carry the
  explicit shared-branch-doctrine carve-out (spec §2.6): the `reset --hard` target is a
  provably-**unpushed** commit in the transient Lead-owned publication worktree, the sanctioned
  exception, stated in the doc so an auditor reads it as chosen, not conflicting.
- **End state:**
  1. **#1153(a):** `grep -c 'on every error path' README.md` prints 0, or every remaining hit
     carries the scratch-phase qualifier in the same sentence (the pre-`mkdtemp` cap-refusal
     `die()`s named as the exception); the `**0.14.63**` version token is byte-unchanged in
     Phase 1 (re-resolve the token identity at land if a release has landed since — the edit
     targets the *live* `## Status` paragraph, whatever version it carries).
  2. **#1153(b):** `grep -c 'prose-only reintroduction is red' README.md` prints 0; the
     replacement sentence carries a token-scope word (mirroring the lock's own "TOKEN-scoped"
     comment).
  3. **#1153 guard:** `README.md` `## Releasing` contains a `### Status-blurb authoring
     checklist` subsection (~6 bullets distilled from the lesson family, citing
     `release-blurb-overstates-guard-semantics` as provenance) placed before `## Status`;
     `version-slots.test.mjs` gains a light presence lock (heading + at least one distinctive
     anchor token — a token unique in `README.md`, living in a bullet body — extracted by
     construct: the `'\n## Releasing'` heading boundary → next `\n## `) paired with an inline
     unwired negative-reference helper — a string constant with the subsection absent, run
     through the same extraction+assert path and asserted red (operator-ratified at the
     war-machine volley: permanent both-ways proof, no fixture files);
     the existing undersell guard's extraction is undisturbed and the whole suite is green.
  4. **#1115:** exactly one sentence in ADR 0019's Amendment "**Live routing.**" paragraph now
     names both sites — soft `env-blocked` at the merge site, `held:land-failed` at the land
     site — mirroring ADR 0040 §B; `grep -n 'keeps this ADR.s original soft'
     docs/adr/0019-target-derived-execution-values.md` prints no hits; the superseded original
     Decision text is byte-unchanged (no retro-edit).
  5. **#1146:** `grep -c 'restarts per banner'
     skills/lessons-learned/lessons-learned-doc-contract.test.mjs` prints 0; the reworded
     banner parenthetical states file-global-monotonic numbering with the lessons-learned-seed
     banner as the sole (plan-sanctioned) restart and source of the 17–21 collision;
     `node --test` on the file is green and every diff hunk is inside comment lines (zero
     assertion, fixture, or expected-value changes).
  6. **#1152:** `grep -c 'TOGETHER' skills/war/assets/provision-worktrees.test.sh` prints 0
     within the T2.9 census comment; the reword states (b)+(d) exclude the rc-guard and loud-die
     routes while identity **between the two silent exit-3 routes** rests on (c) (the push is
     pre-receive-declined, so no post-push readback ever ran) plus (e) (origin tip unchanged —
     the readback-mismatch route requires an advanced origin); the bash suite is green with zero
     `expect`-line changes.
  7. **#1107:** `grep -c 'mixed-source' skills/war-review/SKILL.md` ≥ 2; the §2 clause extends
     the sentence ending "never cross-summable against an envelope total" and contains "every
     phase" (run total is envelope-sourced only when every phase carries an envelope; any mix
     renders `n/a (mixed-source)`, never a silent sum); §3's "total tool calls" / "total tokens"
     rows (or the table preamble) reference the §2 rule so render instruction and ban cannot
     drift apart; per-phase cells' sourcing is unchanged.
  8. **#1136:** the Gate-2 pre-push staged-file bullet carries the undo step between the
     do-not-push clause and the `ensure-origin` push — `git reset --hard HEAD~1` in the
     publication worktree when `HEAD` is the just-authored poisoned docs commit, with the
     explicit unpushed-commit carve-out language, or `git revert` when the branch has advanced
     past it — followed by `remove-publication-worktree`, re-provision, re-commit as today;
     D22's single ordered regex gains the undo arm between its do-not-push and `ensure-origin`
     arms (same extraction, markup-tolerant, pinned on `reset --hard HEAD~1` or a
     reset-or-revert alternation — never bare `reset --hard`, which the carve-out's doctrine
     mention would satisfy — not the full sentence); the D22 banner comment's ordered-span
     enumeration is updated in the
     same commit (and does not itself claim a count its enumeration mismatches); both-ways
     proof: an inline unwired negative-reference helper — the D22 region as a string constant
     with the undo clause absent, run through the same ordered-regex path and asserted red
     (operator-ratified at the war-machine volley).
  9. **#1096:** `agents/war-worker.md` carries one new paragraph immediately after the
     `PLAN-DEFECT:` paragraph under "## Stop and escalate instead of guessing": a floor/tooling
     **config mismatch** (e.g. a threaded `floor_diagnostic` naming the active test-pattern set
     and suggesting `--pattern` / `overrides.testPattern`) is run configuration, not the plan —
     return `status: "blocked"` quoting the diagnostic verbatim in `blocked_reason` **without**
     the `PLAN-DEFECT:` prefix — the paragraph states (truthfully, per the live
     `defectClassOf`/adjudication mechanics) that the missing prefix keeps the escalation out
     of the automatic `/red-team` plan-amendment route and in ordinary Lead adjudication as a
     config question; the existing `PLAN-DEFECT:` paragraph is byte-unchanged.
  10. **Floor discipline:** every End-state grep above was treated as a floor — each task's done
      report records the same-scope hand-scan and lists every straggler as a survey-derived
      correction (spec §10's per-issue floor notes).
  11. **Whole-sweep regression (Phase-1-scoped, Lead-run at phase close):** `node --test
      'skills/**/*.test.mjs'` and the anchored shell loop (`for f in $(find hooks skills -name
      '*.test.sh' | sort); do bash "$f" || exit 1; done`) both green; `git diff` from the frozen
      Phase-1 base to the Phase-1 integration tip shows no hunk outside the nine spec-§5
      surfaces — this check is **Phase 1 only** (Phase 2's slot files and the post-land Gate-2
      `docs(learnings)` commit are outside it by construction);
      `docs/learnings/release-blurb-overstates-guard-semantics.md`, all engine `.js`/`.sh` code
      paths, and all four version slots are untouched by Phase-1 **task diffs** (a post-land
      servitor/Gate-2 stamp on that lesson is out of this check's scope and permitted).
  12. **Release:** all four version slots bumped in lock-step to the next free patch above the
      live integration base at land time; `version-slots.test.mjs` (lock-step + monotonic floor
      + undersell guard + new checklist lock) green; the new Status blurb itself satisfies every
      item of the just-landed authoring checklist.

## Build order (for /war)

1. **Phase 1 — Truth sweep** (7 parallel file-disjoint tasks, one wave, no deps)
2. **Phase 2 — Release** (version bump; phase edge because the release rewrites `README.md`
   `## Status`, which Task 1.1 also touches — rule 4, release is its own trailing phase)

## Phase 1 — Truth sweep

### Task 1.1: #1153 — README Status blurb scoped rewordings + authoring checklist + presence lock

- Files: `README.md`, `skills/war/assets/version-slots.test.mjs`
- Plan slice: in the live `## Status` paragraph (the `**0.14.63**` blurb at authoring base —
  target the live paragraph whatever version token it carries at dispatch), item **(4)**: apply
  the two scoped rewordings from spec §3 — (a) scope the quantifier: "on every error path **that
  had already reached the scratch phase**" (or equivalent naming the pre-`try` cap refusals as
  the exception — `seed-pack.mjs`'s cap-refusal `die()`s fire before their `mkdtemp` calls, so
  those paths never created a scratch dir); (b) repeat the lock's own scope word: the
  reintroduction claim is **token-scoped** — e.g. "a reintroduction that spells the retired
  token — even in prose — is red too", never the unqualified "prose-only reintroduction is
  red". No other byte of the blurb changes except floor-surfaced stragglers of the same
  overclaim class (Method straggler rule); the leading version token is untouched.
  **Vacuous-reword route:** if at dispatch a sibling release has already replaced the paragraph
  and neither overclaim sentence survives (both greps already print 0 on the live blurb),
  record the no-op with that grep evidence and land the checklist + lock alone — the hand-scan
  floor still runs over the live paragraph; this is not an escalation. Then insert
  a `### Status-blurb authoring checklist` subsection inside `## Releasing`, before `## Status`,
  distilling the lesson family into ~6 bullets (spec §4.1): (1) before "every/all/never/
  X-is-Y-too", confirm the enclosing scope word bounds every instance the absolute covers;
  (2) if the guard's own comment declares a narrower scope (e.g. "TOKEN-scoped"), the blurb
  repeats that scope word; (3) describe a guard's trigger surface (the diff property), never
  repo topology; (4) a conditional side effect is "prints X **when** Y", never bare "prints X";
  (5) "No behavior change:" only when literally none shipped — otherwise name the scope;
  (6) a trailing appositive ("…, itself unchanged") restates its subject. **Quote discipline
  (the checklist lands inside the very section the undersell guard scans, and this task's own
  greps are file-wide):** no checklist bullet may quote the retired or banned phrases verbatim —
  "three version-of-truth files" (re-fires the undersell guard's absence assert), "on every
  error path", "prose-only reintroduction is red" (each would false-red this task's own End-state
  1–2 floors) — describe the failure modes, never quote them. Cite
  `docs/learnings/release-blurb-overstates-guard-semantics.md`'s slug as running provenance
  (cite only — the lesson file itself is untouched, spec §5). In `version-slots.test.mjs`, add
  one light presence lock: extract the `## Releasing` section by construct, anchored on the
  heading **boundary** `'\n## Releasing'` → next `\n## ` (the Status-token extraction's own
  comment records the first-occurrence trap — a table row quoting a heading in backticks
  precedes the real heading; anchor the boundary even though `## Releasing` is currently unique
  in the file) and assert the checklist heading plus at least one distinctive anchor token are
  present — heading + one token only, never a byte-pin of the bullet prose (spec §8: a heavy pin
  makes every wording tweak a two-file change for no defect coverage). **Distinctive =
  repo-checkable:** the anchor token lives inside a checklist *bullet* (not the heading) and
  occurs nowhere else in `README.md` (`grep -c` prints 1) — so the lock cannot pass on a token
  that survives deletion of the checklist body. Must not disturb the existing undersell guard's
  extraction. Both-ways proof (operator-ratified): an inline unwired negative-reference
  helper — a string constant mirroring the `## Releasing` region with the **entire
  subsection** (heading + bullets) absent — fed through the same extraction+assert path in a
  second test and asserted red; no fixture file ships, and a done-report temp-break probe may
  supplement but is not the proof. Floors: the End-state 1–2 greps (inlined
  above), then hand-scan the full `## Status` paragraph for other unscoped absolutes ("every",
  "all", "is red too") and list each straggler.
- requiresTest: true — the checklist presence lock is the task's own new test surface
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: #1115 — ADR 0019 Amendment no-chaining clause → two-site form

- Files: `docs/adr/0019-target-derived-execution-values.md`
- Plan slice: in the Amendment's "**Live routing.**" paragraph, replace the clause "keeps this
  ADR's original soft `env-blocked` routing" (inside the no-chaining sentence) with the two-site
  form resolved in spec §3, mirroring ADR 0040 §B: "keeps its pre-retry routing at that site —
  soft `env-blocked` at the merge site, `held:land-failed` at the land site". The immediately
  following "Exhaustion routes by site" sentence already models the wording — converge on it.
  Single additive phrase; the change is confined to the Amendment section and the superseded
  original Decision text is never retro-edited (spec §2.4). No new lock — ADR text is not
  test-pinned; the D21 lock on the `skills/war/SKILL.md` sibling already guards the doctrine's
  operative surface (spec §3). Floor: `grep -n 'keeps this ADR.s original soft'` prints no hits, then
  hand-scan the Amendment section for any other single-site restatement and list stragglers.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: #1146 — banner-comment numbering reword (comment-only)

- Files: `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: reword the Task-1.2 banner parenthetical ("banner-scoped, as it is throughout this
  file (it restarts per banner …)") to state the real convention: check numbering is
  **file-global-monotonic across banners** — the reworded comment must NOT pin a terminal count
  literal (the tip currently reaches (27), re-verified, but a "(1)→(N)" literal stales on the
  next added check: the exact count-word failure mode this plan's own checklist bans, spec §4.5);
  the lessons-learned-seed banner is the sole, plan-sanctioned restart and the sole source of
  the 17–21 collision the comment cites; this banner also restarts at (1) per its own plan.
  Zero assertion, fixture, or expected-value changes — **mechanical form (worker proves, auditor
  re-runs):** `git diff -U0 <task base> -- <file>` where every `+`/`-` content line (the
  `+++`/`---` file headers excluded) matches `^[+-]\s*//`; no check renumbering (the collision
  is plan-sanctioned; only the false
  generalization is corrected, spec §9). `node --test` on the file green, byte-identical
  behavior. No drift guard for the comment — comments are not drift-guarded here, accepted
  residual (spec §3). Floor: the End-state 5 grep (inlined above), then hand-scan every
  banner comment in the file for numbering-convention claims and list stragglers.
- requiresTest: false — comment-only edit; no new coverage is required or claimed
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: #1152 — T2.9 census-comment reword (comment-only)

- Files: `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: reword the T2.9 census comment's route-identity inference ("route identity rests
  on (b)+(c)+(d) TOGETHER"): (b)+(d) exclude only the rc-guard and loud-die routes; identity
  **between the two silent exit-3 routes** (the bare push-error branch and the post-push
  origin-readback mismatch) rests on (c) — the push is pre-receive-declined, so no post-push
  readback ever ran — **plus** (e) — origin tip unchanged; a readback-mismatch route requires an
  advanced origin. No assertion changes: (b)–(e) already prove this, only the prose lied
  (spec §3). Zero `expect`-line changes — **mechanical form (worker proves, auditor re-runs):**
  `git diff -U0 <task base> -- <file>` where every `+`/`-` content line (the `+++`/`---` file
  headers excluded) matches `^[+-]\s*#`;
  `bash skills/war/assets/provision-worktrees.test.sh` green. Floor: the End-state 6 grep
  (inlined above), then hand-scan T2.3/T2.6/T2.9's comments for other route-identity claims and
  list stragglers.
- requiresTest: false — comment-only edit; no new coverage is required or claimed
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.5: #1107 — war-review mixed-source run-total rule

- Files: `skills/war-review/SKILL.md`
- Plan slice: in §2 ("Mine the transcripts"), extend the existing sentence ending "never
  cross-summable against an envelope total" with the run-total clause resolved in spec §3: a run
  total for tool calls/tokens is envelope-sourced only when **every** phase carries an envelope;
  any envelope/mined mix renders `n/a (mixed-source)`, never a silent sum (a mixed per-phase sum
  *is* the cross-sum §2 already bans — ~20× skew makes it disinformation, not approximation).
  In §3 ("Tally — the metric set"), annotate the "total tool calls" and "total tokens" rows'
  Source cells (or the table's preamble) with the same rule **by reference** to the §2 clause,
  so the render instruction and the ban cannot drift apart. "By reference" means: the §3 note
  repeats the `mixed-source` **token** (that repetition is what the ≥ 2 floor counts) and names
  the §2 rule, but does **not** restate the every-phase conditional — the rule lives once; the
  gate-audit verifies exactly that shape. The `n/a (mixed-source)` rendering is a deliberate
  parenthetical variant of the file's bare `n/a` convention — it distinguishes "sourceable but
  unmixable" from "unsourceable"; nothing downstream pattern-matches on the bare token (the
  tables render for humans). Per-phase cells keep their per-phase sourcing byte-unchanged.
  Anchor by the sentence fragment and row names, never line numbers. Floor: the End-state 7
  checks (`mixed-source` ≥ 2, clause contains "every phase"), then hand-scan §3's full metric
  table for any other row whose run total could mix sources (e.g. wall-clock is manifest-only
  and cannot) — a mixable row found there is in-scope (same file, same defect class: fix
  in-task per the Method straggler rule).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.6: #1136 — Gate-2 pre-push remedy gains the branch-ref undo step + D22 undo arm

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **(doc)** in the Gate-2 flow's pre-push staged-file bullet (inside the
  `**Post-servitor publication (Gate 2` construct — the D22 extraction region, which ends at
  the next `## ` heading, `## Resume`; the shared-branch doctrine's home in the Invariants
  section sits **outside** it, verified), after "do **not** push", insert the undo step: in the
  publication worktree, `git reset --hard HEAD~1` — the precondition is **by construction**:
  the `--name-only` probe inspects `HEAD`, so the commit it just condemned IS `HEAD` in the
  same pass, provably **unpushed** (origin has never seen it), and this is the **sanctioned
  exception to the no-`reset --hard` shared-branch doctrine, scoped to an unpushed commit in
  the transient Lead-owned publication worktree** — any uncommitted state there is discarded
  by design (the worktree exists only for this commit and is removed next step); the carve-out
  language stays explicit in the doc so an auditor reads a chosen exception, not a doctrine
  conflict (spec §2.6). On any re-entry shape where `git log` shows the condemned docs commit
  is **not** `HEAD` (the branch advanced past it), never reset — `git revert` the docs commit
  instead (never rewind published or built-upon history); a conflicted revert is `git revert
  --abort` + escalate, leaving the worktree in place for inspection (the flow's existing
  push-failure posture). Then `remove-publication-worktree`, re-provision, and re-commit
  exactly as today — **bounded**: if the re-committed docs commit fails the probe again, do
  not loop; escalate (the staleness is not worktree-local). The insertion must NOT restate the
  commit or probe steps — keep the "as today" delegation so no second `docs(learnings): phase
  N`, `--name-only`, or `ensure-origin` token appears inside the extraction region and the
  ordered span stays unambiguous. One edit site covers both paths: the Checkpoint manual-land
  path delegates ("exactly as on the auto-landed path") to this same flow (spec §3). **(lock)**
  extend D22's single ordered regex by one arm between the do-not-push clause and
  `ensure-origin`: commit → `--name-only` probe → do-not-push → **undo clause** →
  `ensure-origin`. Keep the idiom (spec §2.5): ONE ordered match, never independent presence
  checks; same by-construct extraction; markup-tolerant on emphasis spans; pin the new arm on
  `reset --hard HEAD~1` (or an alternation also tolerating the `revert` verb) — never bare
  `reset --hard`, which the carve-out's own doctrine mention inside the region would satisfy,
  defeating the negative-reference proof — and never the full sentence (spec §8 regex-fragility
  note). Update the D22 banner comment's ordered-span enumeration in the same commit — and per
  the checklist discipline this plan itself lands, do not write a count word ("five arms")
  anywhere the enumeration could outgrow (spec §4.5). Both-ways proof (operator-ratified): an
  inline unwired negative-reference helper — the region string with the undo clause (command +
  carve-out) absent — run through the same ordered-regex path and asserted red. Floors: the
  End-state 8
  checks (inlined above), then `grep -n 'remove-publication-worktree' skills/war/SKILL.md`
  and hand-scan each hit's surrounding procedure (Setup step-2 crash-heal, Gate-2 step 0, the
  remedy itself, the Checkpoint delegation) for any restated remedy lacking the undo step; list
  stragglers. (Sweep already run over `docs/learnings/` bodies too:
  `gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` describes layer-2's
  detect-and-refuse without the undo — deliberately untouched per spec §5, servitor territory.)
- requiresTest: true — the D22 undo-arm extension is the task's own test surface
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.7: #1096 — worker config-mismatch escalation classification

- Files: `agents/war-worker.md`
- Plan slice: under "## Stop and escalate instead of guessing", immediately after the existing
  `PLAN-DEFECT:` paragraph, add one standing-doc paragraph (spec §3): when the observed failure
  is a floor/tooling **config mismatch** — e.g. a threaded `floor_diagnostic` naming the active
  test-pattern set and suggesting `--pattern` / `overrides.testPattern` — the root cause is run
  configuration, not the plan: return `status: "blocked"` quoting the diagnostic verbatim in
  `blocked_reason`, **without** the `PLAN-DEFECT:` prefix. **Routing truth (verified against
  the live engine — state it this way, not more):** the prefix is what sets
  `defectClass: 'plan'` (`defectClassOf` in `workflow-template.js`), and that tag is what
  auto-routes the escalation to a `/red-team` plan amendment in the Lead's adjudication step
  (`skills/war/SKILL.md` "Adjudicate the escalation"); an unprefixed reason stays in ordinary
  Lead adjudication, where the quoted diagnostic points the fix at run config — the paragraph
  must claim exactly this ("keeps the escalation out of the automatic plan-amendment route; the
  Lead adjudicates it as a config question"), never a dedicated "config check" mechanism the
  engine does not have — a truth sweep must not ship its own overclaim. **Auditable contract:**
  the diff adds the one new paragraph plus, at most, a minimal extension of the section's
  self-confound framing where the new paragraph needs a hook; every other line is byte-unchanged
  (Method straggler rule excepted) and the existing `PLAN-DEFECT:` paragraph is byte-unchanged.
  **Deliberately standing-doc-only** (spec §3): no dispatched-prompt mirror — the fix-round
  prompt already threads `floor_diagnostic` verbatim (#1045/#1120); the prompt carries the
  evidence, the standing doc carries the classification rule, and `agents/war-worker.md` is the
  worker's own standing agent definition, in context from spawn — the rule is present at
  first-block classification time, not only in fix rounds. This asymmetry is recorded here so
  an auditor sees it as chosen, not missed. Floor: the End-state 9 checks (inlined above), then
  hand-scan the "Stop and escalate" section for any other sentence steering all blocks toward
  `PLAN-DEFECT:` and list stragglers.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: this plan changes plugin-shipped surfaces (`skills/war/SKILL.md`,
  `skills/war-review/SKILL.md`, `agents/war-worker.md`, three test assets, `README.md`) — users
  receive them only via a release. Bump all four release slots together to the **next free patch
  above the live integration base at land time** (never a resolved semver literal, per the
  /war-strategy §2 next-free-patch convention; version literals in plans are non-authoritative):
  `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`,
  and the `README.md` `## Status` line (replace-in-place, never emptied, no badge).
  `skills/war/assets/version-slots.test.mjs` is the lock-step + monotonic-floor arbiter — a
  partial bump or downgrade is a red test — and now also carries Task 1.1's checklist presence
  lock. Expected integration base: **this plan stacks on the
  `2026-07-26-dispatch-args-and-floor-coverage` plan's landed tip** (base before that plan:
  master `738cf6a`); inside the campaign, resolve the next free patch from the four slots **as
  they stand at land time** after every stacked predecessor (including sibling release bumps)
  has landed — stacked-release lag is absorbed by construction. Standalone fallback: a run
  through plain `/war` (outside the campaign) resolves the next free patch from the four slots
  itself. An intervening external release surfaces as a rebase conflict on the slot lines at
  the serial merge; re-resolve from the **rebased** tip, never toward the worktree's stale copy
  (the recorded gate2-stale-verify-worktree revert shape), with the monotonic floor as backstop.
  The new Status blurb **must itself pass the checklist Task 1.1 just landed** — this release is
  the checklist's first live exercise: describe a doc/comment truth sweep across seven surfaces
  plus the Gate-2 branch-ref undo step and the D22/checklist lock extensions. Scope honesty
  under the checklist's own item 5: "no engine, enum, floor, or prompt-byte change" is
  literally true and may be said plainly, but the bare phrase "No behavior change" may NOT be —
  Phase 1 ships two new failing-capable assertions (the checklist lock and the D22 undo arm),
  and the blurb must name them as the shipped scope. No unscoped absolutes, no count word its
  own enumeration mismatches. **Checklist-dispute adjudication:** a gate-audit dispute over a
  semantic checklist item is an ordinary finding — severity-gated (Critical/Major block,
  Minor/nit do not), disposition auditor-owned, and under `--afk` the Lead self-adjudicates
  per the standing posture; a disputed item is not an automatic hold.
- requiresTest: false — the existing `version-slots.test.mjs` (with the new checklist lock) covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Checklist efficacy (the #1153 guard is semantic, not mechanical)** — whether the authoring
  checklist actually prevents an 8th overclaim recurrence cannot be proven at Phase 1 land ·
  why deferred: overclaims are semantic judgments; no mechanical lint by design (spec §3, §9) ·
  runner: Phase 2's Task 2.1 authors its blurb against the checklist and its gate-audit
  (`execution-evidence` lens) verifies the blurb against each checklist item — the first live
  exercise; every future Release task inherits the duty via `## Releasing`.
- **#1136 crash-window residual (probe depth)** — the pre-push check still inspects only `HEAD`;
  a crash between a poisoned commit and its push, then a re-entry that commits again, leaves the
  poison at `HEAD~1` where neither probe nor undo sees it · why deferred: deepening the probe to
  every unpushed docs commit is an engine-adjacent scope this zero-behavior-change sweep
  excludes (spec §8, §9) · runner: `/aftermath` files (or re-points) a residual follow-up issue
  at campaign close; until then the shrunken window is the accepted posture.
- **#1107 rule exercise** — the mixed-source rendering rule has no mechanical lock
  (`skills/war-review/SKILL.md` is not doc-contract-pinned; the §3 annotation references §2
  rather than duplicating it, so there is no mirrored fact to drift-guard) · why deferred: the
  rule is single-sourced prose; only a live mixed-envelope run can exercise it · runner: the
  next `/war-review` invocation over a run where some phases carry `envelope` and others fall
  back to mined transcripts.

## Notes / conscious deviations

- **requiresTest is false on Tasks 1.3 and 1.4 although their diffs touch test files** — those
  are comment-only edits inside existing suites; claiming `requiresTest: true` would be
  satisfied vacuously by the very file being reworded. The honest flag is false; the auditors'
  duty instead is verifying the *negative* (every hunk inside comment lines, zero
  assertion/`expect` changes — spec §8).
- **README.md appears in Task 1.1 and Task 2.1** — resolved by the phase edge (release is its
  own trailing phase, decomposition rule 4), never a deps-wave dodge. Task 2.1's `## Status`
  replacement is replace-in-place of the whole blurb paragraph; Task 1.1's blurb corrections
  are still landed first deliberately (spec §3: waiting re-opens the window for an 8th
  recurrence, and the corrected 0.14.63 blurb remains the last-released truth until Phase 2
  supersedes it).
- **Cross-plan contention:** `README.md` `## Status` is a release-slot surface every sibling
  campaign plan's release phase also rewrites (`2026-07-26-dispatch-args-and-floor-coverage`,
  `2026-07-26-war-memory-cli-correctness`) — the serial stack-and-plow order (ADR 0011)
  resolves it; each release re-resolves the next free patch at land time.
  `docs/learnings/release-blurb-overstates-guard-semantics.md` is **deliberately untouched**
  here (spec §5: memory-root lesson files are servitor/Gate-2 territory — Task 1.1 cites the
  slug, never edits the file), so there is no `docs/learnings/` collision with the war-memory
  sibling's lesson-file edits.
  `skills/war/SKILL.md` is the sole shared non-release file with the dispatch-args plan
  (verified against its `Files:` lines; `agents/war-worker.md` appears in no sibling's
  footprint) — carried as the roadmap-spine ordering constraint at the top; within this plan
  both files are file-disjoint across tasks.
- **No dispatched-prompt mirror for #1096** — deliberate standing-doc-only asymmetry (spec §3);
  recorded in Task 1.7 so auditors adjudicate it as chosen.
- **No new lock for ADR 0019, no drift guards for the #1146/#1152 comment rewords** — accepted
  residuals per spec §3 (ADR text is not test-pinned and D21 guards the operative sibling;
  comments are not drift-guarded here).
- **Zero behavior change is the plan-wide invariant** (spec §2.2): if any task finds it cannot
  fix its surface without touching an engine code path, exit code, enum, prompt byte, or floor,
  that is a `PLAN-DEFECT:` escalation, not a latitude call.
- **Lock proofs are inline negative-reference helpers (operator-ratified at the war-machine
  volley, superseding the drafted done-report-only form):** the triad survivor was raised and
  the operator chose the middle path — each new lock (checklist presence, D22 undo arm) ships
  with an unwired string-constant negative run through the same extraction+assert path,
  asserted red. Durable both-ways proof per the structural-test-blind-spot idiom, zero fixture
  files. Worker temp-break probes in done reports remain welcome supplements and stay SOFT.
- **Source-issue closure is owned by /aftermath at campaign close** (evidence-gated), distinct
  from the Checkpoint duty of closing run task issues. #1153's closure text must state that
  the durable artifact is the checklist + presence lock and that Phase 2's whole-paragraph
  `## Status` replacement supersedes Task 1.1's corrected sentences **by design** (the
  corrected 0.14.63 blurb was the last-released truth only until this release) — preempting a
  reopen when the corrected wording is noticed gone.
- **Phase 1 landed with Phase 2 held is an accepted intermediate state** — the standard
  stacked-campaign posture (repo tip ahead of the shipped plugin); the run stays held/open
  until the release lands, so /aftermath sees it as an unclosed run, not silent debt.
- **Two-site routing third-surface sweep already run (resolve round):** `CONTEXT.md` and the
  `workflow-template.js` land-retry comment already carry the two-site form; ADR 0040 §B's
  "(soft `env-blocked` / `held:land-failed`)" wording re-verified at tip. `CLAUDE.md`'s
  "docs/adr/ (0001–0022)" census prose is stale (ADRs reach 0040) but out of this plan's nine
  surfaces — recorded here for a follow-up, not fixed in-phase.
- **The plan is worker-self-contained:** every floor grep and check is inlined in the
  End-state block; task slices point at End-state items, never at spec sections a worker might
  not have. Spec access is not presumed by any slice.
- **#1136 undo executability verified at resolve time:** hooks confine by `agent_type`
  (auditor git-verb allowlist, worker write-scope, servitor no-Bash); no hook gates the
  Lead/main agent's Bash, so `git reset --hard` in the publication worktree is executable as
  instructed; the shared-branch doctrine lives in prose (Invariants section, outside the D22
  extraction region) and the remedy's carve-out states the sanctioned exception.

## Open decisions

None.
