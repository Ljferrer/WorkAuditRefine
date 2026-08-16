---
name: gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream
description: "RESOLVED (#1082): a downstream deps-task's End-state condition is non-holding for an upstream task's gate-audit — now carved out on both prompt surfaces"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-22-cli-main-guard-normalization@phase-1
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

**What happened (code-verified — confirmed at the true landed tip via the `_refinery8` task
worktree, `.claude/war/wt/2026-07-22-cli-main-guard-normalization-2026-07-23/_refinery/`, see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] Recurrence 19):** the phase's
numbered End-state list (1-6) spans two `deps`-chained tasks — task 1.1 (the three guard-file
fixes) and task 1.2, `deps:[1.1]` (the origin-lesson RESOLVED note, End state 5). Task 1.1's own
gate-audit ran while only task 1.1 had landed, and End state 5 was — at that moment — legitimately
unmet on the pinned `audit_sha`, since it's task 1.2's deliverable. The auditor correctly recorded
this as a **Nit, `disposition: note`, `phaseClose: false`** finding ("End state 5 ... is
out-of-scope for this task-1.1 gate-audit — owned by task 1.2") rather than a hold, and separately
noted it was in fact already satisfied at the observed tip (a benign-advance intervening commit)
purely as a bonus confirmation — not a requirement of the disposition.

**The rule:** when a plan's End-state list is shared across multiple `deps`-chained tasks in one
phase, a gate-audit scoped to an earlier task in that chain must check **which task's plan slice
owns each numbered condition** before treating any of them as a blocking miss. A condition whose
`plan_ref`/slice text names a *different*, not-yet-landed task as the owner is non-holding for the
current task's audit — record it as an informational note, never a Critical/Major/hold. This is the
gate-audit-specific instance of the broader "verify the specific owning slice before flagging"
discipline — see [[byte-convergence-plan-can-mandate-per-file-import-style-variant]] for the
sibling pattern at the auditor-finding level (per-file directive vs top-level Method prose).

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

**Verified still present (this phase, 2026-07-26):** `skills/war/assets/workflow-template.js`
`endStateBlock` case (3) literal text — "a condition owned by a LATER phase — or by a deps-chained
sibling task of THIS phase not yet landed at your audit's scope ... is out-of-scope for THIS audit,
NEVER a hold" — and `agents/war-auditor.md`'s "**End-state ownership mapping:**" bullet both exist at
the landed tip (dev/2026-07-24-gate-evidence-and-release-integrity, `c663340`). Note the observed
real-world shape widened what "deps-chained" covers in practice: phase 1 of that same plan ran tasks
1.1-1.4 in **one wave with no `deps` edges between them at all** — each task's own gate-audit still
ran pinned at its own `audit_sha`, before sibling tasks in the *same wave* had landed, so the
exemption fires for plain parallel siblings too, not only for a task carrying an explicit `deps:`
edge on the owner. Read "deps-chained sibling" as "any sibling task in this phase, dep-edge or not,
not yet landed at this audit's pinned sha."

## Recurrence 20 (2026-08-15, plan `2026-08-06-gate-audit-finding-routing`, phase 1) — four independent audit seats, one unmerged sibling, same rule applied cleanly

Twelfth-plus occurrence, and the first time this exact rule fired **four separate times in one
phase** across four *different seat shapes*, not just four different tasks: task 1.1's own
gate-audit, task 1.2's own gate-audit, the terminal `phase-1-integrated-tip` gate-audit
(`authoritative: true`), and the `p1-polish` phase-close-sweep re-audit. Task 1.4
(`CONTEXT.md` glossary rows, End state 9) rebased and committed its two commits
(`4ab4aac`/`cb41907`) on a sibling branch `war/2026-08-06-gate-audit-finding-routing/p1-1.4` but
never merged into the phase's integration branch before every other task landed — every one of
the four seats independently ran the plan's `check:` grep for End state 9, observed `exit_code: 1`
(or the CONTEXT.md tokens absent), traced ownership via `git log --name-only`/`git log -S` back to
Task 1.4's plan slice, and scored it a Nit/Minor `disposition: note`, never a hold — exactly the
rule this lesson encodes, including the terminal `phase-1-integrated-tip` seat, which explicitly
attested the condition `status: "unmet"` (not `"met"`) while still keeping the overall verdict
`gate-audit:approve`/`hard: false`.

**Confirms, with a new edge:** the rule holds even at the **terminal, authoritative** integrated-tip
seat — the one seat whose attestations feed the phase's `handoff` block directly — and even inside
a **phase-close polish** re-audit (a seat type this lesson's prior recurrences never exercised).
`code-verified` at the landed tip `20816fd0412788ba11412356f5471f6b1447d682`
(gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-gate-audit-finding-routing-2026-08-15/_refinery/`):
`git log -Ssweep-raised -- CONTEXT.md` over history reachable from the landed tip returns no
commit — the two glossary rows genuinely never landed in this phase's range, matching every seat's
independent finding.

## Related

[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — Recurrence 19, the D3 check that
confirmed End state 5 was in fact satisfied by land time. [[within-phase-dep-gate-must-rerun-on-integrated-tip]]
— a different deps-chain gate concern (rerun on integrated tip), same family of "deps chain changes
what's checkable when." [[gate-artifact-never-includes-war-memory-lint]] and
[[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]] — sibling #1081/#1083 closures
landed in the same gate-evidence-and-release-integrity phase 1.

> archived 2026-07-27: resolved — moved to archive
