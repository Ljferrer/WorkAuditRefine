# Red Team — 2026-08-04-interview-and-authoring-contract (2026-08-05)
**Verdict:** BLOCKED — **WIP**: all blockers adjudicated by the operator and patched into the
plan 2026-08-05; re-verification of the affected probes has not yet run, so the pre-patch
BLOCKED verdict stands until a re-run clears it. No residual open questions.

Run: `wf_15a87d52-a96` · artifactKind: `impl-plan` (reported in-header per Step 2) ·
repo = the session worktree (not foreign) · agents on `opus`/`high` per `agents.redteam` ·
provision `[]` (no `.war-provision.json`; structural fallback empty).

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders,
dependency-feasibility, intent-vs-plan. Bespoke: retired-wording-anchors,
spec-decision-anchors, checks-run-at-base, extraction-compat, default-flip-old-absent.
Executed in sandbox: executable-proof, checks-run-at-base, extraction-compat,
default-flip-old-absent. Lead-run: backstop-legitimacy (**pass** — both entries name a
concrete why-deferred and runner+timing), unguarded-new-mirror (**vacuous pass** — engine
untouched, no new inline mirror), ff-topology (**not triggered** — token grep + hand-read of
the evidence prose found no per-task merge-topology anchor).
Fallback: none — all analyzed probes ran on `Explore`; no sticky pin engaged.
Coverage: 11/11 expected probes on-target (`read_anchor` validated), 0 off-target, 0 dropped.

## Executed proof
- `checks-run-at-base` → **pass**: both structure suites, `plan-literal-lint.test.mjs`, and
  `version-slots.test.mjs` green at base; lint exits 0 without `--strict`;
  `grep -c 'question tree' skills/war-machine/SKILL.md` = 1 (retirement is real).
- `extraction-compat` → the merged-shape plan itself parses on every /war extraction surface
  (intent heading, Build order, 9 task blocks, backstops) **except** the ambiguity it
  surfaced: spec §4b's one-line task rendering is not ingestible by `extractFiles`
  (adjudicated: separate-bullet layout ratified).
- `default-flip-old-absent` → reproduced the silent-failure class: with CLAUDE.md left stale,
  **no committed suite goes red** (neither suite reads CLAUDE.md); the End-state-5 grep family
  does detect the stale surface when actually run (adjudicated: committed pins, new Task 8).
- `executable-proof` → reproduced the sentence-case false-negative: End state 4's
  case-sensitive `grep -c` passes against a re-cased reintroduction of the retired doctrine;
  three of Task 6's five patterns share the defect (patched: case-insensitive mid-sentence
  anchors throughout).
- Escape guard: exit 1 on ` M .claude/war/config.json` — routed through the self-confound
  gate and attributed to the Lead's own operator-requested config edit (worker tiers →
  fable/xhigh) made mid-run; verified the only working-tree delta. Not a probe escape.

## Findings
Gate raw counts: 22 blockers · 6 needsDecision · 22 minors, deduped to 12 root defects
(several lenses caught the same holes).

### Major
- [Major] war-strategy SKILL.md's retired doctrine (frontmatter `description:`, "Bare invoke —
  primer + handoff", "Honest boundary … never authors a spec from scratch", lines 3/9/14) sits
  outside Task 1's §1/§2/§4 scope and matches none of the five enumerated old-absent patterns
  → the plan could land green while the file still contradicts End state 1. Resolution:
  Task 1 slice extended to the out-of-section carriers; biting anchors added to the retired
  set and the war-strategy suite pins.
- [Major, needsDecision] Task 5's "Part-2-vs-Part-1 coherence probes" are a code literal in
  `workflow-scaffold.js:221` + `lenses.md:7`, not SKILL prose, while Task 5's Files listed
  only SKILL.md under an unqualified "engine untouched" constraint. Resolution (Q1 = widen):
  Task 5 Files gains lenses.md, workflow-scaffold.js, workflow-scaffold.test.mjs;
  requiresTest true; constraint re-scoped to the /war engine.
- [Major] End state 6's check (`grep -n 'source of truth'`) already green at base — the
  delete-the-feature-and-it-still-passes class; Task 5 had no other check. Resolution:
  re-anchored new-present (`its own source of truth`) + old-absent (``becomes `--spec` if not
  given``) + the scaffold suite as Done-when.
- [Major] End state 4 / Task 6 retirement guards case-sensitive; reproduced false-negative on
  re-cased reintroduction. Resolution: `grep -ci` + mid-sentence anchors; End state 4 mirrored
  as a committed pin in Task 3's suite.
- [Major] End state 5 "both ways" grep: no new-present pattern enumerated anywhere; old-absent
  half vacuous at base on war-help and war-strategy; README carries two same-meaning siblings
  (line ~12 "interview a spec into a plan", `## Note from Author` blockquote) matched by no
  pattern. Resolution: Task 6 now owns an authoritative per-surface table, both directions,
  war-help marked new-present-only, siblings added.
