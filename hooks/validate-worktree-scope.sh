#!/usr/bin/env bash
# WAR worktree-scope guard (PreToolUse: Write|Edit|NotebookEdit).
# NO-OP unless WAR_WORKTREE is set, so it is safe to ship globally — it only
# constrains agents a WAR run has explicitly scoped to a worktree.
set -euo pipefail
[ -z "${WAR_WORKTREE:-}" ] && exit 0
input="$(cat)"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // empty' 2>/dev/null || true)"
[ -z "$path" ] && exit 0
case "$path" in
  "$WAR_WORKTREE"|"$WAR_WORKTREE"/*) exit 0 ;;
  *)
    echo "WAR: refusing write to '$path' — outside your assigned worktree '$WAR_WORKTREE'. Stay inside your worktree." >&2
    exit 2 ;;
esac
