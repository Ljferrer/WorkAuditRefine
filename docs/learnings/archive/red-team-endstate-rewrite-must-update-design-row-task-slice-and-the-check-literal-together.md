---
name: red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together
description: "A /red-team End-state rewrite must update the design-tree row, the task slice, the condition text, the check: literal, and any old End state it replaces in the same patch, or a stale check certifies the wrong outcome"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together
  phase: 2026-08-06-redteam-rounds-config-telemetry/1 (End state 7, held:escalation) + 2026-10-20-rea-artifact-evidence/phase-7 task 7.1
  keywords:
    - red-team hardening
    - End state rewrite
    - design tree row
    - plan slice
    - check literal
    - cross-rung contradiction
    - ADR 0041
    - held escalation
    - gate-audit execution-evidence
    - stale check certifies wrong outcome
    - unguarded prose mirror
    - loop-budget.md
    - ADR 0042 trigger pointer
    - cold doctrine
    - four-surface sweep
    - End state superseded
    - unmet attestation
    - release End state
    - merge-base check
    - plan amendment
    - resolved
  tags:
    - war
    - red-team
    - plan-authoring
    - gate-audit
    - release
  created: 2026-08-16
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-09-03T09:58:10.765Z
---

# A /red-team End-state rewrite must move every surface that states the requirement

## The pattern

A merged plan states the same requirement on four surfaces: the **design-tree row** (D-row), the
owning **task's plan slice**, the **End state's condition text**, and the End state's **`check:`
literal**. `/red-team` hardening that rewrites only the condition text leaves the other three
carrying the superseded design.

The worker reads the **task slice** (and through it the D-row), not the End state prose. So it
implements the *old* design faithfully and correctly. Worse, the stale `check:` is usually the one
that matched the *old* wording — so it goes **green on the wrong outcome**, actively certifying the
defect. The miss is invisible until the post-merge gate-audit execution-evidence seat evaluates the
End state's condition text against the tip, and the phase returns `held:escalation`.

A fifth surface: when a decision row or adjudication *replaces* an End state, the **old End state**
itself. A superseding End state added beside the old one leaves the old check live, and the gate
attests it `unmet`.

## Instances

- Plan 7's End state 7 was rewritten to require a SKILL.md bullet to **cite `makePlanEntry`**
  instead of re-enumerating its field set. D11, Task 1.2's slice, and the `check:`
  (`grep -n 'stop-point/backstops/red-team rounds'`) all still matched the enumeration form. The
  worker extended the enumeration, the check went green, and two gate-audit seats caught End state 7
  provably unmet (an ADR 0041 cross-rung contradiction). The phase held until the Lead repaired all
  four surfaces.
- In `docs/plans/2026-10-20-rea-artifact-evidence.md`, D25 (no second version) and End state 28
  (version unchanged) were added beside End state 21, which still required a version strictly above
  the working-branch merge-base. An earlier phase had already released on that branch, so the check
  was false by construction. Two gate-audit seats attested End state 21 `unmet`.

**Why:** the rungs disagree silently. Nothing mechanically binds a plan's D-row to its End state, so
a one-surface edit is invisible until post-merge.

**How to apply:**
- When `/red-team` rewrites an End state, grep the plan for the old requirement's distinctive
  wording and fix **every** hit — D-row, task slice, condition, and check — in the same commit.
- When a decision row replaces an End state, strike or rewrite the old End state in the same patch.
- Re-execute the new `check:` at the base and confirm it is **red** there: a check that was written
  for the old wording will often still be green, which is the tell. Prefer a check that asserts
  **both halves** (new form present AND old form absent) so the superseded form cannot pass.
- In a plan with several release-capable phases, key a release End state on the stack base
  (`origin/master`), because the working branch may already carry the bump.

Related: [[plan-array-literal-lags-canonical-export]],
[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]],
[[end-state-file-level-grep-floor-satisfied-by-explanatory-comment-alone]],
[[redteam-adjudication-is-authoritative-version-source]],
[[gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream]],
[[release-bump-slots-canonical-no-badge]]

## Promoted to cold doctrine

The four-surface rule is standing doctrine: `skills/red-team/references/loop-budget.md`'s "Patch
style" section states it, and `skills/red-team/SKILL.md` Step 5 carries the ADR-0042 trigger pointer
to it ("When patching an End state, read [references/loop-budget.md](references/loop-budget.md)...").
Both surfaces are pinned by a doc-guard in `red-team-gate.test.mjs`. The strike-the-old-End-state
rule was not in `skills/war-strategy/SKILL.md` or `skills/war-strategy/references/plan-interview.md`
when last recorded.

> archived 2026-08-17: resolved — moved to archive
