---
name: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
description: "A release blurb's closing categorical claim ('every other change in the window is Checkpoint prose, references mirrors, ADR record, glossary, tour, telemetry rows, or test-side pins') can omit real landed classes (agent cards, CLAUDE.md, servitor-learnings docs) even though README's own Status-blurb authoring checklist item 1 ('bound every absolute') exists specifically to catch this — checklist presence is mechanically pinned, its content is not"
metadata: 
  promoted: dev/2026-08-25-ask-disposition@phase-3
  node_type: memory
  type: project
  provenance: code-verified
  slug: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
  phase: "ask-disposition/phase-3 (Release), task 3.1, 2026-08-25; recurred engine-reliability-and-filing-fidelity/phase-9 task 9.1, 2026-08-26"
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
  tags: 
    - war
    - release
    - readme
    - audit-findings
    - prose-precision
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-27T03:25:00.408Z
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

Related: [[release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor]]
(same task/phase, a different release-shape recurring cost). This is the same underlying family as
the archived `release-blurb-headline-count-word-can-mismatch-its-own-enumeration` (a blurb's numeric
headline count vs. its own following enumeration) and `readme-status-blurb-homes-list-is-editorial-
not-exhaustive` (a bullet's `Homes:` pointer list vs. its own prose) — all three are instances of "a
release blurb's own summary/count/scope claim silently underclaims relative to what the rest of the
same document, or the actual landed window, contains" — but this occurrence is a distinct
sub-mechanism (a categorical closing absolute, not a numeric count or a pointer list), so it is
recorded as its own lesson rather than folded into either archived file.
