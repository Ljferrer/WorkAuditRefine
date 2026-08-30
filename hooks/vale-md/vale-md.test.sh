#!/usr/bin/env bash
# vale-md.py — the advisory Vale Markdown lint hook (PostToolUse, Edit|Write, .md only).
# Cases: default on emits one additionalContext line (via a stub vale, so the test never
# needs the real binary), explicit false is silent, null is unset (on), non-.md paths and
# a missing vale binary are silent, malformed stdin/config fail open, zero findings are
# silent, and every path exits 0. bash-3.2-safe, cwd-independent; runs against a temp
# copy so the repo tree stays clean.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"

command -v python3 >/dev/null 2>&1 || { echo 'SKIP vale-md.test.sh (no python3 — vale-md.sh no-ops the hook)'; exit 0; }

fails=0
n=0
pass() { n=$((n + 1)); printf 'ok %d - %s\n' "$n" "$1"; }
fail() { n=$((n + 1)); fails=$((fails + 1)); printf 'FAIL %d - %s\n' "$n" "$1"; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp "$HERE/vale-md.sh" "$HERE/vale-md.py" "$HERE/.vale.ini" "$HERE/.vale-google.ini" "$TMP/"
mkdir -p "$TMP/styles"
cp -R "$HERE/styles/ReplyStandard" "$HERE/styles/Google" "$TMP/styles/"
PROJ="$TMP/proj"
mkdir -p "$PROJ/.claude/war"
export CLAUDE_PROJECT_DIR="$PROJ"

# Stub vale: records its argv, emits two findings (or none with STUB_EMPTY=1).
mkdir -p "$TMP/bin"
cat > "$TMP/bin/vale" <<'STUB'
#!/bin/sh
printf '%s\n' "$@" > "${STUB_ARGS:-/dev/null}"
if [ "${STUB_EMPTY:-}" = "1" ]; then
  printf '{}'
else
  printf '{"doc.md":[{"Check":"ReplyStandard.SentenceLength","Severity":"warning","Line":1,"Message":"long"},{"Check":"ReplyStandard.SlopWords","Severity":"warning","Line":2,"Message":"slop"}]}'
fi
STUB
chmod +x "$TMP/bin/vale"
export STUB_ARGS="$TMP/stub-args"

DOC="$TMP/doc.md"
printf '# t\n\nSome prose.\n' > "$DOC"

run_hook() { printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$1" | PATH="$TMP/bin:$PATH" sh "$TMP/vale-md.sh"; }

# Case 1: no config — default on; stub findings become one additionalContext line, exit 0.
rm -f "$PROJ/.claude/war/config.json" "$STUB_ARGS"
out="$(run_hook "$DOC")"; rc=$?
case "$out" in
  *additionalContext*"2 prose finding(s)"*) pass 'case1 default on: emits advisory context' ;;
  *) fail "case1 default on: emits advisory context (out=$out)" ;;
esac
[ "$rc" -eq 0 ] && pass 'case1 exit 0' || fail "case1 exit 0 (rc=$rc)"
if grep -Fq '.vale-google.ini' "$STUB_ARGS" 2>/dev/null; then pass 'case1 vale invoked with the default google profile'; else fail 'case1 vale invoked with the default google profile'; fi

# Case 2: hooks.valeMarkdown false — gated off, silent, vale never invoked, exit 0.
printf '{"hooks":{"valeMarkdown":false}}' > "$PROJ/.claude/war/config.json"
rm -f "$STUB_ARGS"
out="$(run_hook "$DOC")"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ] && [ ! -e "$STUB_ARGS" ]; then pass 'case2 false: silent, vale not run'; else fail "case2 false: silent, vale not run (rc=$rc out=$out)"; fi

# Case 3: hooks.valeMarkdown null — unset means on (the overrides.* convention).
printf '{"hooks":{"valeMarkdown":null}}' > "$PROJ/.claude/war/config.json"
out="$(run_hook "$DOC")"
case "$out" in *additionalContext*) pass 'case3 null: unset means on' ;; *) fail 'case3 null: unset means on' ;; esac

# Case 4: non-.md path — silent, vale never invoked.
rm -f "$PROJ/.claude/war/config.json" "$STUB_ARGS"
printf 'x = 1\n' > "$TMP/code.py"
out="$(run_hook "$TMP/code.py")"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ] && [ ! -e "$STUB_ARGS" ]; then pass 'case4 non-md: silent'; else fail "case4 non-md: silent (rc=$rc out=$out)"; fi

