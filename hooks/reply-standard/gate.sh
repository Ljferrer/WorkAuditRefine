#!/bin/sh
# Interpreter shim for the Reply Standard gate: without python3 on PATH the pair silently
# no-ops (the Node-memory precedent — degrade, never a hook error on every prompt/stop).
command -v python3 >/dev/null 2>&1 || exit 0
exec python3 "$(dirname "$0")/gate.py" "${1:-card.py}"
