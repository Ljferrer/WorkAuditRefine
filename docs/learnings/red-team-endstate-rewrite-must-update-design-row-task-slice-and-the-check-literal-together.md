---
name: red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together
description: "Rewriting an End state during /red-team hardening without ALSO updating its design-tree row, the owning task's plan slice, and the End state's own `check:` literal creates a cross-rung contradiction (ADR 0041): the worker implements the design row faithfully, the stale check certifies the wrong outcome as green, and the miss only surfaces post-merge at gate-audit as a held:escalation"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together
  phase: 2026-08-06-redteam-rounds-config-telemetry/1 (End state 7, held:escalation, landed dev/2026-08-06-redteam-rounds-config-telemetry @ 396ede1)
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
  tags:
    - war
    - red-team
    - plan-authoring
    - gate-audit
  created: 2026-08-16
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T02:21:49.126Z
---

# A /red-team End-state rewrite must move FOUR surfaces, not one

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

## Concrete instance

Plan 7's End state 7 was rewritten to require `skills/war-campaign/SKILL.md`'s Campaign-ledger bullet
to **cite `makePlanEntry`** instead of re-enumerating the entry's field set (ADR 0025 — the
enumeration is an unguarded prose mirror). But:

- **D11** still said *"extend the enumeration to '…status/branch/PR/SHA/stop-point/backstops/red-team rounds' and point at the helper header"*.
- **Task 1.2's slice** restated the same instruction.
- **End state 7's `check:`** was still `grep -n 'stop-point/backstops/red-team rounds'` — which the **enumeration form satisfies**.

The worker extended the enumeration, the check went green, and two independent gate-audit seats
caught End state 7 provably unmet at the pinned tip, recording the cross-rung contradiction under
ADR 0041 D3 (rung 1 threaded End-state array + rung 2 adjudication row both required `makePlanEntry`;
only rung 3, the plan body, matched what landed). The phase held; the Lead completed the land after
repairing all four surfaces.

**Why:** the rungs disagree silently. Nothing mechanically binds a plan's D-row to its End state, so
a one-surface edit is invisible until post-merge.

**How to apply:** when `/red-team` rewrites an End state, grep the plan for the old requirement's
distinctive wording and fix **every** hit — D-row, task slice, condition, and check — in the same
commit. Then re-execute the new `check:` at the base and confirm it is **red** there: a check that
was written for the old wording will often still be green, which is the tell. Prefer a check that
asserts **both halves** (new form present AND old form absent) so the superseded form cannot pass.

Related: [[plan-array-literal-lags-canonical-export]],
[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]],
[[end-state-file-level-grep-floor-satisfied-by-explanatory-comment-alone]]
