---
name: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
description: "A release blurb's closing categorical claim ('every other change in the window is Checkpoint prose, references mirrors, ADR record, glossary, tour, telemetry rows, or test-side pins') can omit real landed classes (agent cards, CLAUDE.md, servitor-learnings docs) even though README's own Status-blurb authoring checklist item 1 ('bound every absolute') exists specifically to catch this — checklist presence is mechanically pinned, its content is not"
metadata: 
  promoted: dev/2026-08-30-engine-concurrency-and-pin-transfer@phase-3
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

**Code-verified** at the audited pin `a3f7b8b282bd1a993e5a3c56bdf4347395d89ee7` (task worktree
`p3-3.17`, gitdir physical path
`<repo-root>/.claude/war-worktrees/ask-disposition-2026-08-25/p3-3.1/`). `README.md`'s
`### Status-blurb authoring checklist` (line 328) states item 1: "**Bound every absolute.** Before
writing 'every', 'all', 'never', or an 'X is Y too' claim, confirm the enclosing scope word ...
really does bound every instance the absolute covers." The `## Status` paragraph (line 364) and the
byte-identical `CHANGELOG.md` `## 0.20.0` entry both close with exactly such an absolute: "every
other change in the window is Checkpoint prose, references mirrors, ADR record, glossary, tour,
telemetry rows, or test-side pins" — present verbatim in both files at this pin.

