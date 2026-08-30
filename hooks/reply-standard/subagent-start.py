"""SubagentStart: hand the seat edition of the reply standard to a spawning WAR subagent.

Emits the documented JSON output shape — hookSpecificOutput.additionalContext — which Claude Code
adds to the subagent's context before its first prompt (plain stdout does nothing on this event).
Agent-type scoping lives in hooks.json's matcher; the config toggle lives in gate.py, which runs
this script only while hooks.replyStandard is not false. Always exits 0.
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent

try:
    raw = sys.stdin.buffer.read()
    card = (HERE / "subagent-card.md").read_text(encoding="utf-8")
    # Per-seat addendum: agent_type "work-audit-refine:war-worker" selects
    # subagent-card.war-worker.md when present; an unknown role gets the blanket card alone.
    try:
        agent_type = json.loads(raw.decode("utf-8", "replace")).get("agent_type") or ""
        role = pathlib.Path(str(agent_type).split(":")[-1]).name
        extra = HERE / ("subagent-card." + role + ".md")
        if role and extra.is_file():
            card = card + "\n" + extra.read_text(encoding="utf-8")
    except (ValueError, AttributeError):
        pass
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": card}}))
except Exception:
    pass
sys.exit(0)
