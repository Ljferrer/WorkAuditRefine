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

**Rule.** When a decision row or red-team adjudication replaces an End state, strike or rewrite the old End state in the same patch. A superseding End state added beside the old one leaves the old check live, and the gate attests it `unmet`.

**Why:** in `docs/plans/2026-10-20-rea-artifact-evidence.md`, decision row D25 (no second version) and End state 28 (version unchanged) were added beside End state 21, which still requires a version strictly above the working-branch merge-base. An earlier phase had already released on that branch, so the strict comparison was false by construction. Against the fork base the substance held. Two gate-audit seats attested End state 21 `unmet`, and each filed one Nit `note` citing the adjudication-match rule (a matching finding is a confirmation note, never an escalation), so the phase landed with the `unmet` on record.

**How to apply:**
- Treat the old End state as a fifth surface of the four-surface sweep in [[red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together]].
- Key a release End state in a plan with several release-capable phases on the stack base (`origin/master`), because the working branch may already carry the bump.

**Still open.** `skills/war-strategy/SKILL.md` and `skills/war-strategy/references/plan-interview.md` carry no strike-the-old-End-state rule. The nearest doctrine is the patch rule in `skills/red-team/references/loop-budget.md` (patches state the final rule).

**Locate-cue (verify still present before acting).** `docs/plans/2026-10-20-rea-artifact-evidence.md` carries the D25 row, End state 21 with its `git merge-base HEAD origin/dev/...` check, and End state 28, with no supersession mark on End state 21. The adjudication-match rule sits at `adjudicationClause` in `skills/war/assets/workflow-template.js`.

Related: [[redteam-adjudication-is-authoritative-version-source]], [[gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream]], [[release-bump-slots-canonical-no-badge]].