- [Major] End state 5's CONTEXT.md pattern carried a leading slash (`/grill-with-docs`
  authors`) that matches nothing in CONTEXT.md; the slash-less form lived only in Task 6,
  which does not own CONTEXT.md. Resolution: one authoritative slash-less list, cited by
  Tasks 7/8 and End state 5.
- [Major, needsDecision] The five-surface old-absent sweep rode entirely on a hand-run grep at
  land (no committed suite reads CLAUDE.md) — the recorded silent-failure class; ADR 0017
  forbids prose-only validation. Resolution (Q4 = (a)): new Task 8 lands committed
  case-insensitive pins for all five surfaces (+ CLAUDE.md handle) in
  `war-pipeline-structure.test.sh`, deps [6, 7]; ADR → Task 9, release → Task 10.
- [Major, needsDecision] Task 4 (survey-corps) shipped with no check of any kind — End state
  5's family never opens the file it edits. Resolution (Q5): Task 8 pins the D4/D11 tagging
  directive new-present.
- [Major, needsDecision] Part-2 tail shape ambiguity: spec §4b collapses `## Notes / conscious
  deviations · Open decisions` into one H2; today's template and this plan carry two separate
  H2s. Resolution (Q2): two separate H2s ratified; End state 2 pins pin that form; spec
  rendering noted as superseded shorthand.
- [Major, needsDecision] Per-task field layout ambiguity: spec §4b renders tasks as one
  compacted bullet; `extractFiles` ingests only the separate-bullet form. Resolution (Q3):
  separate-bullet layout ratified in Task 1's slice.
- [Major] Part 1 not self-contained: D9, D11, D12, D19 cited by task slices but defined
  nowhere in the plan ("The spec's §3 table governs" delegated the record). Resolution: the
  four rows inlined into `## Resolved design tree` with provenance tags.
- [Minor→patched, needsDecision] End state 7 required "both ADR 0014 headings" in one example
  doc — the headings are either/or alternatives. Resolution (Q6 = (b)): Task 1 ships TWO
  example docs (operator-form + AFK-form); End state 7 probes each.

### Minor (all patched unless noted)
- Stale base literal `382dba1` → header re-measured to `94ee5b3` (only this plan + spec landed
  in between; A3/A5 unaffected).
- End state 3 enumerated 4 of spec §4f's 5 rules → "untagged factual claim shape in
  `## Context`" added.
- Task 7's "lines ~15/27" pointed at the wrong constructs → replaced with by-construct anchors
  (Design spec / Implementation plan entries + pipeline paragraph).
- Task 3 lacked D19's carry-forward duty (ledger rows carried/retired with reason) → added.
- End state 8's check was green pre-bump (lock-step ≠ bump-happened) → version-differs-from-
  `0.15.1`-base clause added.
- No End state covered the ADR → End state 9 added (exists at next free number, Status
  current).
- End state 2's mutation-red proof left no artifact → done-report recording added (soft
  evidence by repo precedent).
- Backstop bullet 2's `why deferred: same · runner: same` would ride verbatim into
  `handoff.backstops[]` → both fields spelled out.

## Resolutions applied (grill decisions)
- Q1 scaffold-vs-prose → **widen Task 5** (operator) → Task 5 Files/slice/Done-when rewritten;
  Pivotal constraints re-scoped.
- Q2 Part-2 tail → **two separate H2s** (operator) → Task 1 slice + Notes.
- Q3 task layout → **separate `- ` bullets** (operator) → Task 1 slice + Notes.
- Q4 old-absent enforcement → **(a) committed pins** (operator) → new Task 8; renumbering
  cascade (ADR → 9, release → 10; A2 check, domain-terms ref, Build order waves, README note).
- Q5 survey-corps check → **agreed** (operator) → folded into Task 8; Task 4 Done-when points
  at it.
- Q6 example-doc arms → **(b) second AFK-shaped example** (operator) → Task 1 slice + End
  state 7.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. -->
- Part-2 tail = TWO separate H2s (`## Notes / conscious deviations`, `## Open decisions`)
  supersedes spec §4b L145's collapsed single H2 — Task 1 §2 (Q2, 2026-08-05).
- Per-task fields = SEPARATE `- ` bullets supersedes spec §4b's one-line compact task
  rendering — Task 1 §2 (Q3, 2026-08-05); `extractFiles` ingests only the bullet form.
- Task 5 Files = SKILL.md + lenses.md + workflow-scaffold.js + workflow-scaffold.test.mjs
  supersedes the plan-body `Files: skills/red-team/SKILL.md` sole entry; "engine untouched"
  binds the /war engine only — Task 5 (Q1, 2026-08-05).
- Task numbering: gospel-pins task = Task 8 (deps [6, 7]); ADR = Task 9; release = Task 10 —
  supersedes the pre-patch 8/9 numbering (Q4/Q5, 2026-08-05).
- Integration base `94ee5b3` supersedes plan-body `382dba1` — header re-measurement
  (2026-08-05). Version literal: none adjudicated — next free patch resolves from live slots
  at land time (base recorded 0.15.1).

## Residual risk
- Re-verification pending (WIP): the patched plan has not been re-probed; affected probes to
  re-run before CLEARED: claims-vs-reality, executable-proof, coverage-vs-source,
  consistency-placeholders, dependency-feasibility, intent-vs-plan, retired-wording-anchors,
  spec-decision-anchors, extraction-compat, default-flip-old-absent (checks-run-at-base passed
  clean and its subjects are unpatched).
- The spec file intentionally retains §4b's compact renderings; the plan + this report are the
  superseding record (spec edits were not in scope).
- Deferred validations stand as declared (adoption + interview-length telemetry via
  `/war-review` at the next campaign wrap-up); backstop-legitimacy passed.
- End state 2's mutation-red proof remains deliberately uncommitted done-report evidence —
  gate-audit treats a cannot-confirm as SOFT by repo precedent, never a hold.
