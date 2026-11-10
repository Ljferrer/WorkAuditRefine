---
name: gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream
description: "RESOLVED (#1082): an End-state condition owned by a sibling task not yet landed at the audit's pinned sha is non-holding for this task's gate-audit; record it as an out-of-scope note, never a hold"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream
  phase: "cli-main-guard-normalization/phase-1 task 1.1 gate-audit (landed dev/2026-07-22-cli-main-guard-normalization, 2026-07-23); RESOLVED gate-evidence-and-release-integrity/phase-1 task 1.2 (#1082, landed dev/2026-07-24-gate-evidence-and-release-integrity, 2026-07-26)"
  keywords:
    - gate-audit scope
    - out-of-scope end state
    - deps task ownership
    - non-holding finding
    - downstream task end state
    - task 1.1 task 1.2 deps chain
    - End state ownership
    - premature gate-audit hold
    - disposition note phaseClose false
    - endStateBlock case 3
    - End-state ownership mapping
    - deps-chained sibling task
    - engine-encoded not judgment-only
  tags:
    - gate-audit
    - plan-fidelity
    - audit-scope
  created: 2026-07-23
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-08-16T01:45:24.260Z
---

# A gate-audit scoped to task N must not hold on an End state owned by task N+1's `deps`-chained slice

**The rule:** when a plan's End-state list is shared across multiple `deps`-chained tasks in one
phase, a gate-audit scoped to an earlier task in that chain must check **which task's plan slice
owns each numbered condition** before treating any of them as a blocking miss. A condition whose
`plan_ref`/slice text names a *different*, not-yet-landed task as the owner is non-holding for the
current task's audit — record it as an informational note, never a Critical/Major/hold. This also
covers plain parallel siblings with no `deps` edge: read "deps-chained sibling" as any sibling task
in this phase not yet landed at this audit's pinned sha. This is the gate-audit-specific instance
of the broader "verify the specific owning slice before flagging" discipline — see
[[byte-convergence-plan-can-mandate-per-file-import-style-variant]] for the sibling pattern at the
auditor-finding level (per-file directive vs top-level Method prose).

**What happened:** the phase's numbered End-state list (1-6) spanned two `deps`-chained tasks —
task 1.1 and task 1.2, `deps:[1.1]` (End state 5). Task 1.1's own gate-audit ran while only task
1.1 had landed, so End state 5 was legitimately unmet on the pinned `audit_sha`. The auditor
correctly recorded a **Nit, `disposition: note`, `phaseClose: false`** finding ("End state 5 ... is
out-of-scope for this task-1.1 gate-audit — owned by task 1.2") rather than a hold. A later phase
saw the same rule fire cleanly at four seats at once, including the terminal, authoritative
integrated-tip seat and a phase-close polish re-audit.

**Why it matters:** in a multi-task phase with fine-grained `deps` edges (wave-ordered, not fully
serial), the natural per-task gate-audit will run before every End state in the phase's list is
satisfiable. An auditor (or the audit-log reader downstream) that doesn't map each End-state
condition to its owning task risks a false hold that blocks a task that already fully met its own
slice.

**RESOLVED (#1082, gate-evidence-and-release-integrity phase 1 task 1.2):** the rule no longer rests
on auditor judgment alone — the ownership exemption now names BOTH owners on both prompt surfaces, in
one commit: the `endStateBlock` const's case (3) in `skills/war/assets/workflow-template.js` (the
dispatched gate-audit prompt — it also interpolates the plan path so the seat can map conditions to
owning slices without guessing) and the `execution-evidence` gate-audit checklist's
**End-state ownership mapping** bullet in `agents/war-auditor.md` (the standing card). Both routes
still key on the same `out-of-scope` finding-title token, so the handoff `endState` status derivation
is unchanged. The incident above is what the carve-out encodes.

## Related

[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — Recurrence 19, the D3 check that
confirmed End state 5 was in fact satisfied by land time. [[within-phase-dep-gate-must-rerun-on-integrated-tip]]
— a different deps-chain gate concern (rerun on integrated tip), same family of "deps chain changes
what's checkable when." [[gate-artifact-never-includes-war-memory-lint]] and
[[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]] — sibling #1081/#1083 closures
landed in the same gate-evidence-and-release-integrity phase 1.

> archived 2026-07-27: resolved — moved to archive