# Case 5: no vale on PATH — silent no-op, exit 0. python3's own directory stays on PATH so
# the case proves the shutil.which("vale") branch, not the shim's python3 guard.
PY_DIR="$(dirname "$(command -v python3)")"
out="$(printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$DOC" | PATH="$PY_DIR:/usr/bin:/bin" sh "$TMP/vale-md.sh")"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ]; then pass 'case5 no vale binary: silent, exit 0'; else fail "case5 no vale binary: silent, exit 0 (rc=$rc out=$out)"; fi

# Case 6: malformed stdin — silent, exit 0.
out="$(printf 'not json' | PATH="$TMP/bin:$PATH" sh "$TMP/vale-md.sh")"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ]; then pass 'case6 malformed stdin: silent, exit 0'; else fail "case6 malformed stdin: silent, exit 0 (rc=$rc out=$out)"; fi

# Case 7: malformed config — fail-open, still emits.
printf 'not json' > "$PROJ/.claude/war/config.json"
out="$(run_hook "$DOC")"
case "$out" in *additionalContext*) pass 'case7 malformed config: fail-open' ;; *) fail 'case7 malformed config: fail-open' ;; esac
rm -f "$PROJ/.claude/war/config.json"

# Case 8: the repo copy of the shim is executable — hooks.json invokes it directly (no
# leading interpreter), so a 100644 mode kills the hook on every edit. Assert the real file.
if [ -x "$HERE/vale-md.sh" ]; then pass 'case8 repo shim is executable'; else fail 'case8 repo shim is executable (hooks.json invokes it directly)'; fi

# Case 9: the registration keeps its per-tool `if` filters — they are what stops a
# python3 spawn on every non-Markdown edit; collapsing the two handlers into one loses
# either Write or Edit coverage (one `if` rule may name only one tool).
HJ="$HERE/../hooks.json"
if grep -Fq 'Edit(**/*.md)' "$HJ" && grep -Fq 'Write(**/*.md)' "$HJ"; then pass 'case9 hooks.json carries both if filters'; else fail 'case9 hooks.json carries both if filters'; fi

# Case 10: hooks.valeGoogleFork true — vale runs with the house+Google profile.
printf '{"hooks":{"valeGoogleFork":true}}' > "$PROJ/.claude/war/config.json"
rm -f "$STUB_ARGS"
out="$(run_hook "$DOC")"
if grep -Fq '.vale-google.ini' "$STUB_ARGS" 2>/dev/null; then pass 'case10 valeGoogleFork true: google profile selected'; else fail 'case10 valeGoogleFork true: google profile selected'; fi

# Case 11: valeGoogleFork true but valeMarkdown false — the master toggle wins, silent.
printf '{"hooks":{"valeMarkdown":false,"valeGoogleFork":true}}' > "$PROJ/.claude/war/config.json"
rm -f "$STUB_ARGS"
out="$(run_hook "$DOC")"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ] && [ ! -e "$STUB_ARGS" ]; then pass 'case11 valeMarkdown false beats valeGoogleFork true'; else fail "case11 valeMarkdown false beats valeGoogleFork true (rc=$rc out=$out)"; fi

# Case 12: valeGoogleFork false — the house-only profile is selected.
printf '{"hooks":{"valeGoogleFork":false}}' > "$PROJ/.claude/war/config.json"
rm -f "$STUB_ARGS"
out="$(run_hook "$DOC")"
if grep -q '\.vale\.ini' "$STUB_ARGS" 2>/dev/null && ! grep -Fq '.vale-google.ini' "$STUB_ARGS" 2>/dev/null; then pass 'case12 valeGoogleFork false: house profile'; else fail 'case12 valeGoogleFork false: house profile'; fi

# Case 13: valeGoogleFork null — unset means the default (google profile).
printf '{"hooks":{"valeGoogleFork":null}}' > "$PROJ/.claude/war/config.json"
rm -f "$STUB_ARGS"
out="$(run_hook "$DOC")"
if grep -Fq '.vale-google.ini' "$STUB_ARGS" 2>/dev/null; then pass 'case13 valeGoogleFork null: default google profile'; else fail 'case13 valeGoogleFork null: default google profile'; fi
rm -f "$PROJ/.claude/war/config.json"

# Case 14: zero findings — silent, exit 0.
out="$(printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$DOC" | STUB_EMPTY=1 PATH="$TMP/bin:$PATH" sh "$TMP/vale-md.sh")"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ]; then pass 'case14 zero findings: silent'; else fail "case14 zero findings: silent (rc=$rc out=$out)"; fi

if [ "$fails" -eq 0 ]; then printf 'PASS vale-md.test.sh (%d cases)\n' "$n"; exit 0; else printf 'FAIL vale-md.test.sh (%d/%d failed)\n' "$fails" "$n"; exit 1; fi
