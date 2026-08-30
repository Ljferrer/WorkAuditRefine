"""Gate for the Reply Standard hooks (card.py / meter.py by @kem_glitch — those stay byte-for-byte).

Reads the WAR run config (.claude/war/config.json) of the project the hook fires in and runs the
wrapped script only while `hooks.replyStandard` is not false. Fail-open: no config file, unreadable
JSON, or a malformed `hooks` block all mean ON (the war-config DEFAULTS value); only an explicit
`false` disables. Always exits 0 — the gate never blocks a prompt or a stop: whatever the wrapped
script raises or exits with is contained here, so an upstream defect (or a read-only plugin
install dir breaking the scripts' log appends) degrades to a silent no-op, never a hook error.

One more rule (Lead-audit ruling, option a): a prompt whose first token invokes a WAR command
(/war and the /war-* family, /red-team, /survey-corps, /aftermath, /lessons-learned) skips the
card — the WAR Lead's orchestration turns must not be style-pressured by it. The meter is not
skipped; scoring stays on.
"""
import io
import json
import os
import pathlib
import runpy
import sys

WAR_COMMANDS = {"/war", "/red-team", "/survey-corps", "/aftermath", "/lessons-learned"}

script = pathlib.Path(sys.argv[1]).name if len(sys.argv) > 1 else "card.py"
target = pathlib.Path(__file__).resolve().parent / script
raw = sys.stdin.buffer.read()
enabled = True
try:
    cfg = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()) / ".claude" / "war" / "config.json"
    data = json.loads(cfg.read_text(encoding="utf-8"))
    hooks = data.get("hooks") if isinstance(data, dict) else None
    if isinstance(hooks, dict) and hooks.get("replyStandard") is False:
        enabled = False
except (OSError, ValueError):
    pass
if enabled and script == "card.py":
    try:
        prompt = (json.loads(raw.decode("utf-8", "replace")).get("prompt") or "").strip()
        tok = prompt.split()[0] if prompt.split() else ""
        if tok in WAR_COMMANDS or tok.startswith("/war-"):
            enabled = False
    except (ValueError, AttributeError):
        pass
if enabled:
    sys.stdin = io.TextIOWrapper(io.BytesIO(raw), encoding="utf-8")
    try:
        runpy.run_path(str(target), run_name="__main__")
    except BaseException:
        pass
sys.exit(0)
