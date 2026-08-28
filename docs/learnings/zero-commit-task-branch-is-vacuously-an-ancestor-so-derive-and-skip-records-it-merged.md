---
name: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
description: "A recovery relaunch's derive-and-skip marks a NEVER-STARTED task (zero-commit branch at the phase base) as preMerged — the handoff reports it landed, the ledger records merged, and the phase lands without its deliverable"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
  phase: "2026-08-27-in-run-finding-resolution/phases 1-3 (landed dev/2026-08-27-in-run-finding-resolution, tip ec0b920); engine bug #1895"
  keywords:
    - derive-and-skip
    - preMerged
    - recovery relaunch
    - zero-commit branch
    - merge-base --is-ancestor
    - vacuous ancestor
    - phantom merged task
    - reconcile toward git
    - silent no-op release
---

`git merge-base --is-ancestor <task-branch> "$TIP"` is **vacuously true for a branch sitting at
the phase base with no commits**. A task that dep-failed (or never dispatched) in an earlier
attempt leaves exactly that branch, so a sanctioned recovery relaunch's derive-and-skip clause
reports it `preMerged`, the workflow's `landed[]` includes it, the ledger records `merged`, and
the Lead closes its issue — **while its deliverable does not exist anywhere in the window**.

Observed three times in ONE run (2026-08-27-in-run-finding-resolution, plugin 0.20.1):
phase-1 tasks 1.2/1.3 in relaunch `-r2`, and phase-2 task 2.1 (the release bump) in `-r3`.
The 2.1 case landed a phase claiming a release while
`git diff --stat <base> <tip> -- .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md CHANGELOG.md`
was **empty** — the CLAUDE.md-named silent-no-op release, in its degenerate zero-slot form.

**It also defeats a gate-audit.** Phase 1's gate-audit passed because every needle it checked
belonged to task 1.1, which really had landed; 1.2/1.3's End states had no owning artifact to
contradict. Detection in all three cases came only from the Lead's Checkpoint
**reconcile-toward-git** (ADR 0008) — the ledger claimed work git could not corroborate.

**Fix shape (filed, #1895):** derive-and-skip must additionally require
`git rev-list --count <base>..<branch>` > 0 before deriving `preMerged`; a zero-commit branch
takes the fresh-run path. Pair it with a phase-level assertion that every task the handoff
reports `landed` contributed at least one commit to the integration range.

**Operator-side rule until that lands:** before trusting any relaunch's `preMerged` set, diff the
window for each skipped task's `Files:` — and delete stale zero-commit branches before relaunching,
which removes the vacuous input entirely.
