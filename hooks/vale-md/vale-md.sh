#!/bin/sh
# Interpreter shim for the vale-md hook: without python3 on PATH the hook silently
# no-ops (the reply-standard gate.sh precedent — degrade, never a hook error on every edit).
# The vale binary itself is checked inside vale-md.py, so a machine without vale also no-ops.
command -v python3 >/dev/null 2>&1 || exit 0
exec python3 "$(dirname "$0")/vale-md.py"
