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
#   - war-servitor : allow only the CURRENT user's local project memory dir;
#                    deny anything else. The repo-root (docs/learnings) allowance
#                    is SUBTRACTED (#58 resolution): under the Gate-2 promotion
#                    model the servitor has no legitimate repo-root write left —
#                    the Lead copies+lints selected lessons into docs/learnings
#                    from a transient publication worktree. The local memory glob
#                    is now anchored to `$HOME` (#810): only a path under
#                    `$HOME/.claude/projects/<project>/memory/` is allowed, with
#                    the pre-#810 unanchored shape glob retained solely as the
#                    `HOME`-unset/empty fallback (fail toward the ratified
#                    residual, never deny-all). Per-run PROJECT-SLUG anchoring is
#                    still out of reach — a hook process cannot receive per-run
#                    values — so a cross-project write under the user's OWN
#                    `$HOME` stays allowed; that residual is re-ratified, bounded
#                    by the servitor's no-Bash allowlist and the provenance
#                    hook's existing-target mutation guard.
#   - everything else (war-refiner, the main session with no agent_type, and
#                    any non-WAR agent) : fail-open / unrestricted, so no
#                    existing non-WAR flow is newly constrained (back-compat).
#
# A write with no file_path (e.g. a tool_input without a path) is always
# allowed. Note: the servitor no longer holds Bash (capability allowlist:
# Read, Grep, Glob, Write, Edit only — F01 D1), so Bash can only slip through
# this hook for the worker or refiner, not the servitor.
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
# A path like /x/.claude/projects/p/memory/../../etc/foo matches the servitor's
# memory glob yet escapes the intended directory. The worker's .war-task ancestor
# walk is equally bypassable. Rejecting '..' early closes the traversal hole in
# BOTH branches. (#58 RESOLVED: the servitor's repo-root allowance is subtracted
# — see the servitor bullet above. #810: the local memory glob is now anchored to
# `$HOME`, with the unanchored shape glob retained only as the `HOME`-unset/empty
# fallback; per-run PROJECT-SLUG anchoring remains out of reach because a hook
# cannot receive per-run values, so a cross-project write under the user's own
# `$HOME` stays allowed by design.)
# Portable case-pattern covering the FULL '..' traversal equivalence class
# (four shapes, works on macOS bash 3.2.57):
#   '..'      bare (the whole path is a single .. segment)
#   '../*'    leading  (a .. segment at the very start, no preceding '/')
#   '*/../*'  middle   (a .. segment between two path components)
#   '*/..'    trailing (a .. segment at the very end)
# The leading and bare shapes were previously missed (dotdot-pattern-misses-
# leading-relative-traversal): '../etc/foo' and a bare '..' both escaped the
# old '*/../*|*/..' pair because neither has a '/' before the '..'.
#
# INTENTIONALLY pre-`case "$atype"`: this guard applies to ALL agent types,
# including war-refiner and the main session (no agent_type). Ratified ADR 0002
# D5 (dotdot-guard-applies-to-all-agent-types). The per-agent case below is
# therefore never reached with a ..-bearing path, regardless of role.
case "$path" in
  ..|../*|*/../*|*/..)
    deny "path '$path' contains a '..' traversal segment; use an absolute canonical path instead."
    ;;
esac

case "$atype" in
  *war-auditor)
    [ -n "$path" ] && deny "auditors are read-only; refusing write to '$path'."
    exit 0
    ;;
  *war-worker)
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
  *war-servitor)
    [ -z "$path" ] && exit 0
    # $HOME anchor (#810): confine the write to the CURRENT user's local memory
    # root, not merely any path of the right SHAPE. ${HOME:-} is mandatory — a
    # bare $HOME under `set -u` with HOME unset would kill the hook before the
    # fallback below; ${home%/} strips a trailing slash so the anchored pattern
    # never forms a `//` that matches nothing and bricks every wrap-up write.
    home="${HOME:-}"; home="${home%/}"
    if [ -n "$home" ]; then
      case "$path" in
        "$home"/.claude/projects/*/memory/*) exit 0 ;;
      esac
    else
      # HOME unset/empty: fall back to the pre-#810 unanchored shape glob (fail
      # toward the ratified cross-project residual, never toward deny-all). This
      # branch is one of exactly two sanctioned survivors of the unanchored
      # memory-glob sweep (the other is validate-servitor-provenance.sh's
      # content-gate classifier, deliberately left unanchored for fail-safe).
      case "$path" in
        */.claude/projects/*/memory/*) exit 0 ;;
      esac
    fi
    deny "servitor write to '$path' is outside the local memory root: expected a path under \$HOME/.claude/projects/<project>/memory/ (\$HOME='$home'); when \$HOME is unset or empty the hook falls back to any .claude/projects/<project>/memory/ path shape."
    ;;
  *)
    # war-refiner, the main session (no agent_type), and any non-WAR agent.
    exit 0
    ;;
esac
