#!/usr/bin/env bash
# WAR auditor read-only-git Bash guard (PreToolUse: Bash).
# F03 — fail-closed confinement for the war-auditor, war-evidence-auditor and war-helper agents.
#
# PURPOSE
#   Gate only the war-auditor, war-evidence-auditor and war-helper agents: each
#   case arm is suffix-anchored (patterns `*war-auditor`, `*war-evidence-auditor`,
#   `*war-helper`), so
#   it captures the dispatched agent_type `<ns>:war-auditor` but NOT a longer
#   `war-auditor-helper` decoration.
#   For a captured type: ALLOW iff the command is a single git read-subcommand
#   from the explicit allowlist, with no shell metacharacters outside an
#   admitted quoted value.  DENY (exit 2) anything else.
#   The evidence seat (plan 2026-10-20-rea-artifact-evidence D3) is gated the
#   same way through its own suffix-anchored arm `*war-evidence-auditor`
#   (`*war-auditor` does not capture `<ns>:war-evidence-auditor`); its MCP
#   tools are gated by validate-evidence-auditor-mcp.sh, never here.
#   war-helper (ADR 0057) has its own arm and its own policy (PIN-26): it
#   keeps Bash only to read Git, and it runs the audit-pin and diff-probe
#   dispatches and the snapshot, confirm, pin and tip-probe relays. The helper
#   policy is the read-only set below plus ls-remote, rev-list, patch-id,
#   hash-object and cherry (see HELPER RELAY VERBS), and one pipe whose two
#   sides are each a git command the helper policy admits (see HELPER PIPE).
#   It still denies hash-object -w, ls-remote -u/--upload-pack/--exec, a
#   second pipe and every other shell syntax, and its deny text names the
#   helper policy. The two auditor arms keep the read-only set alone, and
#   fetch stays excluded for every seat.
#   Every other agent type → exit 0 (pass-through; this guard gates these
#   three read-only agents only).
#
# FAIL-CLOSED CHARACTER ALLOWLIST (bash 3.2.57 compatible)
#   Permitted chars: [A-Za-z0-9 ./_=:,@^~%+-]
#   (~ and % admit the idiomatic read forms HEAD~1 and --pretty=format:%H;
#   + admits the range-length line forms blame -L <start>,+<n> and -L /re/,+<n>;
#   none carries shell-metacharacter semantics in the denied-composition
#   space that remains — globs/braces/$/parens/pipes/redirects still deny, and
#   a quote passes only as one admitted quoted value, see QUOTED VALUES below.)
#   Method: LC_ALL=C tr -d '<allowlist>' extracts residue.
#   If residue is non-empty → forbidden char detected → DENY.
#   This approach is safe on bash 3.2 (no bracket-class case mixing
#   backtick/quotes that crashes with unexpected-EOF).
#   We do NOT rely on $(...) to materialize a bare newline — bash 3.2 strips
#   trailing newlines from command substitution, yielding an empty pattern.
#   That same stripping erases a newline-ONLY residue, so an embedded newline
#   is caught by an explicit `case "$cmd" in *$'\n'*)` pre-check that runs
#   BEFORE the residue assignment (#1828); the match reads $cmd directly and
#   never passes through $(...).
#
# QUOTED VALUES (#1915, #2374, ADR 0029 Amendment 2026-10-30)
#   One quoted value is one inert shell word, and the seat needs a character
#   class, a space or a glob byte inside it. mask_quoted_values swaps each
#   admitted value for the plain word QUOTEDVALUE, and every rule below reads
#   that masked command, so a value can only sit where a plain word could.
#   Admission is default-deny by token shape: the opening quote starts the
#   token or follows one listed head (-S -G -L --grep= --format= --pretty=,
#   with format:/tformat: on the last two), the closing quote ends the token,
#   the body is not empty, and a bare body does not start with `-`, so no flag
#   ever rides in a quote. One exception (ADR 0029 Amendment 2026-11-08): a
#   bare body that starts with `-` right after the word `-e` is masked as
#   DASHQUOTEDVALUE, and the guard admits that word only where the git grep
#   loop reads it as an -e value; anywhere else it denies. A double-quoted
#   body with $ ` \ or ! is refused, and so is any body with the two control
#   bytes audit-tree-fingerprint.sh swaps in. Anything else leaves the command
#   unmasked, and the quote rule denies it by name.
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
#   diff, log, show, merge-base, rev-parse, status, ls-files, ls-tree,
#   cat-file, blame, branch (read forms only — see the per-token loop below),
#   grep (one policed form only — `-F` or `-E` plus one or more `-e <token>`,
#   see the per-token loop below; plan 2026-10-20-rea-artifact-evidence D21,
#   ADR 0029 Amendments 2026-10-22 and 2026-11-08: on Claude Code 2.1.304 no
#   auditor seat had the Grep tool, so this form is the fallback search
#   channel. The `-O` pager hole that kept the verb out stays closed by
#   per-flag policing.)
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
# Only gate war-auditor, war-evidence-auditor and war-helper agents; all others
# pass through. Each arm is suffix-anchored (`*war-auditor`, `*war-evidence-auditor`)
# so it captures the dispatched `<ns>:war-<role>` but not a `war-<role>-helper`
# decoration, which falls through to the fail-open `*) exit 0`. The evidence
# seat has its own arm: `*war-auditor` does not capture
# `<ns>:war-evidence-auditor`, and the seat would otherwise pass through.
# ---------------------------------------------------------------------------
is_helper=0
case "$atype" in
  *war-auditor) ;;
  *war-evidence-auditor) ;;
  *war-helper) is_helper=1 ;;
  *) exit 0 ;;
