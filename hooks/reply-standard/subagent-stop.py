"""SubagentStop: score a WAR subagent's final reply and append one line to subagent-meter.log.

Reuses meter.py's counters byte-for-byte by exec-ing its definitions (everything above its
module-level runtime block) — no duplicated regexes, and the upstream file stays untouched.
Rows carry agent_type/agent_id so /war-review can tally faults per seat. A separate log keeps
card.py's main-loop feedback prefix free of subagent rows. Never blocks, prints nothing,
always exits 0.
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent


def prose_of(text):
    """A seat's final message is often bare JSON. Score the prose inside its string
    fields (titles, evidence, rationales), not the syntax. Non-JSON passes through."""
    try:
        doc = json.loads(text)
    except ValueError:
        return text, "text"
    parts = []

    def walk(v):
        if isinstance(v, str):
            parts.append(v)
        elif isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)

    walk(doc)
    return "\n".join(parts), "json"


try:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    text = data.get("last_assistant_message") or ""
    if text.strip():
        src = (HERE / "meter.py").read_text(encoding="utf-8")
        defs = src.split("\nHERE = ")[0]  # definitions only — the runtime block reads stdin and writes meter.log
        ns = {}
        exec(compile(defs, str(HERE / "meter.py"), "exec"), ns)
        prose, shape = prose_of(text)
        row = ns["lint"](prose, "descriptive")
        row["shape"] = shape
        row["agent_type"] = data.get("agent_type")
        row["agent_id"] = data.get("agent_id")
        row["session_id"] = data.get("session_id")
        with (HERE / "subagent-meter.log").open("a", encoding="utf-8") as f:
            f.write(json.dumps(row) + "\n")
except Exception:
    pass
sys.exit(0)
