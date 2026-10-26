---
name: plan-end-state-superseded-by-a-later-decision-row-stays-live-and-attests-unmet-at-the-gate
description: "A decision row that supersedes an End state, added beside it and not replacing it, leaves the old check live and unmet"
metadata:
  node_type: memory
  type: project
  keywords:
    - End state superseded
    - adjudication match
    - unmet attestation
    - release End state
    - merge-base check
    - D25
    - version unchanged
    - plan amendment
  provenance: code-verified
  slug: plan-end-state-superseded-by-a-later-decision-row-stays-live-and-attests-unmet-at-the-gate
  phase: 2026-10-20-rea-artifact-evidence/phase-7 task 7.1
  tags:
    - war
    - plan-authoring
    - gate-audit
    - release
  created: 2026-10-24
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-25T00:57:11.782Z
---

# Strike the old End state when a decision row replaces it

**Pattern.** A plan amendment added decision row D25 (user ruling, 2026-10-22: no second version, the 0.21.17 head blurb and its README twin are replaced in place to cover Phases 5 and 6) and a new End state 28 (version unchanged). It left End state 21 in place. End state 21 still requires the four slots and the `CHANGELOG.md` entry to move to a version strictly above the merge-base with the working branch.

**Why End state 21 is red by construction.** Its check compares the plugin version with the version at `git merge-base HEAD origin/dev/2026-10-20-rea-artifact-evidence`. An earlier phase had already released 0.21.17 on that branch, so the merge-base version equals the tip version and the strict comparison is false. Against the fork base (the `master` merge-base, 0.21.16) the tip is above, so the substance holds.

**What the gate did.** The task 7.2 gate-audit seat and the phase integrated-tip seat both attested End state 21 `unmet` and End state 28 `met`. Each filed one Nit with disposition `note`, citing the adjudication-match rule: a result the adjudication rung rules is a confirmation note, never a hold. The phase landed with that `unmet` attestation in the gate-audit entries. Both seats suggested the same repairs: mark End state 21 superseded by End state 28 and D25, or key a release check on the stack base, not the working branch.

**How to apply.**
- When a decision row or red-team adjudication replaces an End state, strike or rewrite the old End state in the same patch. This extends the four-surface sweep in [[red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together]]: a superseding End state added beside the old one leaves the old check live, so a fifth surface needs the sweep.
- A release End state that must hold in a plan with several release-capable phases should key its baseline on the stack base (`origin/master`), because the working branch may already carry the bump.
- As Lead, expect `unmet` for End state 21 in this run's gate-audit attestations. Cite D25 in the reconciliation. Do not hold on it.

**Locate-cue (verify still present before acting).** `docs/plans/2026-10-20-rea-artifact-evidence.md` carries the D25 row, End state 21 with its `git merge-base HEAD origin/dev/...` check, and End state 28 ("version unchanged"), with no supersession mark on End state 21. `CHANGELOG.md` heads at `## 0.21.17` and `.claude-plugin/plugin.json` reads 0.21.17. Found at landed tip 218012434004 on `dev/2026-10-20-rea-artifact-evidence`.

Related: [[redteam-adjudication-is-authoritative-version-source]], [[gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream]], [[release-bump-slots-canonical-no-badge]].