esac

# deny <reason>: emit WAR: marker on stderr and exit 2. A helper denial names
# the helper policy (PIN-26).
deny() {
  _dm="${1//DASHQUOTEDVALUE/QUOTEDVALUE}"
  _pol=""
  if [ "$is_helper" = 1 ]; then _pol="helper policy: "; fi
  echo "WAR: auditor git guard DENIED: $_pol${_dm//QUOTEDVALUE/<quoted value>}" >&2
  exit 2
}

# ---------------------------------------------------------------------------
# Fail-closed: deny empty or missing command.
# ---------------------------------------------------------------------------
[ -z "$cmd" ] && deny "empty command"

# ---------------------------------------------------------------------------
# EMBEDDED-NEWLINE pre-check (#1828). A newline is outside the char allowlist,
# but the $(...) at the residue assignment below strips trailing newlines, so a
# command whose ONLY out-of-allowlist byte is a newline (`git diff HEAD`,
# newline, `echo pwned`) used to reach the verb parser with an EMPTY residue
# and pass. This pattern match reads $cmd itself, never a $(...) result, so the
# newline survives. Routed to the chain-operator arm's text: a newline joins two
# commands in one Bash call, the same composition shape as && and ;. The
# residue assignment and the classifier below stay byte-unchanged.
# ---------------------------------------------------------------------------
case "$cmd" in
  *$'\n'*)
    deny "command contains forbidden character(s): <newline> — the chain-operator rule fired: the guard admits one bare git command per Bash call: split && / ; chains and continuations into separate calls; filter and search output with the Read/Grep/Glob tools; use git -C <path> in place of cd <path> &&, and -n <count> on log or show in place of | head" ;;
esac

# ---------------------------------------------------------------------------
# QUOTED VALUES: rewrite $cmd with each admitted quoted value masked, or leave
# it untouched so the quote rule below denies the quote. Any return 1 leaves
# $cmd alone: the assignment is the last step. MAX_QUOTED_VALUES bounds the
# peel: each pass copies the rest of the command, and a real seat needs three.
# quote_word holds the refused token's start for the quote rule's message.
# ---------------------------------------------------------------------------
MAX_QUOTED_VALUES=8
quote_word=""
mask_quoted_values() {
  _rem="$cmd"; _out=""; _vals=0
  while :; do
    _pre="${_rem%%[\'\"]*}"
    if [ "$_pre" = "$_rem" ]; then
      cmd="$_out$_rem"
      return 0
    fi
    _qw="${_rem:${#_pre}}"
    quote_word="${_pre##* }${_qw%% *}"
    _mask=QUOTEDVALUE
    _vals=$((_vals + 1))
    [ "$_vals" -le "$MAX_QUOTED_VALUES" ] || return 1
    _q="${_rem:${#_pre}:1}"
    _tail="${_rem:${#_pre}+1}"
    case "$_tail" in *"$_q"*) ;; *) return 1 ;; esac
    _body="${_tail%%"$_q"*}"
    _rem="${_tail:${#_body}+1}"
    [ -n "$_body" ] || return 1
    case "$_rem" in ""|" "*) ;; *) return 1 ;; esac
    case "$_body" in *$'\036'*|*$'\037'*) return 1 ;; esac    # quote_words stand-ins
    if [ "$_q" = '"' ]; then
      case "$_body" in *'$'*|*'`'*|*'\'*|*'!'*) return 1 ;; esac
    fi
    case "${_pre##* }" in
      "") case "$_body" in
            -*)
              # Dash-led: admitted only right after the word -e (PIN-2). The
              # grep loop admits DASHQUOTEDVALUE only as an -e value.
              _pw="${_pre%"${_pre##*[! ]}"}"
              [ "${_pw##* }" = "-e" ] || return 1
              _mask=DASHQUOTEDVALUE ;;
          esac ;;
      -S|-G|-L|--grep=) ;;
      --format=|--format=format:|--format=tformat:) ;;
      --pretty=|--pretty=format:|--pretty=tformat:) ;;
      *) return 1 ;;
    esac
    _out="$_out${_pre}$_mask"
  done
}
quote_refused=0
mask_quoted_values || quote_refused=1

