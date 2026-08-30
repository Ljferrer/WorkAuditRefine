"""Gate for the Reply Standard hooks (card.py / meter.py by @kem_glitch — those stay byte-for-byte).

Reads the WAR run config (.claude/war/config.json) of the project the hook fires in and runs the
wrapped script only while `hooks.replyStandard` is not false. Fail-open: no config file, unreadable
JSON, or a malformed `hooks` block all mean ON (the war-config DEFAULTS value); only an explicit
`false` disables. Always exits 0 — the gate never blocks a prompt or a stop: whatever the wrapped
script raises or exits with is contained here, so an upstream defect (or a read-only plugin
install dir breaking the scripts' log appends) degrades to a silent no-op, never a hook error.
"""
import json
import os
import pathlib
import runpy
import sys

script = pathlib.Path(sys.argv[1]).name if len(sys.argv) > 1 else "card.py"
target = pathlib.Path(__file__).resolve().parent / script
enabled = True
try:
    cfg = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()) / ".claude" / "war" / "config.json"
    data = json.loads(cfg.read_text(encoding="utf-8"))
    hooks = data.get("hooks") if isinstance(data, dict) else None
    if isinstance(hooks, dict) and hooks.get("replyStandard") is False:
        enabled = False
except (OSError, ValueError):
    pass
if enabled:
    try:
        runpy.run_path(str(target), run_name="__main__")
    except BaseException:
        pass
sys.exit(0)
