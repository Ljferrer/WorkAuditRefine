---
name: readme-status-blurb-homes-list-is-editorial-not-exhaustive
description: "An enumerated homes list (README Status Homes:, a census End state's expected homes) is illustrative; classify an unlisted hit by its nearest listed analog and grade it note"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: readme-status-blurb-homes-list-is-editorial-not-exhaustive
  phase: "2026-08-06-handoff-schemas-contract/phase-3, task 3.1 audit + p3-polish gate-audit"
  keywords: 
    - Homes list
    - Status blurb
    - README Status
    - authoring checklist
    - note disposition
    - absorb bar
    - release slot
    - terminal phase-close polish
    - under-attribution
    - Home vs Homes
    - schemas.md
    - workflow-template.js
    - cross-task coherence
    - doctrine census
    - expected homes
    - git log -G
    - enumerate every hit
    - nearest listed analog
  tags: 
    - war
    - release
    - readme
    - audit-findings
    - process
    - census
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T17:07:25.060Z
---

# An enumerated "homes" list is illustrative, not exhaustive

**The rule.** An enumerated homes list sits next to open-ended prose. Examples: a README `## Status`
bullet's trailing `Homes:`/`Home:` list, or a plan census End state's list of "expected homes". The
list is a pointer for the reader, not a closed set to diff against. When a hit or a named surface is
missing from the list, classify it by its nearest listed analog. Grade it `note`, never `absorb` or
a HARD hold.

**Instance 1 (README Status blurb).** Phase 3 of `2026-08-06-handoff-schemas-contract` shipped five
Status bullets, each ending in a `Home:`/`Homes:` list. Three of them name a surface in their own
prose that their list omits (for example, a bullet whose prose names a `schemas.md` `followUps` row
but whose Homes list has no `schemas.md`). The control bullet's list is complete only because an
earlier polish round had already `absorb`ed a finding on that exact bullet.

**Instance 2 (plan census).** A plan End state required a census of a doctrine phrase "at exactly the
expected homes … and nowhere else unexpected" and listed six homes; `git log -G` found a seventh, the
plan's own red-team report quoting the phrase, which classifies like the listed plan and spec
("planning artifact quoting the doctrine — leave"), so the End state was MET.

**Why these are `note`, not `absorb`/`follow-up`:**

1. **No exhaustiveness rule exists.** `README.md`'s `### Status-blurb authoring checklist` has seven
   items (bound every absolute, repeat a guard's scope word, trigger surface not topology,
   conditional side effects, scoped labels, appositives, provenance). None of them says a `Homes:`
   list must be exhaustive. A census plan's own procedure is "enumerate and classify EVERY hit;
   never match a pre-declared count", so its list is a reminder, not ground truth.
2. **The plan slice does not mandate it either.** The task slice asked for identifier truth,
   count-word/enumeration match, and no-wider-than-implementation guard semantics. An exhaustive
   `Homes:` list was never in scope.
3. **The omissions pre-date the diff under audit.** They were present at the phase base. An
   `absorb` bar refuses them for that reason too.
4. **Terminal-round bar.** When the finding comes from the phase's terminal polish gate-audit,
   `absorb` has no further round to land it; see
   [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].

One exception: if a finding on that exact bullet was already `absorb`ed in an earlier round, trust
the fixed bullet's list as the corrected baseline. Its uncorrected siblings stay `note`.

**How to apply:**

- When auditing a blurb whose bullets pair prose with a `Homes:`/`Home:` list, do not treat a
  prose-named but unlisted surface as a defect by default. Check (a) whether a checklist or plan
  slice mandates exhaustiveness (usually not), (b) whether the omission pre-dates the diff, and
  (c) whether this is the terminal round. All three favor `note`. Consider `absorb`/`follow-up` only
  for a fresh, diff-introduced omission on a non-terminal round where the surface is the sole
  pointer to a contract file.
- When auditing a census clause, re-derive the hit set yourself with `git log -G <phrase>
  --name-only` before ruling "unexpected home". It is git-verb-allowlisted for an auditor seat and
  catches same-class stragglers the plan's list missed.
- When authoring a census clause, either drop the enumerated list and rely on "enumerate and
  classify every hit", or caveat the list as non-exhaustive and tell the classifier to rule an
  unlisted same-class hit like its nearest listed analog.

**Locate-cue (verify still present before acting):** `README.md`, the `## Status` section and the
`### Status-blurb authoring checklist` above it.

Related: [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] (the
disposition-routing mechanics); [[release-blurb-overstates-guard-semantics]] (the sibling family of
Status-blurb calibration rules); [[plan-survey-token-sweep-misses-untagged-siblings]] (a plan's
literal-sweep instruction is a floor for the mechanical step, not a completeness guarantee).

> archived 2026-08-25: resolved — moved to archive
