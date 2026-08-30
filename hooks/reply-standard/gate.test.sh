#!/usr/bin/env bash
# gate.py — the war-config toggle in front of the byte-for-byte Reply Standard scripts.
# Cases: absent config (on), explicit false (off), explicit true (on), malformed JSON
# (fail-open on), and the meter path gated off writes no meter.log.
# bash-3.2-safe, cwd-independent; runs against a temp copy so the repo tree stays clean.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"

fails=0
n=0
pass() { n=$((n + 1)); printf 'ok %d - %s\n' "$n" "$1"; }
fail() { n=$((n + 1)); fails=$((fails + 1)); printf 'FAIL %d - %s\n' "$n" "$1"; }

# The whole pair is python3-gated by gate.sh; without the interpreter the hooks (and this
# suite) are deliberate no-ops, so skip rather than red on a python-less host.
command -v python3 >/dev/null 2>&1 || { echo 'SKIP gate.test.sh (no python3 — gate.sh no-ops the pair)'; exit 0; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp "$HERE/gate.sh" "$HERE/gate.py" "$HERE/card.py" "$HERE/card.md" "$HERE/meter.py" "$TMP/"
PROJ="$TMP/proj"
mkdir -p "$PROJ/.claude/war"
export CLAUDE_PROJECT_DIR="$PROJ"

run_card() { printf '{"prompt":"why does this fail?"}' | sh "$TMP/gate.sh" card.py; }

# Case 1: no config file — hook runs (default on).
rm -f "$PROJ/.claude/war/config.json"
out="$(run_card)"
case "$out" in *"REPLY STANDARD"*) pass 'case1 no config: card runs' ;; *) fail 'case1 no config: card runs' ;; esac

# Case 2: hooks.replyStandard false — gated off, no output, still exit 0.
printf '{"hooks":{"replyStandard":false}}' > "$PROJ/.claude/war/config.json"
out="$(run_card)"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ]; then pass 'case2 false: silent, exit 0'; else fail "case2 false: silent, exit 0 (rc=$rc out=$out)"; fi

# Case 3: hooks.replyStandard true — runs.
printf '{"hooks":{"replyStandard":true}}' > "$PROJ/.claude/war/config.json"
out="$(run_card)"
case "$out" in *"REPLY STANDARD"*) pass 'case3 true: card runs' ;; *) fail 'case3 true: card runs' ;; esac

# Case 4: malformed JSON — fail-open, runs.
printf 'not json' > "$PROJ/.claude/war/config.json"
out="$(run_card)"
case "$out" in *"REPLY STANDARD"*) pass 'case4 malformed config: fail-open, card runs' ;; *) fail 'case4 malformed config: fail-open, card runs' ;; esac

# Case 5: meter path gated off — no meter.log written.
printf '{"hooks":{"replyStandard":false}}' > "$PROJ/.claude/war/config.json"
printf '{"last_assistant_message":"This should be scored.","session_id":"t"}' | sh "$TMP/gate.sh" meter.py
if [ ! -e "$TMP/meter.log" ]; then pass 'case5 false: meter writes nothing'; else fail 'case5 false: meter writes nothing'; fi

# Case 6: meter path on — one meter.log row.
rm -f "$PROJ/.claude/war/config.json"
printf '{"last_assistant_message":"This should be scored.","session_id":"t"}' | sh "$TMP/gate.sh" meter.py
if [ -s "$TMP/meter.log" ]; then pass 'case6 default on: meter writes a row'; else fail 'case6 default on: meter writes a row'; fi

# Case 7: the wrapped script raising must be contained — gate still exits 0, silently.
printf 'raise RuntimeError("boom")\n' > "$TMP/boom.py"
out="$(printf '{}' | sh "$TMP/gate.sh" boom.py 2>&1)"; rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then pass 'case7 wrapped raise: contained, exit 0'; else fail "case7 wrapped raise: contained, exit 0 (rc=$rc out=$out)"; fi

if [ "$fails" -eq 0 ]; then printf 'PASS gate.test.sh (%d cases)\n' "$n"; exit 0; else printf 'FAIL gate.test.sh (%d/%d failed)\n' "$fails" "$n"; exit 1; fi
