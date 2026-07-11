---
name: servitor-verify-on-write-worktree-can-lag-just-landed-phase
description: "Servitor verify-on-write can run on a checkout behind the landed phase; absence is not proof"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: servitor-verify-on-write-worktree-can-lag-just-landed-phase
  phase: guard-floor-and-scope-hook-coverage-completeness/servitor-wrapup
  keywords: 
    - stale worktree
    - D3 verify-on-write
    - servitor cwd
    - landed phase
    - worktree lag
    - absence check
    - branch mismatch
    - phase wrap-up
    - checkout stale
  tags: 
    - servitor
    - memory-protocol
    - worktree
    - verification
    - process
  created: 2026-07-10
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A servitor's own worktree checkout can lag the phase it is wrapping up

**What happened (code-verified — directly confirmed by Read/Grep against this session's cwd,
`<repo-root>/.claude/worktrees/sad-sutherland-141916`):** while running D3
verify-on-write for phase "guard-floor-and-scope-hook-coverage-completeness" (landed on
`dev/2026-07-08-guard-floor-and-scope-hook-coverage-completeness`), every phase-1-introduced
referent was **absent** from this checkout:

- `hooks/guard-conventions.test.sh` (t1.2's new meta-guard file) does not exist here.
- `hooks/validate-worktree-scope.sh` line 61 still reads the OLD pattern `*/../*|*/..`, not the
  widened `..|../*|*/../*|*/..` t1.1 was supposed to land.
- `skills/war/assets/assert-test-in-diff.test.sh` exists but has no `Case 10` content (t1.6).
- `skills/war/assets/workflow-template.js` has no `assertReportedPathsInWorktree` (t1.8's path
  contract).
- `CONTEXT.md` has no "ADR 0031" text anywhere, and `docs/adr/0031-*.md` does not exist (glob of
  `docs/adr/*.md` tops out at `0025-drift-guard-discipline.md`).

**Root cause (inferred, not independently confirmed):** the servitor's Read/Grep tools operate on
whatever is physically checked out at the threaded cwd, which is a session worktree — not
necessarily fast-forwarded to the phase's just-merged branch tip. A worktree base is frozen at
provision time (ADR 0001); nothing in the servitor's own toolset re-syncs it after land.

**The rule:** when D3 verify-on-write reports a referent absent, do **not** immediately conclude
"the landed tree lacks this" or "the fix wasn't actually applied." First weigh whether the local
checkout could simply be behind the branch the phase actually landed on. Concretely:
- Tag the fact `agent-unverified` with an absence-note that names *this* limitation ("referent not
  found in servitor's cwd @ phase X — cwd may lag the landed branch, verify against
  `dev/<branch>` before acting"), rather than asserting a negative finding about the landed code.
- Never write a memory fact claiming a plan/code mismatch ("the fix didn't land") purely from a
  local-checkout absence — that requires reading the actual landed branch/commit, which the
  servitor's Read tool cannot target directly (no Bash, no `git checkout`).

**Why it matters:** this is the single highest-leverage check before writing any phase-close
memory that names a specific new symbol/pattern/file from the phase just landed — getting it wrong
produces a confidently-wrong `code-verified`-tagged lesson that will mislead a future agent
searching for that referent.

## Related

[[audit-worktree-pre-impl-tip-stale-verdict]] — the auditor-side analogue (audit worktree HEAD can
be stale relative to `audit_sha`). [[land-local-follower-ref-can-lag-sync-before-next-phase]] —
same staleness family at the ref-sync layer. [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]
— another worktree/branch-state trap in the same pipeline stage.
