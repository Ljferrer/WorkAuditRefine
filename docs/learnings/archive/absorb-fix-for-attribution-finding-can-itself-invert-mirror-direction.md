---
name: absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction
description: "A phase-close absorb-fix for a doc finding can itself carry a fresh defect the fail-open sweep…"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - phase-close polish
    - absorb finding
    - fail-open coherence sweep
    - note disposition terminal
    - mirror direction
    - CHANGELOG.md
    - README Status blurb
    - ADR 0008
    - construct-anchored
    - doc-truth
    - p2-polish
    - dropped mechanism detail
  provenance: agent-unverified
  slug: absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction
  phase: dispatch-args-and-floor-coverage/2.1+p2-polish; recurred interview-and-authoring-contract/2 p2-polish; recurred adr-doc-truth-sweep/phase-2 (Release) p2-polish
  tags: 
    - doc-honesty
    - adr
    - mirror-registry
    - phase-close
  created: 2026-08-21
  supersedes_repo_copy: docs/learnings/absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction.md
  originSessionId: 7ca1efff-82f4-4b12-a4e0-5ec1e43ee937
  modified: 2026-08-21T23:19:26.715Z
---

# An absorb-fix for a mirror-direction under-attribution can itself get the direction backwards — and land anyway

Local recurrence-update of the repo lesson at the same slug (that file has no nested
`metadata.provenance` mutation guard issue — it DOES carry one, `code-verified` — so per the
memory admission checklist's D1 recurrence rule this full copy is the canonical edit target for
future recurrences; the Lead's Gate-2 promotion overwrites the repo file at this slug on next
promote).

## The rule

When a task audit finding flags a doc passage as under-describing, mis-attributing, or
mis-punctuating something, the phase-close (`p<N>-polish`) fix that lands the correction is itself
new prose subject to the same scrutiny the original finding applied — and there is **no
guarantee any further round enforces it**. The phase-close coherence sweep is fail-open (a
discard leaves the pre-polish tip; even on a passing polish merge, the polish SHA's own audit is
not iterated to convergence), so a *new* defect raised against the polish diff itself can land
uncorrected. **Confirmed a third time in phase 2 ("Release") of plan `adr-doc-truth-sweep`, and
this occurrence generalizes the mechanism further**: the newly-introduced defect does not need to
be dispositioned `absorb` to ship unfixed — a `note`-dispositioned defect against a phase-close
fix is *equally* terminal, because there is no round after the terminal phase-close audit
regardless of disposition.

## Occurrence 1 — mirror direction inverted (dispatch-args-and-floor-coverage, 2026-07-27)

Task 2.1's audit flagged `docs/adr/0037-run-scoped-staged-phase-scripts.md`'s Consequences bullet
for under-describing a third exported anchor (disposition `absorb`, `phaseClose: true`). The
`p2-polish` fix's own Amendment note got the canonical-source/mirror-site direction backwards
(cast the live template code as the mirror, the stager's export as canonical — the opposite of
the load-bearing coupling comment at the mirror site). `p2-polish`'s own audit caught the reversal
(Minor, `absorb`, `autoFixable: true`) but no further round was threaded — verified at the landed
tip (`776ceeca2aee726565dc7816b0294eaa9091b494` on `dev/2026-07-26-dispatch-args-and-floor-coverage`)
that the backwards wording was still there.

## Occurrence 2 — CLAUDE.md Known-traps over-narrowing (interview-and-authoring-contract, 2026-08-05)

Task 6's queue flagged CLAUDE.md's `## Known traps` bullet for presenting a now-legacy-only rule
as the general one. The `p2-polish` rewrite itself over-narrowed the slug-sharing clause to
legacy pairs only, when a merged-plan-from-spec conversion still shares a slug. `p2-polish`'s own
audit flagged the rewrite (`absorb`, `autoFixable: true`) but verified at the landed tip
(`955e7c10d98e4c4c4e30d22f0ab7c29209f8ab23` on `dev/2026-08-05-2026-08-04-interview-and-authoring-contract`)
that the over-narrowed wording shipped unfixed.

## Occurrence 3 — dropped mechanism detail, `note` disposition, no `absorb` involved (adr-doc-truth-sweep phase 2 "Release", 2026-08-21)

Task 2.1's audit flagged a punctuation mis-binding in the README `## Status` blurb's ADR 0008
sentence (a colon mis-binding the per-ADR enumeration to the ADR-0008 clause; `Nit`, `absorb`,
`phaseClose: true`). The `p2-polish` fix re-punctuated it correctly but also **deleted** the
trailing clause "ADR 0008's line-anchored citation and mis-named construct pointer are
re-anchored by construct" as "now-redundant" — except that clause was the *only* place the blurb
named the construct-anchoring mechanism (the ADR 0030 D12 discipline that motivated End states 5–6
of this phase's Commander's Intent). `p2-polish`'s own re-audit (multiple auditor seats,
independently) caught the loss — but this time disposed it `note`, not `absorb` ("nothing false is
asserted... completeness, not correctness"). Because `p2-polish` is the terminal phase-close round,
a `note` disposition here has the **identical shipping outcome** as occurrence 1/2's `absorb`
disposition with no further round: the detail is gone from both the README bullet and its
byte-identical CHANGELOG.md mirror (the durable historical record) at land, and nothing downstream
re-drains it.

Could not verify this specific occurrence against the landed tip this run: cwd HEAD
(`067b7b538350044c283f2f7e14f5b85c6677d882` on branch `claude/work-audit-refine-red-team-4de4e6`)
is an unrelated plan/session, not the threaded landed tip
(`3f7b5eabade79d82380a3011e5e2e592409601d8` on `dev/2026-08-20-adr-doc-truth-sweep`); no
`.git/worktrees/*` entry was found whose `gitdir` names the `adr-doc-truth-sweep` slug (the task
worktree the audit log names, `adr-doc-truth-sweep-2026-08-20-r6`, was already reaped — its `HEAD`
file is absent); the landed branch ref has no live worktree, a dead end for Read with no Bash
available. Recorded per the gate-audit fallback rung — the fact of the finding and its `note`
disposition is drawn directly from this phase's audit-log input (multiple independent auditor
seats concur), not from a live Read of the shipped file. Verify still present before treating as a
live instance: `README.md`'s `## Status` section's ADR 0008 sentence, and `CHANGELOG.md`'s `##
0.18.1` entry's mirrored bullet.

## How to apply

When absorbing (or auditing) a phase-close fix for a prior finding: re-read the fix's *own* diff
for (a) whether it preserves every substantive fact the original passage carried, not just whether
it fixes the flagged defect, and (b) whether removing a clause labeled "redundant" in the fix's own
commit message actually is redundant, or is the sole carrier of a fact nothing else states. Do not
rely on a `note` disposition to mean "no consequence" — for a phase-close-introduced defect, `note`
and `absorb`-with-no-further-round ship identically. If the mechanism/detail matters at the
End-state level, request an `absorb` (or push it to a following phase's doc sweep) rather than
accepting `note`.

[[mirrored-prose-row-parenthetical-inversion]], [[adr-policy-table-entry-vs-mechanism-attribution]],
[[claude-md-adr-range-literal-recurs-stale-with-no-drift-guard]],
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]

> archived 2026-08-30: resolved — moved to archive
