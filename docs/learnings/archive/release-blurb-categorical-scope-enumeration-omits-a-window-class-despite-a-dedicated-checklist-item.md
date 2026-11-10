---
name: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
description: "A release blurb's closing categorical claim ('every other change in the window is ...') can omit real landed classes even though the Status-blurb checklist item 'bound every absolute' exists to catch it; bucket every file of git diff --name-only before trusting it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
  phase: "ask-disposition/phase-3 (Release), task 3.1, 2026-08-25; recurred engine-reliability-and-filing-fidelity/phase-9 task 9.1, 2026-08-26 (omission); clean-pass confirmation 2026-08-30-engine-concurrency-and-pin-transfer/phase-3 task 3.1, 2026-08-30; clean-pass confirmation 2026-09-03-in-band-absorb-default/phase-7 task 7.1, 2026-09-04"
  keywords: 
    - release blurb
    - Status-blurb authoring checklist
    - bound every absolute
    - every other change in the window
    - categorical enumeration
    - CHANGELOG byte-identical paragraph
    - agent cards
    - CLAUDE.md
    - version-slots.test.mjs checklist test
    - README Status
    - checklist presence vs content
    - docs-only ride-alongs
    - design spec omitted
    - catch-all clause dropped
    - ADR unmentioned in blurb
    - full window diff enumeration
    - clean pass
    - mitigation confirmed
    - 44-file window
    - task-instruction-pinned count
    - resolved-in-flight finding
    - release scope sentence
  tags: 
    - war
    - release
    - readme
    - audit-findings
    - prose-precision
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-09-04T22:54:56.915Z
---

# A release blurb's own categorical-scope claim can violate the exact checklist item written to catch it

`README.md`'s `### Status-blurb authoring checklist` states item 1: "**Bound every absolute.** Before
writing 'every', 'all', 'never', or an 'X is Y too' claim, confirm the enclosing scope word ...
really does bound every instance the absolute covers." The 0.20.0 `## Status` paragraph and the
byte-identical `CHANGELOG.md` `## 0.20.0` entry both closed with exactly such an absolute: "every
other change in the window is Checkpoint prose, references mirrors, ADR record, glossary, tour,
telemetry rows, or test-side pins".

**The gap:** the landed window (`git diff --name-only master...integration/ask-disposition/phase-3`)
also contained `agents/war-auditor.md`, `agents/war-refiner.md`, `CLAUDE.md`, and four new
`docs/learnings/*.md` files — none of which fall under "Checkpoint prose" (that's
`skills/war/SKILL.md`), "references mirrors" (that's `skills/war/references/`), or any other listed
category. The blurb's own *detail* bullets do name the auditor card, the refiner predicate, and
CLAUDE.md individually elsewhere in the same paragraph — so no reader is substantively misled — but
the *categorical closing sentence* is narrower than the absolute it claims to bound, which is
exactly what checklist item 1 exists to prevent.

**Why this keeps recurring despite a dedicated checklist item:** the checklist's presence (that the
`### Status-blurb authoring checklist` section exists at all) is mechanically locked by
`version-slots.test.mjs`'s checklist-presence test — but the checklist's **content being correctly
applied** to a specific blurb draft is never mechanically checked, only caught by careful audit
review. A prior release (0.19.0) used the broader scope word "doctrine prose" for this same
sentence, which did cover agent cards and CLAUDE.md; this release's rewrite narrowed the wording and
reopened the gap the checklist item is meant to close.

**Disposition:** `note`, never `absorb` — the fix requires a two-file lock-step edit (`README.md`
`## Status` + `CHANGELOG.md`'s matching entry, both release slots) which is outside the
mechanical/non-load-bearing bar for absorb-eligibility.

**How to apply:** when drafting or auditing a release blurb's closing categorical-scope sentence,
literally enumerate the actual file classes in the diff window (`git diff --name-only <window>` and
bucket by directory/type) and check each one lands in a named category — do not rely on the
sentence "feeling" complete because the paragraph's other bullets happen to name the missing
surfaces elsewhere. If a broader scope word covered the omitted classes in a prior release (as
"doctrine prose" did here), prefer restoring it over narrowing, unless the narrower wording is
independently verified against the actual window.

**Recurrence (engine-reliability-and-filing-fidelity/phase-9 task 9.1, 2026-08-26, 0.20.0 →
0.20.1):** the byte-identical README `## Status` / CHANGELOG `## 0.20.1` blurb again closed with a
closed enumeration — "its docs-only ride-alongs are the campaign's plan, red-team report, per-phase
`docs(learnings)` commits, and one operator-ratified plan amendment" — that omitted the window's
`docs/specs/2026-08-25-engine-reliability-and-filing-fidelity-design.md`, landed in the same
materialization commit as the plan itself. A second, related sub-instance in the same blurb: the
bullets cited only 17 of the window's 24 task issues and dropped the 0.20.0 blurb's closing
catch-all clause without widening the bullets — so the new
`docs/adr/0048-budget-maintenance-authority.md` (a binding decision record) landed with no mention in
the release notes at all. Both were audited as Nit/`note` (never `absorb`) for the same reason as
before: the fix is a two-release-slot lock-step edit, and touching release-slot files post-bump from
a separate worktree risks [[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]].
Three straight recurrences confirm the checklist-presence-vs-content gap is a standing authoring
cost, not a one-off — checklist item 1 is not, and cannot easily be, mechanically checked against
the real diff window.

**Clean passes confirm the mitigation (2026-08-30, 0.21.7; 2026-09-04, release task 7.1):** in both,
the gate-audit seat literally bucketed every file in `git diff --name-only <full-window>` into a
named category before trusting the closing sentence, and the sentence held. Treat "I bucketed every
file in `git diff --name-only <full-window>` into a named category" as the bar for trusting a
release blurb's categorical closing claim, not a lighter read.

**Window-count clause:** in the 2026-09-04 pass the blurb read "Release scope: the 44-file window
from this run's launch base, bucketed whole," and the auditor's bucket census summed to exactly 44.
A plain `git diff --stat` against the launch base returned 47 files; the 3-file delta
(`plugin.json`, `marketplace.json`, `CHANGELOG.md`) is the release commit's own version-slot bump
plus its own CHANGELOG entry, and the closing clause ("the version slots and the CHANGELOG head
entry are this commit") names all three by category. For a release-window count sentence, the
task-instruction-pinned figure is authoritative — not a raw `git diff --stat` count against the
launch base. The release commit's own file bumps are expected to sit outside the pinned window;
check that they land in a separate, explicitly named disclosure clause, not folded silently into the
headline number. The mitigation in
[[bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands]]
generalizes here too. A sibling finding from an earlier fix round was already fixed at land; see
[[audit-log-finding-can-be-stale-by-land-time]].

Related: [[release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor]]
(same task/phase, a different release-shape recurring cost). This is the same underlying family as
the archived `release-blurb-headline-count-word-can-mismatch-its-own-enumeration` (a blurb's numeric
headline count vs. its own following enumeration) and `readme-status-blurb-homes-list-is-editorial-
not-exhaustive` (a bullet's `Homes:` pointer list vs. its own prose) — all three are instances of "a
release blurb's own summary/count/scope claim silently underclaims relative to what the rest of the
same document, or the actual landed window, contains" — but this occurrence is a distinct
sub-mechanism (a categorical closing absolute, not a numeric count or a pointer list), so it is
recorded as its own lesson.

> archived 2026-10-27: resolved — moved to archive