# ---------------------------------------------------------------------------
# HELPER PIPE (PIN-26): the helper policy admits one pipe between two git
# commands, as in `git diff A...B | git patch-id --stable`. The split reads the
# masked command, so a | inside an admitted quoted value is data, not a pipe. A
# refused quote skips the split, and the quote rule below denies it. Each side
# runs this guard again as the same seat: it must be a git command the helper
# policy admits, with its own one -C <path> peel. A side holds no | (two or more
# deny here), so a second pipe never reaches a side. The auditor arms never
# split: their | still denies at the chain-operator rule.
# ---------------------------------------------------------------------------
if [ "$is_helper" = 1 ] && [ "$quote_refused" = 0 ]; then
  case "$cmd" in
    *'|'*)
      _pipes="${cmd//[!|]/}"
      [ "${#_pipes}" = 1 ] || deny "command holds ${#_pipes} pipe bytes: the helper policy admits one pipe between two git commands, never a second pipe or ||"
      for _side in "${cmd%%|*}" "${cmd#*|}"; do
        _rc=0
        jq -nc --arg t "$atype" --arg c "$_side" '{agent_type:$t,tool_input:{command:$c}}' \
          | bash "${BASH_SOURCE[0]}" || _rc=$?
        [ "$_rc" = 0 ] || [ "$_rc" = 2 ] || deny "the pipe side check failed (exit $_rc)"
        [ "$_rc" = 0 ] || exit 2
      done
      exit 0 ;;
  esac
fi

