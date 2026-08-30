"""PostToolUse hook: advisory Vale prose lint for Markdown edits.

Registered in hooks/hooks.json on Edit|Write, harness-filtered to `.md` files
via per-handler `if` rules (`Edit(**/*.md)` / `Write(**/*.md)` — one rule may
name only one tool), so non-Markdown edits never spawn a process at all; the
extension check below is the in-script backstop. Lints only `.md` files, with the
self-contained profile beside this script (`.vale.ini` + `styles/ReplyStandard/`
— no packages, no network, no `vale sync`). Advisory only: it never blocks and
always exits 0. When Vale reports findings, the hook returns one
`additionalContext` line so the editing agent sees the count and the top rules.

Unlike the Reply Standard card/meter pair (main-conversation events only),
PostToolUse fires inside subagents too, so WAR workers editing plans, docs, or
skills see the same advisory line.

Toggles in the project's `.claude/war/config.json`, both fail-open (no config,
unreadable JSON, a malformed `hooks` block, or `null` all mean the default):
`hooks.valeMarkdown` (default on — only an explicit `false` disables) and
`hooks.valeGoogle` (default off — only an explicit `true` swaps the profile to
`.vale-google.ini`, the house rules plus the vendored, tuned Google style). A missing `vale` binary, a non-Markdown
path, unreadable stdin, or a Vale failure each mean a silent exit 0.
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent


def profile():
    """The Vale config for this run, or None when the hook is toggled off.

    hooks.valeMarkdown (default ON): only an explicit false disables.
    hooks.valeGoogle (default OFF): only an explicit true selects the
    house + vendored-Google profile (.vale-google.ini) over the house-only
    default (.vale.ini). Both reads are fail-open.
    """
    hooks = {}
    try:
        cfg = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()) / ".claude" / "war" / "config.json"
        parsed = json.loads(cfg.read_text(encoding="utf-8")).get("hooks")
        if isinstance(parsed, dict):
            hooks = parsed
    except (OSError, ValueError, AttributeError):
        pass
    if hooks.get("valeMarkdown") is False:
        return None
    if hooks.get("valeGoogle") is True:
        return HERE / ".vale-google.ini"
    return HERE / ".vale.ini"


def main():
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    except ValueError:
        return
    if not isinstance(data, dict):
        return
    config = profile()
    if config is None:
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
            [vale, "--output=JSON", "--config=" + str(config), path],
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


# Containment (the gate.py shape): no internal failure — including an unexpected
# vale output shape — may surface as a hook error on an edit.
try:
    main()
except BaseException:
    pass
sys.exit(0)
