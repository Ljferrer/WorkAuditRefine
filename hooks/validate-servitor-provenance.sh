#!/usr/bin/env bash
# WAR servitor provenance gate (PreToolUse: Write|Edit|NotebookEdit).
#
# Wired to the existing Write|Edit|NotebookEdit matcher; the internal
# tool_name == "Write" guard makes Edit/NotebookEdit pass through untouched.
# An Edit payload carries old_string/new_string, NOT tool_input.content —
# gating it would deny every servitor dedup-in-place Edit and MEMORY.md
# row-update. Documented here, not silently skipped.
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

# (1) Short-circuit ALLOW unless tool_name == "Write".
# Edit/NotebookEdit payloads carry old_string/new_string, not tool_input.content;
# they cannot be content-gated and MUST pass through.
[ "$tool" != "Write" ] && exit 0

# (2) Exemptions — pass through without content check.
# Non-servitor agent_type.
case "$atype" in
  *war-servitor*) ;;
  *) exit 0 ;;
esac
# No file_path.
[ -z "$fp" ] && exit 0
# Exact basename == MEMORY.md (the index file; never a substring/glob so
# MEMORY.md.bak or a .../MEMORY.md/x directory component is NOT exempted).
[[ "$(basename "$fp")" == "MEMORY.md" ]] && exit 0
# Path outside the memory/learnings target — scope hook handles denial; this
# hook allows it to avoid double-gating non-fact paths.
case "$fp" in
  */.claude/projects/*/memory/*|*/docs/learnings/*) ;;
  *) exit 0 ;;
esac

# (3) Extract the NESTED metadata.provenance value from tool_input.content's
# frontmatter. The real memory-file shape is:
#   metadata:
#     provenance: <tier>
# NOT a top-level ^provenance: line (frontmatter-tools-negation-check-single-line-only).
#
# Guard the extraction pipeline with || true. The pipeline is awk then awk/sed —
# no grep. awk/sed exit 0 on a no-match (unlike grep, which exits 1), so on a
# tag-less write $provenance ends up EMPTY and the write is denied by the
# empty-string `*)` arm of the tier `case` below (exit 2). get() already carries
# its own || true. The || true here is cheap belt-and-suspenders: it keeps the
# stage from aborting under set -euo pipefail should a future grep stage (which
# WOULD exit 1 on no-match) be added — so denial stays a case-arm decision, never
# an abort-at-exit-1 that fails OPEN (floor-script-exit-codes-1-vs-2-route-differently).
content="$(get '.tool_input.content')"

# Extract frontmatter block (between first two --- delimiters).
frontmatter="$(printf '%s\n' "$content" | awk '/^---/{if(++c==2) exit} c==1{print}' || true)"

# Find the metadata: block, then extract the indented provenance: value.
# Two-step: locate `metadata:` line, then take the next indented `provenance:` line (any leading whitespace).
provenance="$(printf '%s\n' "$frontmatter" \
  | awk '/^metadata:/{found=1; next} found && /^[[:space:]]+provenance:/{print; exit} found && /^[^[:space:]]/{exit}' \
  | sed 's/.*provenance:[[:space:]]*//' \
  || true)"

# (4) Tier-membership check — absent or out-of-tier → exit 2.
case "$provenance" in
  agent-unverified|code-verified|user-confirmed) exit 0 ;;
  *)
    deny "servitor Write to '$fp' is missing a valid metadata.provenance tag. Required field: metadata.provenance (nested under metadata:). Valid tiers: agent-unverified | code-verified | user-confirmed. Got: '${provenance:-<absent>}'."
    ;;
esac