# ---------------------------------------------------------------------------
# CHARACTER ALLOWLIST check (fail-closed).
# Permit only: A-Za-z0-9 SPACE . / _ = : , @ ^ ~ % + -
# Use LC_ALL=C tr -d to extract any character outside the allowed set.
# If residue is non-empty, a forbidden character is present → DENY.
#
# NOTE: We do NOT put a literal newline in the allowlist string — bash 3.2
# strips trailing newlines from $(...) so the pattern would be empty. The same
# stripping erases a newline-ONLY residue, so the allowlist alone never denied
# a newline; the explicit pre-check above owns that deny (#1828).
#
# The deny message NAMES the rule that fired (#1435, #1829, PIN-1). A refused
# quote (quote_refused) names the quote rule and its token, never a residue
# of quote bytes. Otherwise the residue is classified BEFORE the message is
# composed, by byte set plus a word-position test for & and \:
#   - metacharacter: any byte outside the chain and grouping sets (quotes
#     never reach here, glob *, ?, [, ], $, !, backtick, ...), or an & or \
#     inside a word (HEAD:a&b.txt, a\|b). The remedy is the Grep tool's
#     glob:/type: filters, the git grep fallback form, and single-quoting the
#     whole value; the message prints the quoted rewrite of that word.
#   - grouping (redirect, grouping, continuation): < > ( ) { }, a \ that ends
#     a word, and the & of a >& or <& redirect. The remedy is one bare git
#     command per Bash call, a quoted brace value or git log -g; the message
#     prints the quoted rewrite of a word that holds a brace or an inner paren,
#     never of a redirect.
#   - chain-operator: only & ; | bytes, each & either doubled or ending a word
#     (a newline never reaches this classifier: the pre-check above denies
#     every newline-carrying command before the residue assignment, so the \n
#     member of the delete sets is defense in depth only). The remedy is the
#     #1421(b) guidance: split && / ; chains into separate calls, filter and
#     search with Read/Grep/Glob.
# Message text only — the decision, exit code, and routing (char check first,
# before any verb parsing) are byte-unchanged.
# ---------------------------------------------------------------------------
residue="$(printf '%s' "$cmd" | LC_ALL=C tr -d 'A-Za-z0-9 ./_=:,@^~%+-')"
if [ -n "$residue" ]; then
  # Truncated echoes via pure parameter expansion (bash-3.2-safe): a
  # pipeline assignment here would run in errexit context — `head -c 20`
  # exiting early can SIGPIPE `tr` (141), and set -e/pipefail would exit the
  # guard non-2 (fail-open: a non-2 PreToolUse exit does NOT block the tool
  # call). Parameter expansion has no exit status, so deny's exit 2 is the
  # only reachable exit on this path.
  if [ "$quote_refused" = 1 ]; then
    deny "command contains a refused quoted value at: ${quote_word:0:40} — the quote rule fired: a quote must open the token or follow -S, -G, -L, -e, --grep=, --format= or --pretty=, must close the token, holds at most $MAX_QUOTED_VALUES values per command, and a bare value must not start with - unless it is the value of git grep -e; single-quote the whole value: -S'two words', --format='%H %s', 'sha:app/[id]/f', git grep -F -e '- x'; a double-quoted value must not hold a dollar sign, a backtick, a backslash or a bang"
  fi
  residue_echo="${residue//$'\n'/}"
  residue_echo="${residue_echo:0:20}"
  # Byte classes. tr interprets its own '\n' and '\\' escapes, so the tr
  # arguments need no shell-level escape.
  meta_residue="$(printf '%s' "$residue" | LC_ALL=C tr -d '&;|\n<>(){}\\')"
  group_residue="$(printf '%s' "$residue" | LC_ALL=C tr -d '&;|\n')"
  # Word scan: the first word holding a metacharacter byte or an in-word & or
  # \, and the first word holding a grouping byte. The split is safe under
  # set -f; each word is tested with pattern expansions only.
  meta_word=""; group_word=""; inword=0
  set -f
  # shellcheck disable=SC2086
  for _w in $cmd; do
    _wa="${_w//&&/}"; _wa="${_wa//>&/>}"; _wa="${_wa//<&/<}"
    _winword=0
    case "${_wa%&}" in *'&'*) _winword=1 ;; esac
    case "${_w%\\}" in *'\'*) _winword=1 ;; esac
    if [ "$_winword" = 1 ]; then
      inword=1
      [ -n "$meta_word" ] || meta_word="$_w"
    fi
    if [ -n "$meta_residue" ] && [ -z "$meta_word" ]; then
      _wr="$(printf '%s' "$_w" | LC_ALL=C tr -d 'A-Za-z0-9 ./_=:,@^~%+&;|<>(){}\\-')"
      [ -z "$_wr" ] || meta_word="$_w"
    fi
    if [ -z "$group_word" ]; then
      case "$_w" in *'<'*|*'>'*|*'('*|*')'*|*'{'*|*'}'*|*'\') group_word="$_w" ;; esac
    fi
  done
  if [ -n "$meta_residue" ] || [ "$inword" = 1 ]; then
    rewrite=""
    [ -z "$meta_word" ] || rewrite="; quoted rewrite: '${meta_word:0:60}'"
    deny "command contains forbidden character(s): $residue_echo — the metacharacter rule fired: glob/alternation/expansion metacharacters are refused outright; search with the Grep tool (glob:/type: filters) instead of shell grep/git grep; with no Grep tool, git grep -F -e <token> (or -E -e <regex>) is the admitted search form; to pass these bytes to git as data, single-quote the whole value: -G'a[b]c', -S'two words', --format='%H %s', -L '/re/,+3', 'sha:app/[id]/f', -- '*.md'$rewrite"
  elif [ -n "$group_residue" ]; then
    rewrite=""
    case "$group_word" in
      *'<'*|*'>'*|*'\') ;;
      *'{'*|*'}'*) rewrite="; quoted rewrite: '${group_word:0:60}'" ;;
      '('*|')'*|*'('|*')') ;;
      *'('*|*')'*) rewrite="; quoted rewrite: '${group_word:0:60}'" ;;
    esac
    deny "command contains forbidden character(s): $residue_echo — the grouping rule fired: one bare git command per Bash call — no redirect, grouping or continuation; quote a value that holds a brace or bracket: 'HEAD@{1}', or use git log -g; read output with the Read/Grep/Glob tools, never through a redirect$rewrite"
  else
    deny "command contains forbidden character(s): $residue_echo — the chain-operator rule fired: the guard admits one bare git command per Bash call: split && / ; chains and continuations into separate calls; filter and search output with the Read/Grep/Glob tools; use git -C <path> in place of cd <path> &&, and -n <count> on log or show in place of | head"
  fi
