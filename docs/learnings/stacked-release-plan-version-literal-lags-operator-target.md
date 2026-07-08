---
name: stacked-release-plan-version-literal-lags-operator-target
metadata:
  node_type: memory
  type: project
  keywords: [hardcoded bump, stale semver, re-baseline, fallback clause, master moved, next free patch, version mismatch]
  provenance: agent-unverified
  slug: stacked-release-plan-version-literal-lags-operator-target
  phase: provisioning-lifecycle/p3; recurred workflow-template-test-fidelity-sweep/phase-7-t7 (v0.8.6, 2026-07-01); recurred learnings-read-path/phase-2-T5 (v0.14.5, 2026-07-06); recurred war-working-branch-checkout-guard/phase-2-t4 (v0.14.8, 2026-07-06); recurred audit-calibration-and-graduation/phase-2-t3 (v0.14.9, 2026-07-06); recurred target-repo-agnostic-execution/phase-4-p4t1 (v0.14.10, 2026-07-07)
  tags:
    - release
    - stacking
    - plan-drift
    - operator-override
    - conditional-baseline
  related: "[[release-status-is-replace-slot-not-empty-field]], [[release-bump-slots-canonical-no-badge]], [[version-slots-no-cross-slot-consistency-test]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
  created: 2026-06-28
  provenance: agent-unverified
---

# Stacked releases: plan version literal lags operator-directed target

**Durable rule:** a release task's hardcoded version literal in the plan doc is stale the moment an earlier stacked plan lands. Authoritative source = the operator/task directive + the baseline version in the worktree — never the plan's hardcoded string.

**Auditor note:** seeing "plan says vX, candidate ships vY" on a stacked release — verify the worktree baseline and the operator task prompt; if both confirm vY, the worker was correct (Nit at most, never a defect). And check whether the plan already wrote a fallback clause ("re-baseline if master moves") BEFORE flagging the mismatch: a re-baselined bump under such a clause is compliance, not drift.

**Plan-authorship pattern:** when a release task sits at the end of a serial stack, state both (a) the expected baseline as of drafting and (b) an explicit standalone-fallback rule ("if run off another tip, re-baseline to the next free patch off the live tip"). Live example: `docs/plans/2026-06-30-workflow-template-test-fidelity-sweep.md` (Coordination section).

Validated four times: provisioning-lifecycle/p3; workflow-template-test-fidelity-sweep/phase-7-t7 (v0.8.6); learnings-read-path/phase-2-T5 (v0.14.5); war-working-branch-checkout-guard/phase-2-t4 (v0.14.8, 2026-07-06) — plan literally named the stacked-PR risk in prose ("master may already be at 0.14.7 from the doc-rot PR #557, so the next free patch depends on landing order") and the worker correctly resolved 0.14.7 → 0.14.8 at land time; gate-audit confirmed all four slots relationally correct and filed only an informational Nit ("End-state 5 MET"), never a hold.

**Fifth recurrence:** audit-calibration-and-graduation/phase-2-t3 (2026-07-06) — trailing release-bump phase targeted "0.14.9 (next free patch above base 0.14.8)"; gate-audit at integration tip `0efe3cce1fd2f577a9cb39752138af613ddedd56` confirmed all four slots (plugin.json version, marketplace.json metadata.version + plugins[0].version, README.md `## Status`) read 0.14.9 with no stale 0.14.8 residue — Nit/`note` disposition only, never a hold. Same pattern, fifth straight clean resolution: this is now a reliably self-correcting worker behavior, not a recurring risk worth escalating further.

**Sixth recurrence:** target-repo-agnostic-execution/phase-4-p4t1 (2026-07-07) — trailing release phase ("Release") targeted the next free patch above the phase-4 integration base (both master and the base sat at 0.14.9); auditor confirmed via `git show` at branch head that all four slots moved 0.14.9 → 0.14.10 with no silent no-op, README `## Status` kept the replace-in-place `**0.14.10** — <blurb>` shape (no badge), and the blurb quoted no retired token so no pre-existing absence guard re-tripped. Nit/`note` only. Sixth straight clean resolution.
