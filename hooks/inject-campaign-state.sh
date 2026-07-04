#!/usr/bin/env bash
# WAR campaign post-compact re-injection (SessionStart: compact|clear|resume).
#
# Deterministically re-anchors a compacted/cleared/resumed session on the
# active campaign's CAMPAIGN-STATE.md brief. The state file is a write-ahead
# checkpoint the Lead rewrites before every long wait (see
# skills/war-campaign/SKILL.md + ADR 0016); this hook is the code-enforced
# re-entry half. It is a brief toward git truth, never the authority — the
# banner says so.
#
# Mirrors the stdin-JSON + `jq -r "$1 // empty"` idiom of the sibling hooks
# (validate-worktree-scope.sh et al). Constraints: macOS bash 3.2.57 — no
# globstar, no associative arrays, no ${,,}. jq is already a hook dependency.
#
# FAIL-OPEN SILENCE: no campaigns dir / no ledger / unparsable ledger / jq
# missing / any internal error → exit 0 with empty stdout. A broken hook must
# NEVER wedge session start in an unrelated repo, so we never exit nonzero and
# never emit a partial payload. set -e is deliberately NOT used: a nonzero from
# any probe (jq parse of a malformed ledger, a missing file) must fall through
# to silent exit 0, not abort the shell.
set -u

# --- fail-open guards -------------------------------------------------------
# jq missing → silent. Everything below assumes jq exists.
command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

# Scan root: $CLAUDE_PROJECT_DIR when set, else the input cwd. If neither
# resolves to a real dir, there is nothing to scan → silent.
root="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$root" ]; then
  root="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)"
fi
[ -n "$root" ] || exit 0
[ -d "$root/.claude/campaigns" ] || exit 0

# --- find the active campaign, latest-by-mtime ------------------------------
# ACTIVE ⇔ ledger parses as JSON AND .plans is a non-empty array AND at least
# one plan has .status != "landed". Gate on found-and-open, NOT array length
# alone: an all-landed campaign is inactive.
#
# TERMINAL-STATUS GATE: only "landed" is terminal today. A future terminal
# status (e.g. "abandoned"/"skipped") MUST be added to the `!= "landed"` test
# below, or an abandoned campaign would re-inject forever.
is_active() {
  # $1 = ledger path. Echoes nothing; return 0 if active, 1 otherwise.
  jq -e '(.plans | type == "array") and (.plans | length > 0)
         and ([.plans[] | select(.status != "landed")] | length > 0)' \
    "$1" >/dev/null 2>&1
}

# Order candidate ledgers newest-first by mtime via `ls -t` (portable; NEVER
# `stat -f`/`stat -c` — BSD/GNU flag divergence). The SHELL expands the glob;
# on no-match the loop var holds the literal pattern, caught by `[ -f ]`. We
# collect only real paths, then hand them to `ls -t` to sort by the ledger's
# own mtime — that sort is what "latest campaign" means. We do NOT `set -f`:
# noglob would suppress the very expansion we need and pass `ls` a literal `*`.
active_ledger=""
passed_over=""   # space-separated campaign ids of active-but-not-chosen campaigns

# Collect existing ledger paths into a newline-separated list. Paths are our
# own campaign dir names (no newlines), so newline-splitting is safe on bash 3.2.
candidates=""
for ledger in "$root"/.claude/campaigns/*/ledger.json; do
  [ -f "$ledger" ] || continue          # no-match leaves the literal pattern → skip
  candidates="${candidates}${ledger}
"
done
[ -n "$candidates" ] || exit 0          # no ledger files at all → silent

# Sort the collected paths newest-first by mtime. `printf | xargs ls -t` keeps
# `ls` off an empty arg list (which would list the cwd); an empty $candidates
# already exited above.
# shellcheck disable=SC2012,SC2046  # ls -t is the portable mtime sort; word-split intentional
for ledger in $(printf '%s' "$candidates" | xargs ls -t 2>/dev/null); do
  is_active "$ledger" || continue
  cid="$(jq -r '.campaign // empty' "$ledger" 2>/dev/null)"
  [ -n "$cid" ] || cid="$(basename "$(dirname "$ledger")")"
  if [ -z "$active_ledger" ]; then
    active_ledger="$ledger"          # first active in newest-first order = winner
    winner_id="$cid"
  else
    passed_over="$passed_over $cid"  # older active campaigns, named in the banner
  fi
done

# No active campaign → silent.
[ -n "$active_ledger" ] || exit 0

campaign_dir="$(dirname "$active_ledger")"
state_file="$campaign_dir/CAMPAIGN-STATE.md"

# --- build the payload pieces ----------------------------------------------
# One-line ledger digest: `slug:status` per plan, space-joined.
digest="$(jq -r '[.plans[] | "\(.slug):\(.status)"] | join("  ")' "$active_ledger" 2>/dev/null)"

# Banner line. Name any passed-over active campaigns so the operator knows one
# was chosen over others.
banner="Active campaign ${winner_id} — post-compact re-injection; the state below is a brief, reconcile toward git before acting."
if [ -n "$passed_over" ]; then
  banner="$banner (Passed over other active campaigns:$passed_over.)"
fi

nl='
'

# Assemble additionalContext by variant.
if [ ! -f "$state_file" ]; then
  # Variant: state file MISSING on an active campaign → banner + digest +
  # reconstruct instruction (per the write-ahead protocol in war-campaign SKILL.md).
  payload="${banner}${nl}${nl}Ledger digest: ${digest}${nl}${nl}CAMPAIGN-STATE.md is missing for this active campaign. Reconstruct the write-ahead checkpoint at ${state_file} from the ledger and git state before proceeding (see the write-ahead protocol in skills/war-campaign/SKILL.md)."
else
  # Size gate. `wc -c` is portable (bytes). > 32768 → pointer-only fallback.
  size="$(wc -c < "$state_file" 2>/dev/null | tr -d '[:space:]')"
  [ -n "$size" ] || size=0
  if [ "$size" -gt 32768 ]; then
    # Variant: state file too large → pointer only (banner + path + digest),
    # no inline body — keeps the injected context bounded.
    payload="${banner}${nl}${nl}Ledger digest: ${digest}${nl}${nl}CAMPAIGN-STATE.md is large (${size} bytes) — not inlined. Read it directly: ${state_file}"
  else
    # Normal: banner + full state body + digest.
    body="$(cat "$state_file" 2>/dev/null)"
    payload="${banner}${nl}${nl}${body}${nl}${nl}Ledger digest: ${digest}"
  fi
fi

# --- emit exactly one JSON object ------------------------------------------
# jq -nc --arg only (NEVER printf-interpolated JSON — the payload contains
# arbitrary markdown; printf would produce invalid/injectable JSON).
jq -nc --arg ctx "$payload" \
  '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}' \
  2>/dev/null || exit 0
