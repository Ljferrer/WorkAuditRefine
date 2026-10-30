#!/usr/bin/env bash
# Tests for hooks/record-lesson-use.sh. bash-3.2-safe and cwd-independent.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/record-lesson-use.sh"
fails=0
n=0
ok() { n=$((n + 1)); if [ "$2" = "$3" ]; then echo "ok $n - $1"; else echo "not ok $n - $1 (want '$3', got '$2')"; fails=$((fails + 1)); fi; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PROJECT="$TMP/.claude/projects/-repo"
ROOT="$PROJECT/memory"
LOG="$ROOT/war-memory-queries.jsonl"
mkdir -p "$ROOT"
SUB="$PROJECT/session/subagents/agent-1.jsonl"

run() { printf '%s' "$1" | env -u CLAUDE_MEMORY_LOCAL bash "$HOOK"; echo $?; }
payload() { jq -nc --arg a "$1" --arg t "$2" --arg tp "$3" --argjson i "$4" \
  '{agent_type: $a, agent_id: "ag1", tool_name: $t, transcript_path: $tp, tool_input: $i}'; }
rows() { [ -f "$LOG" ] && wc -l < "$LOG" | tr -d ' ' || echo 0; }

ok 'a worker Read of a repo lesson exits 0 silently' "$(run "$(payload work-audit-refine:war-worker Read "$SUB" '{"file_path":"/x/wt/docs/learnings/some-lesson.md"}')")" 0
ok 'that Read writes one row' "$(rows)" 1
ok 'the row is kind use' "$(jq -r .kind "$LOG")" use
ok 'the row names the slug' "$(jq -r .slug "$LOG")" some-lesson
ok 'the row names the bare seat' "$(jq -r .seat "$LOG")" war-worker
ok 'the row names the agent' "$(jq -r .agent "$LOG")" ag1
ok 'the row names the route' "$(jq -r .via "$LOG")" read

run "$(payload war-auditor Read "$SUB" '{"file_path":"/h/.claude/projects/-repo/memory/archive/cold-one.md"}')" >/dev/null
ok 'an archived local lesson counts' "$(tail -1 "$LOG" | jq -r .slug)" cold-one

run "$(payload war-auditor StructuredOutput "$SUB" '{"lessonsUsed":["alpha-one","beta-two"]}')" >/dev/null
ok 'lessonsUsed writes one row each' "$(rows)" 4
ok 'lessonsUsed rows say result' "$(tail -1 "$LOG" | jq -r .via)" result

before="$(rows)"
run "$(payload general-purpose Read "$SUB" '{"file_path":"/x/docs/learnings/noise.md"}')" >/dev/null
ok 'a housekeeping agent adds no row' "$(rows)" "$before"
run "$(payload '' Read "$SUB" '{"file_path":"/x/docs/learnings/noise.md"}')" >/dev/null
ok 'the main session adds no row' "$(rows)" "$before"
run "$(payload war-worker Read "$SUB" '{"file_path":"/x/src/app.md"}')" >/dev/null
ok 'a non-lesson file adds no row' "$(rows)" "$before"
run "$(payload war-worker Read "$SUB" '{"file_path":"/x/docs/learnings/README.md"}')" >/dev/null
ok 'README adds no row' "$(rows)" "$before"
run "$(payload war-worker StructuredOutput "$SUB" '{"status":"implemented"}')" >/dev/null
ok 'a result with no lessonsUsed adds no row' "$(rows)" "$before"
run "$(payload war-worker StructuredOutput "$SUB" '{"lessonsUsed":"not-an-array"}')" >/dev/null
ok 'a non-array field adds no row' "$(rows)" "$before"
run "$(payload war-worker StructuredOutput "$SUB" '{"lessonsUsed":["../evil","has space",7]}')" >/dev/null
ok 'a bad slug adds no row' "$(rows)" "$before"

ok 'a missing memory root still exits 0' "$(run "$(payload war-worker Read "$TMP/none/projects/x/s.jsonl" '{"file_path":"/x/docs/learnings/a.md"}')")" 0
ok 'an empty payload still exits 0' "$(run '')" 0
ok 'invalid JSON still exits 0' "$(run 'not json')" 0
ok 'the hook prints nothing' "$(printf '%s' "$(payload war-worker Read "$SUB" '{"file_path":"/x/docs/learnings/quiet.md"}')" | env -u CLAUDE_MEMORY_LOCAL bash "$HOOK" | wc -c | tr -d ' ')" 0

# Root resolution.
REAL="$(cd "$TMP" && pwd -P)"
ENVROOT="$REAL/custom-root"
mkdir -p "$ENVROOT"
printf '%s' "$(payload war-worker Read "$SUB" '{"file_path":"/x/docs/learnings/env-root.md"}')" | CLAUDE_MEMORY_LOCAL="$ENVROOT" bash "$HOOK"
ok 'CLAUDE_MEMORY_LOCAL wins' "$(jq -r .slug "$ENVROOT/war-memory-queries.jsonl")" env-root

MAIN="$REAL/main-repo"
WT="$REAL/task-wt"
git init -q "$MAIN"
git -C "$MAIN" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
git -C "$MAIN" worktree add -q "$WT" -b task
PROJS="$REAL/.claude/projects"
MAINSLUG="$(printf '%s' "$MAIN" | sed 's#[^A-Za-z0-9]#-#g')"
WTSLUG="$(printf '%s' "$WT" | sed 's#[^A-Za-z0-9]#-#g')"
mkdir -p "$PROJS/$MAINSLUG/memory" "$PROJS/$WTSLUG"
jq -nc --arg tp "$PROJS/$WTSLUG/s.jsonl" --arg cwd "$WT" \
  '{agent_type: "war-worker", agent_id: "ag2", tool_name: "Read", transcript_path: $tp, cwd: $cwd, tool_input: {file_path: "/x/docs/learnings/wt-lesson.md"}}' | env -u CLAUDE_MEMORY_LOCAL bash "$HOOK"
ok 'a worktree-launched session logs to the main checkout root' "$(jq -r .slug "$PROJS/$MAINSLUG/memory/war-memory-queries.jsonl" 2>/dev/null)" wt-lesson

# Registration: a lost entry or exec bit stops rows with no error.
HOOKS="$HERE/hooks.json"
ok 'the hook file is executable' "$([ -x "$HOOK" ] && echo yes)" yes
for matcher in StructuredOutput Read; do
  count="$(jq --arg m "$matcher" '[.hooks.PreToolUse[] | select(.matcher == $m) | .hooks[] | select(.command | endswith("/hooks/record-lesson-use.sh"))] | length' "$HOOKS")"
  ok "PreToolUse registers the hook under $matcher" "$count" 1
done
ok 'the Read entry carries no if filter' "$(jq '[.hooks.PreToolUse[] | select(.matcher == "Read") | .hooks[] | select(has("if"))] | length' "$HOOKS")" 0

echo "$n tests, $fails failed"
[ "$fails" -eq 0 ]
