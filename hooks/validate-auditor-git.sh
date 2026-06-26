#!/usr/bin/env bash
# WAR auditor read-only-git Bash guard (PreToolUse: Bash).
# F03 — fail-closed confinement for the war-auditor agent.
#
# PURPOSE
#   For agent_type matching *war-auditor*: ALLOW iff the command is a single
#   git read-subcommand from the explicit allowlist, with no shell
#   metacharacters.  DENY (exit 2) anything else.
#   Non-auditor agent types → exit 0 (pass-through; this guard is auditor-only).
#
# FAIL-CLOSED CHARACTER ALLOWLIST (bash 3.2.57 compatible)
#   Permitted chars: [A-Za-z0-9 ./_=:,@^-]
#   Method: LC_ALL=C tr -d '<allowlist>' extracts residue.
#   If residue is non-empty → forbidden char detected → DENY.
#   This approach is safe on bash 3.2 (no bracket-class case mixing
#   backtick/quotes that crashes with unexpected-EOF).
#   We do NOT rely on $(...) to materialize a bare newline — bash 3.2 strips
#   trailing newlines from command substitution, yielding an empty pattern.
#
# GLOBAL GIT FLAGS DENIED (even before subcommand check)
#   -c / --config       : override git config (security risk)
#   --output / -o       : redirect output to a file (write op)
#   --paginate / -p     : GLOBAL leading pager flag (not subcommand -p)
#   --no-pager          : global pager control
#   --pager=            : global pager config
#   NOTE: subcommand-local -p (git cat-file -p, git show -p, git log -p)
#   is READ-ONLY and ALLOWED — it only becomes global if it appears
#   immediately after 'git' (before the subcommand).
#
# READ-ONLY SUBCOMMAND ALLOWLIST
#   diff, log, show, merge-base, rev-parse, status, ls-files, cat-file, blame
#
# CONSTRAINTS
#   Runs on macOS bash 3.2.57 — no globstar, no associative arrays, no ${,,}.
#   Reads payload via jq (already a hook dependency).
set -euo pipefail

input="$(cat)"
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true; }

atype="$(get '.agent_type')"
cmd="$(get '.tool_input.command')"

# ---------------------------------------------------------------------------
# Only gate war-auditor agents; all others pass through.
# ---------------------------------------------------------------------------
case "$atype" in
  *war-auditor*) ;;
  *) exit 0 ;;
esac

# deny <reason>: emit WAR: marker on stderr and exit 2.
deny() {
  echo "WAR: auditor git guard DENIED: $1" >&2
  exit 2
}

# ---------------------------------------------------------------------------
# Fail-closed: deny empty or missing command.
# ---------------------------------------------------------------------------
[ -z "$cmd" ] && deny "empty command"

# ---------------------------------------------------------------------------
# CHARACTER ALLOWLIST check (fail-closed).
# Permit only: A-Za-z0-9 SPACE . / _ = : , @ ^ -
# Use LC_ALL=C tr -d to extract any character outside the allowed set.
# If residue is non-empty, a forbidden character is present → DENY.
#
# NOTE: We do NOT put a literal newline in the allowlist string — bash 3.2
# strips trailing newlines from $(...) so the pattern would be empty.
# Instead, newline is implicitly denied because it is NOT in the allowlist.
# ---------------------------------------------------------------------------
residue="$(printf '%s' "$cmd" | LC_ALL=C tr -d 'A-Za-z0-9 ./_=:,@^-')"
[ -n "$residue" ] && deny "command contains forbidden character(s): $(printf '%s' "$residue" | LC_ALL=C tr -d '\n' | head -c 20)"

# ---------------------------------------------------------------------------
# At this point, the command contains only [A-Za-z0-9 ./_=:,@^-].
# Parse it: must start with 'git ' (or be exactly 'git').
# ---------------------------------------------------------------------------
case "$cmd" in
  git\ *|git) ;;
  *) deny "not a git command" ;;
esac

# Strip the leading 'git' token and any surrounding spaces to get the rest.
rest="${cmd#git}"
rest="${rest# }"

# ---------------------------------------------------------------------------
# Deny global git flags that appear BEFORE the subcommand.
# These flags come immediately after 'git' and precede the subcommand.
# Order: check each known dangerous global flag pattern.
# ---------------------------------------------------------------------------
case "$rest" in
  -c\ *|-c)
    deny "global -c (git config override) is not permitted" ;;
  --output*|-o\ *|-o)
    deny "global --output/-o (file redirect) is not permitted" ;;
  --paginate\ *|--paginate)
    deny "global --paginate is not permitted (use subcommand-local -p)" ;;
  --no-pager\ *|--no-pager)
    deny "global --no-pager is not permitted" ;;
  --pager=*)
    deny "global --pager= is not permitted" ;;
  -p\ *|-p)
    # Global leading -p (pager flag before the subcommand) is denied.
    # Subcommand-local -p (e.g. "git cat-file -p" / "git show -p" / "git log -p")
    # appears AFTER the subcommand and is allowed (it is read-only).
    deny "global leading -p (pager) is not permitted; subcommand-local -p (e.g. git cat-file -p) is allowed" ;;
esac

# ---------------------------------------------------------------------------
# Extract the subcommand (first word of $rest).
# ---------------------------------------------------------------------------
subcmd=""
case "$rest" in
  diff\ *|diff)   subcmd="diff" ;;
  log\ *|log)     subcmd="log" ;;
  show\ *|show)   subcmd="show" ;;
  merge-base\ *|merge-base) subcmd="merge-base" ;;
  rev-parse\ *|rev-parse)   subcmd="rev-parse" ;;
  status\ *|status)         subcmd="status" ;;
  ls-files\ *|ls-files)     subcmd="ls-files" ;;
  cat-file\ *|cat-file)     subcmd="cat-file" ;;
  blame\ *|blame)           subcmd="blame" ;;
  "")
    deny "bare 'git' with no subcommand" ;;
  *)
    # Extract first word for a cleaner error message.
    first_word="$(printf '%s' "$rest" | cut -d' ' -f1)"
    deny "git subcommand '$first_word' is not in the read-only allowlist (diff/log/show/merge-base/rev-parse/status/ls-files/cat-file/blame)" ;;
esac

# ---------------------------------------------------------------------------
# Post-subcommand scan: deny --output / --output= / -o / --output-directory
# anywhere in $rest (after the subcommand).
#
# Rationale: git supports --output=<file> and --output-directory=<dir> as
# subcommand-local flags on diff/log/format-patch etc. that WRITE files.
# The global-flag block above (lines 94-110) only catches these flags when
# they appear BEFORE the subcommand (i.e. in leading position).  If they
# appear AFTER the subcommand (e.g. "git diff --output=/tmp/x"), $rest starts
# with "diff" and the global block never fires — ALLOW.  This post-subcommand
# scan closes that gap.
#
# We match against the full $rest string (not just a leading prefix) using
# space-padded case patterns so we don't accidentally match option values
# that contain these strings as substrings.
#
# Patterns matched (space-padded against " $rest "):
#   *' --output'*   : --output=<file> or --output <file> (space-separate form)
#   *' --output-directory'*  : subsumed by '--output' prefix match above
#   *' -o '*        : short form with argument: -o <file>
#   *' -o'          : -o at end of command (pathological but blocked anyway)
# ---------------------------------------------------------------------------
padded=" $rest "
case "$padded" in
  *' --output'*|*' -o '*|*' -o')
    deny "output-to-file flag is not permitted (--output / -o writes a file)" ;;
esac

# Subcommand is in the allowlist. Allow.
exit 0