fi

# ---------------------------------------------------------------------------
# At this point, the command contains only [A-Za-z0-9 ./_=:,@^~%+-].
# Collapse repeated spaces the way the shell does, so each rule below reads the
# words git receives. The -C peel and the flag scans match single spaces: with
# a double space `git -C  log push` reads as verb log and runs push.
# The unquoted split is safe: no glob byte passes the check above.
# ---------------------------------------------------------------------------
set -f
# shellcheck disable=SC2086
set -- $cmd
cmd="$*"

# ---------------------------------------------------------------------------
# Parse it: must start with 'git ' (or be exactly 'git').
# ---------------------------------------------------------------------------
case "$cmd" in
  git\ *|git) ;;
  *) deny "not a git command; auditors use the Read/Grep/Glob tools for file access (grep: the Grep tool; cat/sed/head: Read; ls/find: Glob; a tool-result file: Read or Grep); with no Grep tool, git grep -F -e <token> (or -E -e <regex>) is the admitted search form" ;;
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
# Read-only global -C <path>: relocate cwd, then validate the subcommand normally.
# -C only changes which repo git runs in; it does NOT add a write verb. The peeled
# $rest re-enters the read-only subcommand allowlist below, so a write subcommand
# after -C still denies (see H3). Single path assumed: a path with a space reaches
# here only as one masked quoted value, one plain word.
# ponytail: one -C peeled. `git -C -C rev-parse HEAD` peels the first -C then leaves
# `rev-parse HEAD` → ALLOW (harmless read in ambient cwd) — NOT a default-deny.
case "$rest" in
  -C\ *\ *)
    rest="${rest#-C }"     # drop "-C "
    rest="${rest#* }"      # drop the <path> token
    ;;
  -C\ *|-C)
    deny "global -C with no path/subcommand" ;;
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
  ls-tree\ *|ls-tree)       subcmd="ls-tree" ;;
  cat-file\ *|cat-file)     subcmd="cat-file" ;;
  blame\ *|blame)           subcmd="blame" ;;
  branch\ *|branch)         subcmd="branch" ;;
  grep\ *|grep)             subcmd="grep" ;;
  "")
    deny "bare 'git' with no subcommand" ;;
  *)
    # Extract first word for a cleaner error message.
    first_word="$(printf '%s' "$rest" | cut -d' ' -f1)"
    # The helper policy adds five relay verbs (PIN-26); fetch stays denied.
    helper_note=""
    if [ "$is_helper" = 1 ]; then
      case "$first_word" in
        ls-remote|rev-list|patch-id|hash-object|cherry) subcmd="$first_word" ;;
      esac
      helper_note="; the helper policy adds ls-remote/rev-list/patch-id/hash-object/cherry, and fetch stays denied for every seat"
    fi
    [ -n "$subcmd" ] || deny "git subcommand '$first_word' is not in the read-only allowlist (diff/log/show/merge-base/rev-parse/status/ls-files/ls-tree/cat-file/blame/branch/grep); for repo-wide search use the Grep tool, or with no Grep tool the admitted form git grep -F -e <token> (or -E -e <regex>)$helper_note" ;;
esac

# A dash-led quoted value (DASHQUOTEDVALUE) is data only as the value of a
# git grep -e; the grep loop below polices its position. On any other verb it
# denies here, so no flag rides in a quote (PIN-2).
if [ "$subcmd" != "grep" ]; then
  case " $rest " in
    *" DASHQUOTEDVALUE "*)
      deny "a quoted value that starts with - is admitted only as the value of git grep -e; on $subcmd drop the leading - or quote a value that does not start with it" ;;
  esac
