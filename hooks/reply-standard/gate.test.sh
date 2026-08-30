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
cp "$HERE/gate.sh" "$HERE/gate.py" "$HERE/card.py" "$HERE/card.md" "$HERE/meter.py" \
   "$HERE/subagent-start.py" "$HERE/subagent-stop.py" "$HERE"/subagent-card.*.md \
   "$HERE/subagent-card.md" "$TMP/"
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

# Cases 8-10: only an explicit JSON false disables — every other value stays ON.
# The string "false", 0, and null are all truthy-adjacent traps that `is False` must not match.
for v in '"false"' '0' 'null'; do
  printf '{"hooks":{"replyStandard":%s}}' "$v" > "$PROJ/.claude/war/config.json"
  out="$(run_card)"
  case "$out" in *"REPLY STANDARD"*) pass "case8-10 replyStandard=$v: stays on" ;; *) fail "case8-10 replyStandard=$v: stays on" ;; esac
done

# Case 11: a config whose top level is not an object (array) — fail-open, runs.
printf '[]' > "$PROJ/.claude/war/config.json"
out="$(run_card)"
case "$out" in *"REPLY STANDARD"*) pass 'case11 array config: fail-open, card runs' ;; *) fail 'case11 array config: fail-open, card runs' ;; esac

# Cases 12-14: WAR-command prompts skip the card (Lead-audit ruling, option a) —
# but only when the command is the FIRST token, and the meter is never skipped.
rm -f "$PROJ/.claude/war/config.json"
out="$(printf '{"prompt":"/war docs/plans/x.md --afk"}' | sh "$TMP/gate.sh" card.py)"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ]; then pass 'case12 /war prompt: card skipped, exit 0'; else fail "case12 /war prompt: card skipped, exit 0 (rc=$rc out=$out)"; fi
out="$(printf '{"prompt":"/war-campaign a.md b.md"}' | sh "$TMP/gate.sh" card.py)"
if [ -z "$out" ]; then pass 'case13 /war-* prompt: card skipped'; else fail 'case13 /war-* prompt: card skipped'; fi
out="$(printf '{"prompt":"explain /war to me"}' | sh "$TMP/gate.sh" card.py)"
case "$out" in *"REPLY STANDARD"*) pass 'case14 mid-prompt /war mention: card runs' ;; *) fail 'case14 mid-prompt /war mention: card runs' ;; esac
rm -f "$TMP/meter.log"
printf '{"last_assistant_message":"Phase 1 landed.","session_id":"t"}' | sh "$TMP/gate.sh" meter.py
if [ -s "$TMP/meter.log" ]; then pass 'case15 meter unaffected by the card skip rule'; else fail 'case15 meter unaffected by the card skip rule'; fi

# Cases 16-20: the subagent pair — SubagentStart card injection and SubagentStop metering.
SUB='{"agent_type":"work-audit-refine:war-auditor","agent_id":"a1","session_id":"t","last_assistant_message":"We should simply leverage this; it is robust."}'
rm -f "$PROJ/.claude/war/config.json"
out="$(printf '%s' "$SUB" | sh "$TMP/gate.sh" subagent-start.py)"
case "$out" in '{"hookSpecificOutput"'*'SEAT EDITION'*) pass 'case16 subagent-start: additionalContext JSON with the seat card' ;; *) fail "case16 subagent-start: additionalContext JSON with the seat card (out=$out)" ;; esac
printf '{"hooks":{"replyStandard":false}}' > "$PROJ/.claude/war/config.json"
out="$(printf '%s' "$SUB" | sh "$TMP/gate.sh" subagent-start.py)"; rc=$?
if [ -z "$out" ] && [ "$rc" -eq 0 ]; then pass 'case17 subagent-start gated off: silent, exit 0'; else fail "case17 subagent-start gated off (rc=$rc out=$out)"; fi
rm -f "$PROJ/.claude/war/config.json" "$TMP/subagent-meter.log" "$TMP/meter.log"
printf '%s' "$SUB" | sh "$TMP/gate.sh" subagent-stop.py
if [ -s "$TMP/subagent-meter.log" ] && grep -q '"agent_type": "work-audit-refine:war-auditor"' "$TMP/subagent-meter.log" && grep -q '"banned_modal": 1' "$TMP/subagent-meter.log"; then pass 'case18 subagent-stop: scored row with seat attribution'; else fail 'case18 subagent-stop: scored row with seat attribution'; fi
if [ ! -e "$TMP/meter.log" ]; then pass 'case19 log separation: subagent rows never touch meter.log'; else fail 'case19 log separation: subagent rows never touch meter.log'; fi
printf '{"hooks":{"replyStandard":false}}' > "$PROJ/.claude/war/config.json"
rm -f "$TMP/subagent-meter.log"
printf '%s' "$SUB" | sh "$TMP/gate.sh" subagent-stop.py
if [ ! -e "$TMP/subagent-meter.log" ]; then pass 'case20 subagent-stop gated off: writes nothing'; else fail 'case20 subagent-stop gated off: writes nothing'; fi
rm -f "$PROJ/.claude/war/config.json"

