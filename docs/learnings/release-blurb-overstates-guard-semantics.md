---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata:
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, absolute claim vs residual exception, prose nit, operator misinformation, universal quantifier overclaim, Status-blurb authoring checklist, release blurb precision]
  provenance: code-verified
  promoted: dev/2026-08-06-doc-cli-consistency-corpus@phase-2
  slug: release-blurb-overstates-guard-semantics
  phase: "submodule-inc1/T4 +25 recurrences (instances cut; see git history)"
  tags:
    - war
    - release
    - readme
    - status-section
    - guard
    - submodule
    - plan-repo-mismatch
    - prose-precision
  relates:
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[gitmodules-working-tree-read-vs-ref-snapshot]]"
    - "[[static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class]]"
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
  modified: 2026-08-25T00:00:00.000Z
---

# Release blurb prose overstates guard semantics

**Rule.** A `## Status` release blurb tends to state a stronger property than its evidence covers. The writer drops a scope word, a qualifier, a condition or a residual exception, and a narrow true claim becomes a broad false one. Auditors rate each instance a Nit, never a land-halt, but the errors pile up as operator misinformation. This is the repo's most frequent release-prose defect: 25 recurrences from 2026-06-30 to 2026-09-12. The per-recurrence narratives were cut on 2026-11-10; git history of this file keeps them.

The live guard is the `### Status-blurb authoring checklist` in `README.md` (under `## Releasing`). It distills this lesson. Run it over every blurb before landing.

## Named shapes (one instance each)

- **Trigger surface vs topology.** "Refuse repos that contain submodules" for a guard (`assert-no-submodule-mutation.sh`) that refuses *diffs touching* submodule entries. Say "refuse diffs that touch X".
- **Absolute claim vs documented residual.** "A positive proof, since the classifier re-ran the tip green" while ADR 0040 records a residual path with no fresh-env re-run. Bound the claim at the point you make it, not two sentences later.
- **Unconditional prose for conditional code.** "Prints X" for a diagnostic behind its own runtime `if`. Write "prints X when Y".
- **Blanket clause across heterogeneous arms.** One clause covers several guard shapes, and one shape does not hold the property. Includes "every `case` arm is byte-unchanged" when a string inside one arm changed (say "every arm's pattern").
- **Bolded lead-in broader than its body.** A bare "No behavior change:" label scoped by its colon to a narrower list than the paragraph's own headline.
- **Appositive attachment.** "…enforced by X, itself unchanged" binds to the nearest noun X, which this release did change. Name the subject outright.
- **Dropped qualifier from the cited source.** A paraphrase of an ADR, test banner, source comment or deny message drops its scope noun ("body", "token-scoped", "short of its whole line"). Diff the blurb against the source's exact words. The source itself may already overclaim; check it against code first ([[release-blurb-that-restates-a-code-comment-inherits-its-overclaim]], [[static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class]]).
- **Enumeration gap.** "Outside `<dir>`, the only other touch is Y" or "per-family proof" omits an item, often the release's own version-slot files. Count subjects against items over the whole diff. See [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]].
- **Work scope vs release scope.** "Engine untouched" is true of the plan's diff but false of the release window, which absorbed unbumped landings ([[stacked-per-branch-releases-make-main-lag-cumulative]]).
- **One copy pinned, several copies claimed.** "Two controls pin the guard" when the guard is three hand-duplicated copies and the controls exercise one.
- **Prompt-mandated stated as code-enforced.** "Always carries a trailer" when only a dispatched worker prompt instructs it. Use "mandates" or "instructs" ([[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]).
- **Plan literal older than a phase-internal discovery.** The plan text was true when written; a residual found mid-phase was never threaded back into the slice the worker drafted from.
- **Stale draft after an in-phase correction.** The blurb reuses phrasing from before this phase fixed the artifact it describes.

## Pre-land checklist (beyond the README items)

1. Re-run the paragraph that *introduces* a checklist or guard through that checklist. Writing it down does not make the paragraph comply.
2. Diff reused stock sentences ("No previously-valid invocation…") against this plan's own Method and End state.
3. For "the guard is pinned/covered", check whether the code is one shared function or several copies.
4. For a deny-message paraphrase, trace the message to its code condition.
5. Before widening a retirement grep repo-wide, exclude the `## Status` text that quotes the retired literal.

**Why:** blurbs favor short, concrete phrasing, so the writer upgrades a narrow reach to a general one without noticing. No lint can judge it; only a careful re-read against the source can.

**How to apply:** draft the blurb from the code and the cited artifact's exact words, then run the README checklist and the items above. `## Status` is a replace-in-place slot ([[release-status-is-replace-slot-not-empty-field]]); the bump slots are in [[release-bump-slots-canonical-no-badge]]. Companion reading hazard: [[gitmodules-working-tree-read-vs-ref-snapshot]]. Prompt-vs-card mirror context: [[standing-instruction-vs-dispatched-prompt-coverage-split]].