fi

# ---------------------------------------------------------------------------
# READ-FORM branch enforcement (D4): `branch` is admitted only in read shapes.
# A bare `git branch` (empty rest) lists — allow. With arguments, EVERY token
# must match one of the two read arms below — value-carrying flags =-attached,
# bare read flags enumerated; the first token that
# is a bare name (flagless creation), a write flag (-d/-D/-m/-M/-c/-f/-u/--track/
# --set-upstream-to/…), a combined short cluster (-av), or a space-form value
# (--contains <rev>) denies — WITHOUT enumerating the write flags (default-deny
# by token shape). --format is deliberately absent (the loop denies it by default).
# --list may take one pattern word right after it, bare or quoted (PIN-4); the
# word must not start with -, so `--list -d x` still denies at -d.
# bash-3.2-safe: unquoted `for tok in $branch_rest` word-split is safe here —
# the char allowlist already excludes quotes and glob chars, so no re-split/glob.
# COUPLING: the deny string's two parenthesized flag groups are parsed by the
# extraction-equality test (2026-07-26 spec D6) in
# skills/war/assets/workflow-template.engine-1.test.mjs — reshape both together.
# ---------------------------------------------------------------------------
if [ "$subcmd" = "branch" ]; then
  branch_rest="${rest#branch}"
  branch_rest="${branch_rest# }"
  branch_list=0
  for tok in $branch_rest; do
    if [ "$branch_list" = 1 ]; then
      branch_list=2
      case "$tok" in
        -*) ;;
        *) continue ;;               # the one --list pattern word
      esac
    fi
    case "$tok" in
      --list) [ "$branch_list" != 0 ] || branch_list=1 ;;
      --contains=*|--no-contains=*|--merged=*|--no-merged=*|--points-at=*|--sort=*) ;;
      --all|-a|--remotes|-r|--show-current|--verbose|-v|-vv) ;;
      *)
        deny "git branch admits read forms only: value-carrying flags =-attached (--contains=<rev>, --no-contains=<rev>, --merged=<rev>, --no-merged=<rev>, --points-at=<rev>, --sort=<key>), bare read flags (--list, --all, -a, --remotes, -r, --show-current, --verbose, -v, -vv), and --list may take one pattern word right after it; '$tok' is not one — space-form values and write flags deny" ;;
    esac
  done
fi

