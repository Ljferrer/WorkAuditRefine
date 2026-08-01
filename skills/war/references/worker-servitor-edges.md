# Worker + servitor edges — submodule/gitlink-bump task mechanics, servitor confinement rationale, archived lessons

Verbatim evictions from `agents/war-worker.md` and `agents/war-servitor.md` (prompt-surface
simplification, Task 5.1; each moved block is byte-identical to its pre-eviction card text).
Positional words inside the moved blocks ("below", "above") refer to their original card
positions. Relative link paths inside the moved blocks are likewise written relative to
`agents/` — read `../docs/…` as `../../../docs/…` from here. The dispatched worker prompt in `skills/war/assets/workflow-template.js`
threads the runtime submodule/gitlink-bump context (`TARGET REPO` / `GITLINK-BUMP` clauses) at the
dispatch site — this file is the standing step-by-step those clauses assume.

## Submodule task mechanics

Trigger: the sub-issue carries a `target repo` tag identifying a submodule (a **declared submodule task**).

For a **declared submodule task** the worktree is a standalone checkout of the submodule (provisioned by the refiner from the initialized submodule dir). Work entirely inside it:

1. **Verify the worktree root is the submodule repo** — `git remote -v` should show the submodule's own remote, not the superproject's.
2. **Implement** inside the submodule worktree exactly as for a normal task (the worktree is already on the task branch, integration branch already exists in the submodule repo).
3. **Write the mapped tests in the submodule repo** — tests live alongside the submodule's own source, run under the submodule's own gate. Use the gate command from the spawn prompt (it was derived from the submodule's own signals).
4. **Run the gate to green** inside the submodule worktree.
5. **Commit** with a message referencing the sub-issue (`#<n>`), then `git push` the submodule branch.
6. Return `WorkerResult` as normal — `worktree` is the submodule worktree path, `branch` is the submodule task branch.

The superproject's gitlink is **not touched** by the submodule task worker — that is the gitlink-bump task's sole responsibility.

## Gitlink-bump task mechanics

Trigger: the sub-issue carries a `target repo` tag and the task's sole purpose is advancing a gitlink (a **declared gitlink-bump task**).

For a **declared gitlink-bump task** the task's entire diff is advancing a submodule gitlink to the SHA produced by a depended-on submodule task. The SHA is authoritative only when read from the **ledger** — never from an in-memory map or a local branch tip.

1. **Resolve the dep submodule task's landed SHA from the ledger** — open `.claude/teams/<run-id>/ledger.json`, find the dep task's entry, read its `merge_sha`. This is the authoritative cross-phase source. If `merge_sha` is absent or the dep task is not yet `merged`, return `status: "blocked"` with `blocked_reason` naming the missing dep.
2. **Stage the gitlink** — `git -C <superproject-worktree> add <submodule-path>` after ensuring the submodule is checked out at that SHA (`git -C <superproject-worktree>/<submodule-path> checkout <sha>`), or equivalently update the gitlink directly. The diff must be gitlink-only (no file content changes in the submodule path).
3. **Commit** in the superproject worktree — this is a **worker/contents commit** (the bump is a real task output, preserving the Container/Contents distinction). Message referencing the sub-issue (`#<n>`).
4. **Push** the superproject task branch.
5. Return `WorkerResult` — `files_changed` includes the submodule path (the gitlink entry), `notes` records the SHA advanced to.

## Servitor confinement

Trigger: you need the rationale for the servitor's write confinement — e.g. a scope-hook denial cites it, or you are reasoning about why the memory phase cannot touch your branches.

The WAR servitor runs after each phase lands with a restricted capability allowlist (Read, Grep, Glob, Write, Edit — no Bash). This allowlist is the **primary confinement**: without Bash the servitor cannot touch branches, issues, or arbitrary paths. The `agent_type` PreToolUse hook and the `..`-traversal guard are **defense-in-depth** layered on top — they catch any residual Write/Edit attempt that escapes the allowlist check (e.g. a path that pattern-matches the learnings target but contains a `..` traversal). See [ADR 0002](../docs/adr/0002-scope-by-agent-type.md).

## Archived lessons (servitor)

Trigger: D1 dedup lands you on a lesson under the memory store's `archive/` root.

The memory store keeps a hot root and an `archive/` root; archived lessons are cold, not deleted. You **may edit an archived lesson in place** (e.g. correct a stale referent under D3, top up `keywords`) when D1 dedup lands you on one. You must **never move a lesson between hot and `archive/`** — temperature transitions (archive / restore) are `war-memory`'s job, not yours. Knowledge is archived, never deleted.
