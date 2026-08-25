---
name: release-status-is-replace-slot-not-empty-field
description: "README ## Status = replace-in-place, never empty — and the discipline scopes the whole…"
metadata: 
  node_type: memory
  slug: release-status-is-replace-slot-not-empty-field
  phase: "5 +1 recurrence (2026-08-06-references-pointer-integrity/phase-2 Release task #1544, 2026-08-18)"
  type: project
  provenance: agent-unverified
  keywords: 
    - version bump
    - overwrite paragraph
    - populate empty premise
    - single current value
    - latest pointer
    - verify baseline
    - half-replaced blurb
    - stale bullets
    - prior release bullets
    - self-contradiction
    - README diff
    - mechanical backstop gap
    - section-level replace
  tags: 
    - war
    - release
    - readme
    - status-section
    - plan-repo-mismatch
    - mirrored-value
    - reusable-pattern
  files: 
    - README.md
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
  relates: 
    - "[[retire-token-needs-clean-surface-gate-test]]"
    - "[[release-blurb-overstates-guard-semantics]]"
    - "[[readme-markdown-links-excluded-from-reference-link-integrity-sweep]]"
    - "[[audit-log-finding-can-be-stale-by-land-time]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T18:30:26.275Z
---

# README `## Status` is a replace-in-place release slot, not an empty field

**Local recurrence copy** of the repo-root lesson at `docs/learnings/release-status-is-replace-slot-not-empty-field.md`
(same slug) — the repo copy carries no nested `metadata.provenance` (it predates the
provenance-tagging discipline), which makes it user-authored/untagged and not directly editable by
a servitor (D1); this file carries the original content plus the new recurrence below, and a future
Gate-2 promotion of this file overwrites the same-slug repo file.

Durable rule: `README.md ## Status` holds exactly ONE current-release paragraph. The correct
release operation is always "overwrite the whole paragraph with the new version's note" —
never append below, never treat as a blank to fill. The slot is *always* non-empty by the
next release, so a plan slice saying "populate an EMPTY Status" is factually wrong on every
release after the first (first observed in the 0.5.0 release; practiced correctly in every
release since).

**Why:** a "populate empty" framing hands the worker a false premise, and a mirrored-slot
overwrite silently replaces a real prior value — verify the baseline yourself instead of
trusting the "empty" wording.
**How to apply:** for any single-current-value slot (Status paragraph, version string, a
"latest" pointer), read plan text saying "populate" as **"replace and verify baseline"**.
Full slot enumeration lives in [[release-bump-slots-canonical-no-badge]].

## Recurrence 1 (2026-08-18, plan `2026-08-06-references-pointer-integrity`, phase 2 "Release",
task #1544, epic #1529) — the replace-in-place discipline scopes the whole SECTION (headline
paragraph + its `- **…**` bullet list), not the paragraph alone, and a half-replacement can
self-contradict its own new headline

A new sub-mechanism: the release-0.17.13 worker swapped only the `## Status` headline paragraph
and left the PRIOR release's four `- **…**` bullets in place beneath the new version heading.
Primary evidence (Lead's own read): `git diff e45a460 9b5f1bf -- README.md` was exactly 1
insertion / 1 deletion — a headline-only swap, structurally incapable of having touched the
bullet block at all. Consequences: (a) the prior release's bullet body survived under the new
version heading — a replace-in-place violation at *section* granularity, even though the
paragraph itself was correctly replaced; (b) a self-contradiction inside one section — a
surviving stale bullet asserted "This sentence-pair is the release's only production-behavior
change" while the new headline claimed zero production-behavior change for the current release.
Caught by the Lead reading the one-line diff by hand, not by any check, End state, gate, or
suite — **no mechanical backstop in this repo reads README's bullet block at all**, the same
underlying coverage gap [[readme-markdown-links-excluded-from-reference-link-integrity-sweep]]
records for README's links (README sits outside every mechanical sweep). Fixed by a follow-up
commit (`e68ee16`) before land.

**Verification note (landed-tip grounding):** this servitor's cwd is the main checkout on
`master`, at a different, already-merged plan's tip (release 0.17.11); the
`dev/2026-08-06-references-pointer-integrity` branch this fact landed on has no live worktree
(`.git/worktrees/` is empty in this checkout) and no ref present (absent from both
`refs/heads/` and `packed-refs`) — landed-tip-grounding rungs 1-3 all fail, and rung 3 is a dead
end with no Bash available to check it out. This recurrence is recorded per the Lead's report
(diff stat + commit SHAs), not independently re-derived by this servitor. Because the defect was
already fixed in a follow-up commit before land, it is recorded here as a **generic pattern**,
not as a currently-live instance of the README diff — never cite `e45a460..9b5f1bf` as a
present-tense defect.

**Sharpened rule:** when auditing or authoring a release `## Status` edit, diff the WHOLE
`## Status` region (from the heading through the next `## `), not just the paragraph you
intentionally touched — a worker can correctly rewrite the headline while a line-scoped diff (or
a skimming author) never notices the old bullets rode along untouched beneath it, and stale
bullets from a prior release can directly contradict the new headline's own claim.

Related: [[release-blurb-overstates-guard-semantics]] (sibling blurb-prose family — precision of
a claim within the paragraph, not stale-content survival across the whole section);
[[audit-log-finding-can-be-stale-by-land-time]] (same "fixed before land" evidentiary shape —
record the pattern, not the resolved instance).
