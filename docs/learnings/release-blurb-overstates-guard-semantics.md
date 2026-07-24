---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata:
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, submodule refuse, prose nit, operator misinformation, absolute claim vs residual exception, ADR carve-out, fresh-env re-run, unconditional vs conditional emission, near-miss diagnostic, assert-test-in-diff.sh, stderr guard clause]
  provenance: code-verified
  promoted: dev/2026-07-22-test-floor-target-repo@phase-2
  slug: release-blurb-overstates-guard-semantics
  phase: "submodule-inc1/T4 +2 recurrences (war-campaign-resilience-roadmap/phase-2 Release task 2.1, 2026-07-22; test-floor-target-repo/phase-2 Release task 2.1, 2026-07-22)"
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
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
  modified: 2026-07-23T10:03:04.108Z
---

# Release blurb prose overstates guard semantics

**Local recurrence copy** of the repo-root lesson at `docs/learnings/release-blurb-overstates-guard-semantics.md`
(same slug) — the repo copy is not directly editable by a servitor (D1), so this file carries the
original content plus the new recurrence below; a future Gate-2 promotion of this file overwrites
the same-slug repo file.

**Rule** — when drafting the `## Status` blurb for a guard task, describe the **trigger surface** (what property of the task's *diff* causes the refuse), not repo topology. "Refuse diffs that touch X" is almost always more precise than "refuse repos that contain X". Fail-closed template: "Changes that X are blocked; safe-to-ignore diffs are unaffected." Blurbs favor short concrete phrasing, so writers unconsciously upgrade the restriction from the mutation surface to the topology surface — a prose Nit, never a land-halt, but it accumulates as operator misinformation across releases.

Instance (submodule-inc1/T4, v0.7.8): the blurb said "agents refuse to process repos that contain git submodules", but the landed guard (`skills/war/assets/assert-no-submodule-mutation.sh`) refuses **diffs touching submodule entries** (paths in `.gitmodules` or gitlink entries) and is a no-op on a submodule-free repo. Auditor rated it a Nit; suggested "refuse to process changes that touch git submodules". The offending blurb is gone from the live README — `## Status` is a replace-in-place slot ([[release-status-is-replace-slot-not-empty-field]]).

See [[gitmodules-working-tree-read-vs-ref-snapshot]] for the companion reading-context hazard.

## Recurrence 1 (2026-07-22, campaign war-campaign-resilience-roadmap, phase 2 "Release", task 2.1)

A distinct instantiation of the same family, this time not trigger-surface-vs-topology but
**absolute claim vs a documented residual exception**: task 2.1's audit (`disposition: note`,
Nit, not required to fix) flagged the release blurb's opening parenthetical — "a positive proof,
since the classifier re-ran the same tip green in a fresh environment moments earlier" — as stated
without exception, while the auditor's rationale cites an ADR (numbered "0040" in the audit
rationale) recording a "Residual, accepted" carve-out: the `REL_GUARD_PRECONDITION_FAILED`
short-circuit classifies `environment` **without** a fresh-env tip re-run, so a retry triggered by
that marker has weaker pass-prediction than the blurb's unqualified claim implies.

**Referent verified at Gate-2 (Lead, 2026-07-22).** The servitor's write-time absence note claimed
no accessible checkout carried an ADR above 0038 and flagged the referent unverified. That note was
itself a stale-checkout artifact and is **superseded**: at the landed phase-2 tip
`a2ab68ddef373e463da7f8b6f116855d1e68dcad`, `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`
is present and the `## Status` blurb carrying the flagged parenthetical is the live `**0.14.52**`
text. Both referents are confirmed; this recurrence's specific claim is settled, not provisional.

This is itself an instance of [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — and
a pointed one, since the landed-tip anchor threading meant to mitigate it had already shipped: the
anchor tells the servitor *which* SHA is authoritative but cannot conjure a checkout containing it,
so when Refine has already reaped the task worktrees the servitor is left with no readable tree.
The honest absence note was the correct servitor behavior; resolving it is Gate-2's job.

**Confirms the general Rule generalizes** beyond trigger-surface-vs-topology to any release blurb
that states a proof-strength claim as universal when a design doc records a named residual
carve-out: hedge with "normally"/"typically" rather than an unqualified claim whenever a known
exception is on record, even a Nit-severity, not-required-to-fix one.

## Recurrence 2 (2026-07-22, plan `test-floor-target-repo`, phase 2 "Release", task 2.1) — unconditional-reads prose for a guard-clause-conditional code path

A third distinct instantiation: **unconditional-reading prose vs. an explicit runtime guard
clause.** The `## Status` blurb (`README.md` line 339 at land) describes the new near-miss
diagnostic as: "[assert-test-in-diff.sh] prints a **stderr** block naming the active pattern set
... followed by each near-miss path" — phrased as something the exit-1 path always does. The
landed script wraps the entire block behind `if [ -n "$near_misses" ]` (`skills/war/assets/assert-test-in-diff.sh`,
~line 254 at the phase-2 tip `088e2cb75787ca2dfd9ed80aaa0ec417d7df2201` — verify still present
before acting), so a docs-only exit-1 diff (no test-shaped file anywhere in the changed-file list)
keeps stderr byte-identical to today: empty. `code-verified`: read directly at the task's
`_refinery` merge worktree (`<session-worktree>/.claude/war/wt/2026-07-22-test-floor-target-repo-2026-07-23/_refinery/`)
since the servitor's own cwd was — again — the stale worktree
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] documents (Recurrences 12/14/15,
same physical worktree `war-campaign-resilience-roadmap-33290f`).

Auditor disposition was `note` (Nit, not required to fix) and the blurb was **not** corrected before
land. **Resolved at Gate-2 (Lead, 2026-07-23):** the servitor's "remains unapplied" status was
accurate at wrap-up time but is now superseded — the Lead applied the auditor's own suggested wording
(`and, **when that scan finds anything**, prints a **stderr** block …`) to the landed `## Status`
blurb before the plan's PR was opened, re-running `version-slots.test.mjs` (3/3) and the full JS gate
(881/881) to confirm the four release slots and the arbiter's README-token extraction were untouched.
The general Rule below stands on its own; only this instance's disposition changed.

**Sharper form of the Rule for this instance:** when a release blurb narrates a diagnostic/logging
side effect that lives behind its own runtime conditional (as opposed to firing unconditionally
whenever the parent code path is taken), state the conditional explicitly — "prints X **when** Y"
— never just "prints X" with the trigger condition left implicit in the surrounding prose. A reader
cannot distinguish "always emits on this exit code" from "emits only when this sub-condition also
holds" without the explicit qualifier, and the gap is exactly the kind of prose a fresh operator
would trust literally when deciding whether empty stderr on a real no-test run is expected or a
regression.