# Cases 21a-21b: per-seat addendum — a known role appends its card, an unknown role gets the blanket alone.
rm -f "$PROJ/.claude/war/config.json"
out="$(printf '{"agent_type":"work-audit-refine:war-worker","agent_id":"w1"}' | sh "$TMP/gate.sh" subagent-start.py)"
case "$out" in *'SEAT EDITION'*'WORKER ADDENDUM'*) pass 'case21a worker seat: blanket + worker addendum' ;; *) fail 'case21a worker seat: blanket + worker addendum' ;; esac
out="$(printf '{"agent_type":"work-audit-refine:war-scout","agent_id":"x1"}' | sh "$TMP/gate.sh" subagent-start.py)"
case "$out" in *'ADDENDUM'*) fail 'case21b unknown role: blanket card alone' ;; *'SEAT EDITION'*) pass 'case21b unknown role: blanket card alone' ;; *) fail 'case21b unknown role: blanket card alone' ;; esac

# Cases 21-22: JSON-aware scoring — a JSON final message is scored on its string fields only.
rm -f "$TMP/subagent-meter.log"
printf '{"agent_type":"work-audit-refine:war-auditor","agent_id":"a2","session_id":"t","last_assistant_message":"{\\"verdict\\":\\"approve\\",\\"findings\\":[{\\"evidence\\":\\"We should simply leverage this pattern everywhere.\\"}]}"}' | sh "$TMP/gate.sh" subagent-stop.py
if grep -q '"shape": "json"' "$TMP/subagent-meter.log" && grep -q '"banned_modal": 1' "$TMP/subagent-meter.log"; then pass 'case21 JSON message: prose fields scored, shape recorded'; else fail 'case21 JSON message: prose fields scored, shape recorded'; fi
rm -f "$TMP/subagent-meter.log"
printf '{"agent_type":"work-audit-refine:war-worker","agent_id":"a3","session_id":"t","last_assistant_message":"{\\"status\\":\\"merged\\",\\"note\\":\\"The gate ran green at the tip.\\"}"}' | sh "$TMP/gate.sh" subagent-stop.py
if grep -q '"violations_total": 0' "$TMP/subagent-meter.log"; then pass 'case22 clean JSON message: zero violations, syntax never counted'; else fail 'case22 clean JSON message: zero violations, syntax never counted'; fi

# Fenced JSON verdict — scored as JSON, not deleted by strip_code's fence rule.
rm -f "$TMP/subagent-meter.log"
printf '{"agent_type":"work-audit-refine:war-auditor","agent_id":"a4","session_id":"t","last_assistant_message":"```json\\n{\\"evidence\\":\\"We should simply leverage this pattern.\\"}\\n```"}' | sh "$TMP/gate.sh" subagent-stop.py
if grep -q '"shape": "json"' "$TMP/subagent-meter.log" && grep -q '"banned_modal": 1' "$TMP/subagent-meter.log"; then pass 'fenced JSON verdict: unfenced, scored as json'; else fail 'fenced JSON verdict: unfenced, scored as json'; fi

# Raw-vs-prose divergence — a semicolon in a JSON KEY scores raw but never on the prose path.
rm -f "$TMP/subagent-meter.log"
printf '{"agent_type":"work-audit-refine:war-worker","agent_id":"a5","session_id":"t","last_assistant_message":"{\\"k;ey\\":\\"x\\",\\"note\\":\\"All findings were addressed here.\\"}"}' | sh "$TMP/gate.sh" subagent-stop.py
if grep -q '"semicolon": 0' "$TMP/subagent-meter.log"; then pass 'JSON syntax divergence: key semicolon never counted'; else fail 'JSON syntax divergence: key semicolon never counted'; fi

if [ "$fails" -eq 0 ]; then printf 'PASS gate.test.sh (%d cases)\n' "$n"; exit 0; else printf 'FAIL gate.test.sh (%d/%d failed)\n' "$fails" "$n"; exit 1; fi
