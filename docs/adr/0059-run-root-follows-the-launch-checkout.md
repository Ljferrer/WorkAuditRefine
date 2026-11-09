# The run root follows the launch checkout

**Status:** accepted (2026-11-08; plan 2026-11-08-auditor-and-worker-guard-habits, PIN-12; issues
#2351, #2581, #2582, #2583)

## Context

A `/war` run keeps its worktrees, staged phase scripts, args files and manifest under `.claude/war/`.
Until now that folder sat under the main checkout (`$MAIN`, from `git rev-parse --git-common-dir`)
for every launch. A Lead in a desktop-app worktree session runs in a linked worktree. The host guard
there refuses an Edit or Write outside the session's own worktree, and subagents inherit it. A run
anchored at `$MAIN` put every task worktree and staged script outside the session tree, so workers
hit host denials and the Lead had to copy each staged script into the session cwd before dispatch.

## Decision

**The run root is the checkout whose `.claude/war/` holds a run's worktrees, staged scripts, args
files and manifest.** A launch from a linked worktree (`git rev-parse --git-dir` differs from
`--git-common-dir`) uses the launch checkout's top level. A launch from the main checkout uses
`$MAIN`, as before.

- `worktreeRoot` is `<run root>/.claude/war/worktrees`.
- The manifest is `<run root>/.claude/war/runs/<runId>.json`, and the staged scripts and args files
  live in `<run root>/.claude/war/runs/<runId>/`.
- `/war-review`, resume and relaunch read the launch checkout first, then `$MAIN`.
- `stage-workflow.mjs` does not change: it takes the folder as an argument.
- The audit-tamper record, the REA evidence bundles (ADR 0053) and all campaign and survey state stay
  at `$MAIN` on purpose.

`skills/war/references/setup.md` § Run root is the one canonical statement of the rule. Every other
surface points at it and restates nothing.

**This ADR supersedes ADR 0037 decision 4's `$MAIN/.claude/war/runs/<runId>/` location for a
linked-worktree launch.** The staged copy follows the run root. A main-checkout launch keeps the
decision 4 location unchanged.

## Consequences

- Worker, refiner and stager writes stay inside the session tree in a desktop worktree session, so no
  staged-script copy is needed.
- A run started in a session worktree is not found by a reader that looks only at `$MAIN`. Every
  reader therefore looks under the launch checkout first.
- The host guard can still refuse a git command aimed at a worktree other than the session's own.
  The first linked-worktree launch after land checks for that. If it happens, the fallback is to
  launch from the main checkout.
