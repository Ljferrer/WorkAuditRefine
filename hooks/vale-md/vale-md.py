"""PostToolUse hook: advisory Vale prose lint for Markdown edits.

Registered in hooks/hooks.json on Edit|Write. Lints only `.md` files, with the
self-contained profile beside this script (`.vale.ini` + `styles/ReplyStandard/`
— no packages, no network, no `vale sync`). Advisory only: it never blocks and
always exits 0. When Vale reports findings, the hook returns one
`additionalContext` line so the editing agent sees the count and the top rules.

Unlike the Reply Standard card/meter pair (main-conversation events only),
PostToolUse fires inside subagents too, so WAR workers editing plans, docs, or
skills see the same advisory line.

Toggle: `hooks.valeMarkdown` in the project's `.claude/war/config.json`
(default on). The read is fail-open, mirroring hooks/reply-standard/gate.py:
no config, unreadable JSON, a malformed `hooks` block, or `null` all mean ON;
only an explicit `false` disables. A missing `vale` binary, a non-Markdown
path, unreadable stdin, or a Vale failure each mean a silent exit 0.
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent


def enabled():
    try:
        cfg = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()) / ".claude" / "war" / "config.json"
        hooks = json.loads(cfg.read_text(encoding="utf-8")).get("hooks")
        if isinstance(hooks, dict) and hooks.get("valeMarkdown") is False:
            return False
    except (OSError, ValueError, AttributeError):
        pass
    return True


def main():
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    except ValueError:
        return
    if not isinstance(data, dict) or not enabled():
        return
    tool_input = data.get("tool_input")
    path = (tool_input or {}).get("file_path") or ""
    if not path.endswith(".md") or not pathlib.Path(path).is_file():
        return
    vale = shutil.which("vale")
    if not vale:
        return
    try:
        run = subprocess.run(
            [vale, "--output=JSON", "--config=" + str(HERE / ".vale.ini"), path],
            capture_output=True, text=True, timeout=8)
        alerts = [a for file_alerts in json.loads(run.stdout or "{}").values() for a in file_alerts]
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return
    if not alerts:
        return
    counts = {}
    for a in alerts:
        rule = a.get("Check", "unknown")
        counts[rule] = counts.get(rule, 0) + 1
    top = ", ".join(
        "%s x%d" % (rule, n)
        for rule, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3])
    name = pathlib.Path(path).name
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                "Vale (advisory, never blocking): %d prose finding(s) in %s — %s. "
                "Simplify where it reads better. Never reword ratified, byte-pinned, or "
                "drift-guarded literals to satisfy a style rule." % (len(alerts), name, top)),
        }
    }))


main()
sys.exit(0)