# ---------------------------------------------------------------------------
# POLICED-FORM grep enforcement (D21, ADR 0029 Amendments 2026-10-22 and
# 2026-11-08): `grep` is admitted in ONE shape — exactly one selector, `-F`
# (or `--fixed-strings`) or `-E`, plus one or more `-e <token>` — with
# optional `-n -i -l -w -c` (bare, or in a short cluster parsed letter by
# letter), the context counts `-A <n>`, `-B <n>`, `-C <n>` and `-A<n>` (digits
# only, each its own token), at most one bare revision, and an optional
# `-- <pathspec>...` (a glob byte passes only inside a quoted value). Each
# token may be one quoted value (masked above), so `-e 'two words'` is this
# form, and a dash-led quoted value is admitted only as an -e value. EVERY
# other token denies by shape, without enumerating the option space: any
# other long flag (`--open-files-in-pager`, `--no-index`,
# `--recurse-submodules`, `--file`, the long regex selectors), any other
# cluster letter (`O` in `-O`, `-nO`, `-Ovim`; `G`/`P`; `f`; `e` or a count
# letter inside a cluster), a bare pattern without `-e`, `-E` with `-F`, a
# dangling `-e` or count, a non-digit count, a second revision. `-O` is named
# in its deny: it runs an arbitrary pager command, the hole that kept the
# verb out of the allowlist from 2026-07-26 until this per-flag policing.
# The pattern token after `-e` is consumed as data whatever it looks like
# (git does the same), so `-e -O` searches for the literal "-O".
# bash-3.2-safe: the unquoted word-split is safe for the same reason as the
# branch loop above.
# COUPLING: the deny string's opening fragment ("git grep admits one form
# only") and its "-O runs a pager command" clause are pinned by group P and
# group GF of hooks/validate-auditor-git.test.sh, and the D6 grep test in
# skills/war/assets/workflow-template.engine-1.test.mjs reads the string: it
# locates the opening fragment, takes the first "optional " clause as the
# -n/-i/-l/-w/-c list and requires it set-equal to the n|i|l|w|c cluster arm
# below (the first lowercase x|y|z) arm in this file). So the selector and
# context flags ride a later clause without the word "optional" — reshape
# all three together.
# ---------------------------------------------------------------------------
if [ "$subcmd" = "grep" ]; then
  grep_rest="${rest#grep}"
  grep_rest="${grep_rest# }"
  grep_deny() {
    deny "git grep admits one form only: -F (or --fixed-strings) or -E, never both, plus one or more -e <token>, optional -n/-i/-l/-w/-c (bare or in a short cluster), context counts -A <n>, -B <n>, -C <n> or -A<n> as their own tokens with digits only, at most one revision, optional -- <pathspec>...; $1 — -O/--open-files-in-pager runs a pager command and stays denied, as do -f/--file (reads patterns from a file), --no-index (searches outside the repo), --recurse-submodules (leaves the repo), -P (a second regex engine) and -G or the long regex selectors; with no Grep tool this form is the search channel"
  }
  grep_fixed=0
  grep_ext=0
  grep_patterns=0
  grep_expect=0
  grep_count=""
  grep_revs=0
  grep_dashdash=0
  for tok in $grep_rest; do
    if [ "$grep_dashdash" = 1 ]; then
      continue                      # pathspec: git reads it, the shell does not
    fi
    if [ "$grep_expect" = 1 ]; then
      grep_patterns=$((grep_patterns + 1))
      grep_expect=0
      continue                      # the -e value is data, whatever it looks like
    fi
    if [ -n "$grep_count" ]; then
      case "$tok" in
        *[!0-9]*) grep_deny "'$tok' after $grep_count is not a count: context counts take digits only" ;;
      esac
      grep_count=""
      continue
    fi
    case "$tok" in
      --)              grep_dashdash=1 ;;
      --fixed-strings) grep_fixed=1 ;;
      -e)              grep_expect=1 ;;
      -A|-B|-C)        grep_count="$tok" ;;
      DASHQUOTEDVALUE) grep_deny "a quoted value that starts with - is admitted only as the value of git grep -e" ;;
      -A[0-9]*)
        case "${tok#-A}" in
          *[!0-9]*) grep_deny "'$tok' is not -A<n>: -A<n> takes digits only" ;;
        esac ;;
      --*)             grep_deny "'$tok' is not part of that form" ;;
      -?*)
        cluster="${tok#-}"
        while [ -n "$cluster" ]; do
          ch="${cluster:0:1}"
          cluster="${cluster:1}"
          case "$ch" in
            F)         grep_fixed=1 ;;
            n|i|l|w|c) ;;
            E)         grep_ext=1 ;;
            O)         grep_deny "'$tok' carries -O: -O runs a pager command" ;;
            e)         grep_deny "'$tok' carries -e inside a cluster: -e must be its own token" ;;
            A|B|C)     grep_deny "'$tok' carries -$ch inside a cluster: a context count is its own token" ;;
            *)         grep_deny "'$tok' carries -$ch, which is not part of that form" ;;
          esac
        done ;;
      -)               grep_deny "'-' is not part of that form" ;;
      *)
        grep_revs=$((grep_revs + 1))
        if [ "$grep_revs" -gt 1 ]; then
          grep_deny "'$tok' is a second bare token: at most one revision, and the pattern must ride -e"
        fi ;;
    esac
  done
  [ "$grep_expect" = 0 ] || grep_deny "-e has no <token>"
  [ -z "$grep_count" ] || grep_deny "$grep_count has no <n>"
  [ "$grep_fixed$grep_ext" != 11 ] || grep_deny "-E and -F together: pick one selector"
  [ "$grep_fixed$grep_ext" != 00 ] || grep_deny "-F (or --fixed-strings) or -E is missing"
  [ "$grep_patterns" -ge 1 ] || grep_deny "at least one -e <token> is required (found 0)"
fi

