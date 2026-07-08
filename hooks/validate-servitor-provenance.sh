#!/usr/bin/env bash
# WAR servitor provenance gate (PreToolUse: Write|Edit|NotebookEdit).
#
# Two-layer contract:
#   Layer 1 — existing-target authorship guard (Write, Edit, AND NotebookEdit).
#     A pre-existing memory file whose frontmatter carries a nested
#     metadata.provenance value is WAR-editable; one that LACKS it is
#     user-authored (top-of-ladder, ADR 0007) and immutable to the servitor —
#     every mutating tool is denied. This runs before the non-Write
#     short-circuit so Edit/NotebookEdit are covered.
#   Layer 2 — new-content tier check (Write only, unchanged). A Write's own
#     payload content must carry a valid metadata.provenance tier.
#
# Pinned fail-direction: `[ -f "$fp" ]` false — a nonexistent target OR a
# relative path — falls through to the new-file path (no layer-1 denial). This
# is safe: the fail-closed servitor scope hook denies out-of-root and relative
# writes first, so a relative $fp never reaches a real user file. This hook is a
# content gate, never a scope gate — it does not re-implement scope.
#
# ponytail: structural-not-semantic ceiling — the gate proves the metadata.provenance
# tag is *present*, never *honest* (a servitor could stamp code-verified without
# checking). Semantic honesty is prompt-layer (T2/T3). Gate stops the silent
# erosion: a tag-less write, the realistic failure mode.
#
# Constraints: macOS bash 3.2.57-compatible — no globstar, no associative arrays,
# no ${,,}. Reads the payload via jq (already a hook dependency).
set -euo pipefail

input="$(cat)"
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true; }

tool="$(get '.tool_name')"
atype="$(get '.agent_type')"
fp="$(get '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path')"

deny() { printf 'WAR provenance: %s\n' "$1" >&2; exit 2; }

# Extract the NESTED metadata.provenance value from a frontmatter-bearing
# string. The real memory-file shape is:
#   metadata:
#     provenance: <tier>
# NOT a top-level ^provenance: line (frontmatter-tools-negation-check-single-line-only).
#
# awk/sed exit 0 on no-match (unlike grep, which exits 1), so a tag-less input
# yields an EMPTY value rather than aborting under set -euo pipefail. The || true
# is belt-and-suspenders should a future grep stage be added.
extract_provenance() {
  local ct fm
  ct="$1"
  # Frontmatter block (between the first two --- delimiters).
  fm="$(printf '%s\n' "$ct" | awk '/^---/{if(++c==2) exit} c==1{print}' || true)"
  # Locate `metadata:`, then take the next indented `provenance:` (any indent).
  printf '%s\n' "$fm" \
    | awk '/^metadata:/{found=1; next} found && /^[[:space:]]+provenance:/{print; exit} found && /^[^[:space:]]/{exit}' \
    | sed 's/.*provenance:[[:space:]]*//' \
    || true
}

# (1) Exemptions — pass through without any check.
# Non-servitor agent_type (hoisted above the Write short-circuit; behavior-
# identical for non-servitors, but now also exempts their Edit/NotebookEdit).
case "$atype" in
  *war-servitor*) ;;
  *) exit 0 ;;
esac
# No file_path.
[ -z "$fp" ] && exit 0
# Path outside the memory/learnings target — scope hook handles denial; this
# content gate allows it to avoid double-gating non-fact paths.
case "$fp" in
  */.claude/projects/*/memory/*|*/docs/learnings/*) ;;
  *) exit 0 ;;
esac
# Exact basename == MEMORY.md (the generated index; never a substring/glob so
# MEMORY.md.bak or a .../MEMORY.md/x directory component is NOT exempted).
[[ "$(basename "$fp")" == "MEMORY.md" ]] && exit 0

# (2) Layer 1 — existing-target authorship guard (all three tools).
# If the target file already exists on disk and its frontmatter lacks a nested
# metadata.provenance value, it is user-authored and immutable to the servitor.
if [ -f "$fp" ]; then
  file_prov="$(extract_provenance "$(cat "$fp")")"
  [ -z "$file_prov" ] && deny "target '$fp' is a user-authored memory file (no nested metadata.provenance) and is immutable to the servitor. Do not modify it; create a new file cross-linked to it via a [[slug]] wikilink instead."
fi

# (3) Non-Write short-circuit. Edit/NotebookEdit payloads carry
# old_string/new_string, not tool_input.content; they cannot be content-gated
# and, having cleared layer 1, pass through.
[ "$tool" != "Write" ] && exit 0

# (4) Layer 2 — new-content tier check (Write only). The write's OWN payload
# content must carry a valid metadata.provenance tier.
content="$(get '.tool_input.content')"
provenance="$(extract_provenance "$content")"
case "$provenance" in
  agent-unverified|code-verified|user-confirmed) exit 0 ;;
  *)
    deny "servitor Write to '$fp' is missing a valid metadata.provenance tag. Required field: metadata.provenance (nested under metadata:). Valid tiers: agent-unverified | code-verified | user-confirmed. Got: '${provenance:-<absent>}'."
    ;;
esac