**The gap:** the landed window (`git diff --name-only master...integration/ask-disposition/phase-3`)
also contains `agents/war-auditor.md`, `agents/war-refiner.md`, `CLAUDE.md`, and four new
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
0.20.1):** code-verified live at the pinned gate-audit SHA `16200fd71cd41423b79bb351ad4a6ae9530eaa28`
(read at task worktree `p9-9.1`, gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/p9-9.1/`
— this SHA is the pinned `auditSha`/`gate-audit` tip with `gateEvidence: true`, one commit behind the
threaded landed tip `98c0104`; no live worktree existed at the landed tip itself, so this is the
gate-audit-fallback rung, not a direct landed-tip read). The byte-identical README `## Status` /
CHANGELOG `## 0.20.1` blurb again closes with a closed enumeration — "its docs-only ride-alongs are
the campaign's plan, red-team report, per-phase `docs(learnings)` commits, and one operator-ratified
plan amendment" — that omits the window's `docs/specs/2026-08-25-engine-reliability-and-filing-
fidelity-design.md` (+118 lines), landed in the same materialization commit as the plan itself. A
second, related sub-instance in the same blurb: the bullets cite only 17 of the window's 24 task
issues and drop the 0.20.0 blurb's closing catch-all clause ("every other change in the window is
Checkpoint prose, references mirrors, ADR record, ...") without widening the bullets — so the new
`docs/adr/0048-budget-maintenance-authority.md` (a binding decision record) lands with no mention in
the release notes at all. Both were audited as Nit/`note` (never `absorb`) for the same reason as
before: the fix is a two-release-slot lock-step edit, out of the mechanical/non-load-bearing bar for
absorb-eligibility, and touching release-slot files post-bump from a separate worktree risks
[[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]. Three straight recurrences
(0.20.0 categorical-scope gap; two related 0.20.1 gaps in the same sentence) confirm the checklist-
presence-vs-content gap described above is a standing authoring cost, not a one-off — the `### Status-
blurb authoring checklist` item 1 is not, and cannot easily be, mechanically checked against the real
diff window.

**Recurrence (clean pass) — 2026-08-30-engine-concurrency-and-pin-transfer/phase-3 task 3.1,
2026-08-30, 0.21.6 → 0.21.7:** the first recorded instance where the gate-audit's correctness seat
explicitly re-checked this same closing categorical-scope sentence ("no guard, hook, or run-config
surface changed in this window") against the **full plan window**
(`git diff --name-only df24d47...war/2026-08-30-engine-concurrency-and-pin-transfer/p3-3.1`, 20
files) and found it **accurate** — every file in the window bucketed into a named category (agent
cards, the ADR, `docs/learnings/*`, `war-room/SKILL.md`, test files, `workflow-template.js`,
`references/*.md`), none omitted. `code-verified` at the landed tip
`f994cb0c9a3079a8d577848768d6c45b0842e222` (read via the `_refinery` worktree matching that SHA,
gitdir physical path
`<repo-root>/.claude/war-worktrees/engine-concurrency-and-pin-transfer-2026-08-30/_refinery/`):
`CHANGELOG.md`'s `## 0.21.7` entry and `README.md`'s `## Status` line both carry the categorical
closing sentence, and it holds against the diff.

**Confirms the "how to apply" mitigation, not the defect:** unlike the two prior recurrences (both
genuine omissions), this seat literally enumerated the actual file classes in the diff window before
trusting the sentence — exactly this lesson's prescribed check — and the sentence passed. This is
the first evidence that doing the full-window enumeration (rather than eyeballing the blurb for
plausibility) reliably catches the defect class this lesson describes; a future auditor should treat
"I bucketed every file in `git diff --name-only <full-window>` into a named category" as the bar for
trusting a release blurb's categorical closing claim, not a lighter read.

Related: [[release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor]]
(same task/phase, a different release-shape recurring cost). This is the same underlying family as
the archived `release-blurb-headline-count-word-can-mismatch-its-own-enumeration` (a blurb's numeric
headline count vs. its own following enumeration) and `readme-status-blurb-homes-list-is-editorial-
not-exhaustive` (a bullet's `Homes:` pointer list vs. its own prose) — all three are instances of "a
release blurb's own summary/count/scope claim silently underclaims relative to what the rest of the
same document, or the actual landed window, contains" — but this occurrence is a distinct
sub-mechanism (a categorical closing absolute, not a numeric count or a pointer list), so it is
recorded as its own lesson rather than folded into either archived file.

**Recurrence (clean pass) — 2026-09-03-in-band-absorb-default/phase-7 task 7.1, 2026-09-04, release
task:** two Nits on the same `README.md` / `CHANGELOG.md` "Release scope" closing sentence, both
`disposition: note`. Code-verified at the landed tip `beaa001141d6853dfc62619917da7f46e35125cf`
(read via the `_refinery45` worktree, `HEAD` byte-equal to the tip; gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/`).
`README.md` line 448 and `CHANGELOG.md` line 25 both read "Release scope: the 44-file window from
this run's launch base, bucketed whole," then bucket the window into named categories (engine,
prompt and doctrine, tests, docs, learnings, config), then close with "the version slots and the
CHANGELOG head entry are this commit." The auditor's own bucket census summed to exactly 44
(engine 4, prompt/doctrine 18, tests 7, docs 5, learnings 9, config 1) — the categorical
enumeration passes this lesson's "how to apply" check again, a second clean pass. A plain
`git diff --stat` against the launch base actually returns 47 files; the 3-file delta
(`plugin.json`, `marketplace.json`, `CHANGELOG.md`) is the release commit's own version-slot bump
plus its own CHANGELOG entry, and the closing clause names all three by category. The mitigation in
[[bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands]]
generalizes here too: a release-window count can stay correct even though it is narrower than the
full launch-to-land diff, as long as the delta is disclosed in full, separately, by name.

A sibling finding pinned at an earlier sha (`2f35353...`) claimed the closing clause named only the
version slots and left `CHANGELOG.md` unnamed. Re-Read at the landed tip found `CHANGELOG.md`
explicitly named — that completeness gap was closed in a later fix round of the same task, before
land. Recorded per [[audit-log-finding-can-be-stale-by-land-time]]; do not cite that earlier sha as
a live gap.

**Confirms, sharpened:** for a release-window count sentence, the task-instruction-pinned figure
(here 44, authority rung 1) is authoritative — not a raw `git diff --stat` count against the launch
base. The release commit's own file bumps are expected to sit outside the pinned window; check that
they land in a separate, explicitly named disclosure clause, not folded silently into the headline
number.

> archived 2026-09-03: resolved — moved to archive
