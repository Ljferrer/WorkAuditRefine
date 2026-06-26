#!/usr/bin/env bash
# WAR worktree-scope guard (PreToolUse: Write|Edit|NotebookEdit).
#
# Enforced by `agent_type` from the hook payload (see ADR 0002), not by an env
# var: a worker's `export` of a per-worktree path does not survive into its own
# next Bash call (probe E1), so the old env-var guard was a proven NO-OP. This
# guard reads `agent_type` (set per-subagent in the PreToolUse payload) and:
#   - war-auditor  : hard-deny every write (auditors are read-only).
#   - war-worker   : allow only when some ancestor dir holds a `.war-task`
#                    marker (i.e. the write lands in *a* provisioned worktree).
#                    RATIFIED DEVIATION (ADR 0002): this confines a worker to
#                    *a* worktree, not *their own* — exact per-worktree
#                    confinement was proven unattainable (E1). The sibling-write
#                    residual is accepted, mitigated by absolute-path prompts +
#                    auditor review.
#   - war-servitor : allow only learnings targets (a project memory dir or
#                    docs/learnings); deny anything else.
#   - everything else (war-refiner, the main session with no agent_type, and
#                    any non-WAR agent) : fail-open / unrestricted, so no
#                    existing non-WAR flow is newly constrained (back-compat).
#
# A write with no file_path (e.g. a Bash tool that slipped through the matcher,
# or a tool_input without a path) is always allowed.
#
# Constraints: must run on macOS bash 3.2.57 — no globstar, no associative
# arrays, no ${,,}. Reads the payload via jq (already a hook dependency).
set -euo pipefail

input="$(cat)"
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true; }
atype="$(get '.agent_type')"
path="$(get '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path')"
deny() { echo "WAR: $1" >&2; exit 2; }

# Reject any path that contains a '..' segment before per-agent checks.
# A path like /x/docs/learnings/../../etc/foo matches the servitor's bare glob
# yet escapes the intended directory. The worker's .war-task ancestor walk is
# equally bypassable. Rejecting '..' early closes the traversal hole in BOTH
# branches. (Full memory-root anchoring is deferred — see plan notes / #58.)
# Portable case-pattern: '/../*' covers a .. segment in the middle; '/..'
# covers a trailing .. segment. Works on macOS bash 3.2.57.
case "$path" in
  */../*|*/..)
    deny "path '$path' contains a '..' traversal segment; use an absolute canonical path instead."
    ;;
esac

case "$atype" in
  *war-auditor*)
    [ -n "$path" ] && deny "auditors are read-only; refusing write to '$path'."
    exit 0
    ;;
  *war-worker*)
    [ -z "$path" ] && exit 0
    d="$(dirname "$path")"
    # Walk ancestors until a .war-task marker is found, or until dirname stops
    # making progress. The progress guard (prev) is essential: for a relative
    # path `dirname` converges to "." (and `dirname .` == "."), which never
    # equals "/" — without it this loop would spin forever and hang the hook.
    prev=""
    while [ -n "$d" ] && [ "$d" != "$prev" ]; do
      [ -e "$d/.war-task" ] && exit 0
      [ "$d" = "/" ] && break
      prev="$d"
      d="$(dirname "$d")"
    done
    deny "write to '$path' is outside any provisioned worktree (no .war-task marker). Stay in your worktree."
    ;;
  *war-servitor*)
    [ -z "$path" ] && exit 0
    case "$path" in
      */.claude/projects/*/memory/*|*/docs/learnings/*) exit 0 ;;
      *) deny "servitor write to '$path' is outside the learnings target (expected */.claude/projects/*/memory/* or */docs/learnings/*)." ;;
    esac
    ;;
  *)
    # war-refiner, the main session (no agent_type), and any non-WAR agent.
    exit 0
    ;;
esac
