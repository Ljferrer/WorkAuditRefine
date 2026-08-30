"""SubagentStart: hand the seat edition of the reply standard to a spawning WAR subagent.

Emits the documented JSON output shape — hookSpecificOutput.additionalContext — which Claude Code
adds to the subagent's context before its first prompt (plain stdout does nothing on this event).
Agent-type scoping lives in hooks.json's matcher; the config toggle lives in gate.py, which runs
this script only while hooks.replyStandard is not false. Always exits 0.
"""
import json
import pathlib
import sys

try:
    sys.stdin.buffer.read()  # drain the payload; the matcher already filtered the agent type
    card = (pathlib.Path(__file__).resolve().parent / "subagent-card.md").read_text(encoding="utf-8")
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": card}}))
except Exception:
    pass
sys.exit(0)
