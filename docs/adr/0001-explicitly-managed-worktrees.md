# Explicitly-managed worktrees, not harness `isolation: 'worktree'`

**Status:** accepted

WAR provisions each task's worktree with explicit, scripted `git worktree add/remove` owned by
the refiner — it does **not** use the harness's built-in `isolation: 'worktree'` option on the
`Agent` tool / Workflow `agent()`. A future reader will reasonably ask "why hand-roll worktrees
when the harness offers one for free?" — this records why.

## Considered options

- **Harness `isolation: 'worktree'`** — the harness cuts a fresh worktree per agent and
  auto-removes it if unchanged. Rejected for the **worker path** because it fails four hard WAR
  requirements:
  1. **Base control** — WAR worktrees must be cut from a specific base (the `integration/phase-N`
     tip). The harness primitive forks current HEAD with no base option.
  2. **Stable named branch** — the refiner later merges `task.branch` by name; the harness branch
     is not a guaranteed, stable, named branch.
  3. **Reuse for fixes** — a kicked-back task's fix-worker must work *in the same worktree*. Each
     `agent()` call gets a fresh worktree, breaking fix-in-place.
  4. **Lifecycle** — WAR keeps a worktree until the task lands and preserves it on escalation for
     inspection. "auto-removed if unchanged" is the opposite lifecycle.

- **Explicitly-managed worktrees (chosen)** — the refiner owns a deterministic, scripted lifecycle
  (cut integration branch → `git worktree add` on the correct base with a named branch → reuse for
  fixes → remove on land / preserve on escalation), satisfying all four requirements.

## Consequences

- WAR owns worktree creation/teardown and must make it idempotent, concurrency-safe, and tested.
- The carve-out: harness `isolation: 'worktree'` remains the right tool where a fresh,
  base-agnostic, auto-cleaned worktree is exactly what's wanted — the **red-team throwaway
  sandboxes** and the **servitor**. Those keep using harness isolation; only the WAR worker path
  is explicitly managed.
