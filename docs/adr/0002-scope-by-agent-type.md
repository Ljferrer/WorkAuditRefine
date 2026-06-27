# Worker write-scope is enforced by `agent_type`, not a per-worktree env var

**Status:** accepted

The worktree-scope guard keys off the `agent_type` field in the PreToolUse hook payload, not the
`WAR_WORKTREE` environment variable. A runtime probe (2026-06-25, recorded in the worktree
provisioning design spec) proved the env-var mechanism is a NO-OP in the agent flow, and proved
that *exact* per-worktree confinement is unattainable in this harness — so we enforce a coarse
structural guard instead and explicitly drop exact confinement.

## Considered options

- **Per-worktree `WAR_WORKTREE` env var (status quo).** Rejected — proven ineffective:
  - The hook reads `WAR_WORKTREE` from its own process env; no `Agent`/`agent()` spawn-time env
    injection exists.
  - A worker's prose `export WAR_WORKTREE=…` dies with that Bash shell (`persist_check=UNSET` in
    the probe) and never reaches a later Write-hook process.
  - The only env a hook inherits is session-global — a single value that cannot differ across the
    parallel workers in a wave.

- **`agent_id` registry for exact confinement.** Rejected — infeasible:
  - `agent_id` is unique per subagent and present in the hook payload, but the worker **cannot read
    its own `agent_id`** (absent from its environment), so it cannot self-register
    `agent_id → worktree`.
  - The spawner only learns a worker's `agent_id` *after* the agent returns — too late to register
    before the worker's first write.

- **`agent_type` structural guard (chosen).** The hook reads `agent_type` (set by the spawner,
  always present for subagents) and confines writes by role: WAR workers → the WAR worktrees root;
  the servitor → the learnings target; auditors → no writes; refiner / main session → unrestricted.
  Enforced, with zero worker cooperation, zero registry, and no races.
  **Confinement layering:** the capability allowlist (no Bash for the servitor; read-only tools for
  the auditor) is the **primary confinement**. The `agent_type` hook and the `..`-traversal guard
  (which fires pre-`case`, covering ALL agent types) are **defense-in-depth** — they gate the
  residual Write/Edit paths that survive the allowlist check
  (`adr-policy-table-entry-vs-mechanism-attribution`, D4).

## Consequences

- The catastrophic case — a worker clobbering the main checkout or shared integration base — is
  blocked.
- **Accepted residual:** a worker could in principle write into a *sibling* worktree (both are
  `war-worker` writing under the worktrees root). Mitigated by absolute-path discipline in worker
  prompts and auditor diff review; not a hard guarantee.
- The guard depends on WAR's worktree **path convention** (so the hook can derive the worktrees
  root from the run's cwd) and on a small `agent_type → allowed-root` policy table.
- The hook is rewritten as part of the worktree-provisioning design; the old `WAR_WORKTREE` guard
  is retired.