# ---------------------------------------------------------------------------
# HELPER RELAY VERBS (PIN-26): only the helper reaches these four loops; the
# extractor admits the five verbs for no other seat. rev-list is a read like
# log and takes the scans below. The other four are default-deny by token
# shape: each admits a short list of exact flags, and every other dash token
# denies, so no abbreviation or short cluster of a write or command-running
# flag gets through.
#   ls-remote   : --heads --tags --refs --exit-code --symref --sort=<key>, one
#                 repository that is a plain word with no ':' (no URL, so no
#                 ext:: or other transport), then ref patterns. -u, --upload-pack
#                 and --exec name a command to run, so every -u, --u and --e
#                 spelling but --exit-code is named in its deny.
#   patch-id    : --stable, --unstable or --verbatim, and nothing else.
#   hash-object : --stdin alone. -w writes an object, and a path argument
#                 can run a configured clean filter.
#   cherry      : -v, --abbrev, --abbrev=<n>, at most three revisions.
# ---------------------------------------------------------------------------
if [ "$subcmd" = "ls-remote" ]; then
  lr_repo=0
  for tok in ${rest#ls-remote}; do
    case "$tok" in
      --heads|--tags|--refs|--exit-code|--symref|--sort=*) ;;
      -u*|--u*|--e*)
        deny "git ls-remote '$tok' is denied: -u, --upload-pack and --exec run a command" ;;
      -*)
        deny "git ls-remote admits --heads, --tags, --refs, --exit-code, --symref and --sort=<key>; '$tok' is not one" ;;
      *)
        if [ "$lr_repo" = 0 ]; then
          lr_repo=1
          case "$tok" in
            *:*|QUOTEDVALUE)
              deny "git ls-remote takes a remote name, never a URL or a quoted value: '$tok'" ;;
          esac
        fi ;;
    esac
  done
fi
if [ "$subcmd" = "patch-id" ]; then
  for tok in ${rest#patch-id}; do
    case "$tok" in
      --stable|--unstable|--verbatim) ;;
      *) deny "git patch-id admits --stable, --unstable or --verbatim only; '$tok' is not one" ;;
    esac
  done
fi
if [ "$subcmd" = "hash-object" ]; then
  for tok in ${rest#hash-object}; do
    case "$tok" in
      --stdin) ;;
      --w*|-w*|-[!-]*w*)
        deny "git hash-object '$tok' is denied: -w writes an object" ;;
      *) deny "git hash-object admits --stdin only; '$tok' is not it" ;;
    esac
  done
fi
if [ "$subcmd" = "cherry" ]; then
  ch_revs=0
  for tok in ${rest#cherry}; do
    case "$tok" in
      -v|--abbrev) ;;
      --abbrev=*)
        case "${tok#--abbrev=}" in
          ""|*[!0-9]*) deny "git cherry '$tok' is not --abbrev=<n>" ;;
        esac ;;
      -*) deny "git cherry admits -v, --abbrev and --abbrev=<n>; '$tok' is not one" ;;
      *)
        ch_revs=$((ch_revs + 1))
        [ "$ch_revs" -le 3 ] || deny "git cherry takes at most three revisions" ;;
    esac
  done
fi

# ---------------------------------------------------------------------------
# Post-subcommand scan: deny --output / --output= / -o / --output-directory
# anywhere in $rest (after the subcommand).
#
# Rationale: git supports --output=<file> and --output-directory=<dir> as
# subcommand-local flags on diff/log/format-patch etc. that WRITE files.
# The leading-position global-flag block above only catches these flags when
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

# ---------------------------------------------------------------------------
# Flags that run a command named in git config or .gitattributes. Same scan as
# above, on the masked $rest. --no-ext-diff and --no-textconv do not match. On
# diff, log, show and blame, --text is -a, not a --textconv abbreviation, and
# those verbs refuse an abbreviated --textconv or --ext-diff. cat-file reads any unique prefix, so
# its own arm denies every --t and --fi spelling. A plain `git diff` or `git
# blame` still honors a configured diff.external and textconv driver, and a
# signature read still honors gpg.program: a seat cannot write that config.
# ---------------------------------------------------------------------------
case "$padded" in
  *' --help '*)
    deny "--help is not permitted: it starts man; read the docs with the Read tool" ;;
esac
exec_deny() {
  deny "--ext-diff, --textconv and --filters are not permitted: each runs a configured command; drop the flag, and on cat-file use git show <rev>:<path>"
}
case "$padded" in
  *' --ext-'*|*' --textc'*|*' --filters'*) exec_deny ;;
esac
if [ "$subcmd" = "cat-file" ]; then
  case "$padded" in
    *' --t'*|*' --fi'*) exec_deny ;;
  esac
fi

# Subcommand is in the allowlist. Allow.
exit 0
