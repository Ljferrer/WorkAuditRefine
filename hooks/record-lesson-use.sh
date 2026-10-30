#!/usr/bin/env bash
# Record real lesson use (PreToolUse: Read, StructuredOutput). ADR 0055.
#
# A `hits` count says a query returned a lesson. This hook records use: a WAR
# worker or auditor seat opened a lesson file, or named it in the `lessonsUsed`
# field of its result. Each use is one kind:"use" row in the query log, so the
# log stays the one usage source and `tighten-plan` reads it.
#
# Workflow scripts cannot write files, so the hook is the writer. It sees the
# StructuredOutput payload before the engine does.
#
# Fail-open by design: this is telemetry, never a guard. Every path exits 0 and
# prints nothing, so it can never block a tool call. Main-session reads stay out,
# because a /lessons-learned pass reads every lesson and would count as use.
#
# The local root resolves in order: CLAUDE_MEMORY_LOCAL, the project dir of the
# checkout's main worktree (auto-memory keys on the repository), then the
# transcript's project dir. A task worktree's cwd alone would name the wrong dir.
#
# Constraints: macOS bash 3.2.57-compatible. Reads the payload via jq (already a
# hook dependency); no jq means no row.
set -u
LC_ALL=C   # the slug character class below must not follow locale collation

input="$(cat)"
command -v jq >/dev/null 2>&1 || exit 0
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true; }

agent="$(get '.agent_type')"
agent="${agent##*:}"
case "$agent" in
  war-worker|war-auditor|war-evidence-auditor) ;;
  *) exit 0 ;;
esac

tool="$(get '.tool_name')"
case "$tool" in
  Read)
    via="read"
    path="$(get '.tool_input.file_path')"
    case "$path" in
      */docs/learnings/*.md|*/projects/*/memory/*.md) ;;
      *) exit 0 ;;
    esac
    slugs="$(basename "$path" .md)"
    ;;
  StructuredOutput)
    via="result"
    slugs="$(printf '%s' "$input" | jq -r '.tool_input.lessonsUsed | if type == "array" then .[] else empty end | strings' 2>/dev/null || true)"
    ;;
  *) exit 0 ;;
esac

[ -n "$slugs" ] || exit 0

resolve_root() {
  if [ -n "${CLAUDE_MEMORY_LOCAL:-}" ]; then
    printf '%s' "$CLAUDE_MEMORY_LOCAL"
    return
  fi
  transcript="$(get '.transcript_path')"
  case "$transcript" in
    */projects/*/*) ;;
    *) return ;;
  esac
  project="$(printf '%s' "$transcript" | sed 's#^\(.*/projects/[^/]*\)/.*#\1#')"
  common="$(git -C "$(get '.cwd')" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
  if [ -n "$common" ]; then
    main="$(printf '%s' "${common%/.git}" | sed 's#[^A-Za-z0-9]#-#g')"
    if [ -d "${project%/*}/$main/memory" ]; then
      printf '%s' "${project%/*}/$main/memory"
      return
    fi
  fi
  printf '%s' "$project/memory"
}
root="$(resolve_root)"
[ -n "$root" ] && [ -d "$root" ] || exit 0

who="$(get '.agent_id')"
[ -n "$who" ] || who="$(get '.session_id')"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

printf '%s\n' "$slugs" | while IFS= read -r slug; do
  case "$slug" in
    ''|*[!a-z0-9-]*) continue ;;
  esac
  jq -nc --arg ts "$ts" --arg slug "$slug" --arg seat "$agent" --arg agent "$who" --arg via "$via" \
    '{ts: $ts, kind: "use", slug: $slug, seat: $seat, agent: $agent, via: $via}' \
    >> "$root/war-memory-queries.jsonl" 2>/dev/null || true
done
exit 0
