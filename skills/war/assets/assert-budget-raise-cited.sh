#!/usr/bin/env bash
# assert-budget-raise-cited.sh — WAR merge-path Budget-Raise citation floor (A10,
# plan 2026-08-25-engine-reliability-and-filing-fidelity Phase 2 Task 1).
#
# Usage: assert-budget-raise-cited.sh <integration-base> <task-branch> \
#          [--repo <git-dir>]
# (--repo is test-only: points git at a fixture repo; production invokes from the
# task-worktree cwd — the same calling shape as assert-test-in-diff.sh)
#
# The counterweight-enforcer for prompt-surface-budgets.test.mjs's ratchet: that
# suite's header says RAISING any hard/advisory constant requires citing the
# prompt-surface-budgets ADR's justification rule (ADR 0042) in the commit body.
# Nothing machine-checked it — a worker needing headroom could quietly raise a
# ceiling and only audit luck would catch it. This floor makes the citation
# mechanical: a merge range that RAISES any ceiling value in
#   skills/war/assets/prompt-surface-budgets.test.mjs
# must carry a commit trailer of the form
#   Budget-Raise: ADR-0042 <surface> +<bytes>
# on at least one commit in the range.
#
# DETECTION IS DEFAULT-DENY over the budget file's VALUE LINES: every non-comment
# line carrying `hard:`/`advisory:` followed by a number is a ceiling line —
# a FILE_BUDGETS row (`'<path>': { hard: N, advisory: M }`), the
# WORKFLOW_LITERAL_BUDGET const, or any FUTURE sibling constant, with no floor
# edit needed to cover it. A same-line trailing `//` comment is STRIPPED before
# any key/value extraction — an inline note like `// was hard: 79872` can
# neither mask a raise nor fabricate one — and only then are keyed lines
# (quoted-path rows and `const NAME` decls) paired old-vs-new and compared
# numerically; a value line whose key cannot be extracted is classified by
# set-difference over the comment-stripped text — any change to the unkeyed
# value lines is treated as a raise-suspect requiring the trailer (deny, never
# guess).
#
# Exit codes (load-bearing contract, ADR 0006 — 2 NEVER collapses into 1):
#   0 — no ceiling touch, a pure ratchet-down (lowering needs no trailer), a
#       brand-new constant's initial values (nothing was raised), or a raise
#       whose range carries a well-formed Budget-Raise trailer
#   1 — a ceiling raise (or default-deny raise-suspect) with NO Budget-Raise
#       trailer in the range (the named "uncited-raise" route, no-test-style;
#       not an error). stderr names the raised surfaces and the trailer form.
#   2 — git/ref error (HARD error; the diff/log could not be computed; caller
#       must not treat as "no raise found")
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors assert-test-in-diff.sh.
set -u

PROG="assert-budget-raise-cited"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

BUDGET_FILE="skills/war/assets/prompt-surface-budgets.test.mjs"
TRAILER_RE='^Budget-Raise: ADR-0042 [^[:space:]]+ \+[0-9]+[[:space:]]*$'

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <integration-base> <task-branch> [--repo <dir>]"

base="$1"
branch="$2"
shift 2

repo_dir=""
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path"
      repo_dir="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" ;;
    *)  die "unexpected positional argument '$1'" ;;
  esac
done

# ---------------------------------------------------------------------------
# Safety: reject .. traversal in base or branch arguments (mirrors the sibling
# floors — a `..` token typically resolves to a path traversal when the arg
# looks like a filesystem path; fail loud before any git operation).
# ---------------------------------------------------------------------------
case "$base" in
  *..*)  die "base argument contains '..'; refusing to use potentially unsafe ref: $base" ;;
esac
case "$branch" in
  *..*)  die "branch argument contains '..'; refusing to use potentially unsafe ref: $branch" ;;
esac

if [ -n "$repo_dir" ]; then
  git_cmd="git -C $repo_dir"
else
  git_cmd="git"
fi

# ---------------------------------------------------------------------------
# Fast path: did the range touch the budget file at all?
# Three-dot diff scoped to the budget file — exactly what the task branch
# changed relative to the merge-base of <base>. The pathspec is `:(top)`
# anchored: git resolves plain pathspecs against the CURRENT directory prefix,
# while the `git show "$rev:$BUDGET_FILE"` blob reads below are always
# top-of-tree relative — without the anchor a subdirectory invocation would
# match nothing and silently exit 0 (floor bypassed). A git failure here is the
# HARD exit-2 path (refs unresolvable / not a repo), never the floor status.
# ---------------------------------------------------------------------------
touched="$($git_cmd diff --name-only "$base...$branch" -- ":(top)$BUDGET_FILE" 2>/dev/null)" || \
  die "git diff failed for '$base...$branch'" 2

if [ -z "$touched" ]; then
  exit 0
fi

# The old side of the comparison is the merge-base (the three-dot semantics).
merge_base="$($git_cmd merge-base "$base" "$branch" 2>/dev/null)" || \
  die "git merge-base failed for '$base' '$branch'" 2

# ---------------------------------------------------------------------------
# Value-line extraction.
# value_lines <rev> -> the budget file's non-comment lines carrying a
# `hard:`/`advisory:` numeric value at <rev>. A missing file at the rev (e.g.
# the file is brand-new on the branch) yields an empty set — that is data, not
# a git error: the enclosing refs were already validated by diff + merge-base.
# ---------------------------------------------------------------------------
value_lines() {
  $git_cmd show "$1:$BUDGET_FILE" 2>/dev/null \
    | grep -E '(hard|advisory):[[:space:]]*[0-9]' \
    | grep -v '^[[:space:]]*//'
  # grep exits 1 on zero matches; that is an empty set, not a failure.
  return 0
}

# classify_lines: read value lines on stdin; write keyed records
#   <key>\t<field>\t<value>
# for every extractable (key, field) pair, and
#   UNKEYED\t<comment-stripped line>
# for any value line with no recognizable key shape. Key shapes:
#   'path': { hard: N, advisory: M }   -> key = path   (FILE_BUDGETS rows)
#   const NAME = { hard: N, ... }      -> key = NAME   (sibling constants)
# A same-line trailing `//` comment is stripped BEFORE extraction: the sed
# below is POSIX leftmost-longest with a greedy `.*` prefix, so it would bind
# the LAST `hard:`/`advisory:` occurrence on the line — an inline
# `// was hard: <old>` note would otherwise extract the OLD value and silently
# defeat raise detection. Stripping also keeps the UNKEYED set-difference
# comment-insensitive in both directions (a comment can neither mask a raise
# nor fabricate one).
classify_lines() {
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    trimmed="$line"
    while :; do
      case "$trimmed" in
        ' '*)  trimmed="${trimmed# }" ;;
        '	'*) trimmed="${trimmed#	}" ;;
        *) break ;;
      esac
    done
    # Drop any same-line trailing // comment, then trailing whitespace.
    code="${trimmed%%//*}"
    while :; do
      case "$code" in
        *' ')  code="${code% }" ;;
        *'	') code="${code%	}" ;;
        *) break ;;
      esac
    done
    # A line whose hard:/advisory: numeric lived ONLY in the stripped comment
    # carries no ceiling — skip it (it is comment text, not a value line).
    printf '%s\n' "$code" | grep -Eq '(hard|advisory):[[:space:]]*[0-9]' || continue
    key=""
    case "$code" in
      "'"*"'":*)
        key="${code#\'}"
        key="${key%%\'*}" ;;
      const\ *)
        key="${code#const }"
        key="${key%%[ =]*}" ;;
    esac
    if [ -z "$key" ]; then
      printf 'UNKEYED\t%s\n' "$code"
      continue
    fi
    for field in hard advisory; do
      val="$(printf '%s\n' "$code" | sed -nE "s/.*${field}:[[:space:]]*([0-9]+).*/\1/p")"
      if [ -n "$val" ]; then
        printf '%s\t%s\t%s\n' "$key" "$field" "$val"
      fi
    done
  done
}

old_records="$(value_lines "$merge_base" | classify_lines)"
new_records="$(value_lines "$branch" | classify_lines)"

# ---------------------------------------------------------------------------
# Raise detection.
# Keyed: for every (key, field) present on BOTH sides, new > old is a raise.
#   Only-in-new (a brand-new constant) and only-in-old (a deleted row) are not
#   raises — no existing ceiling moved up.
# Unkeyed (default-deny): the unkeyed value-line SETS must be identical; any
#   difference is a raise-suspect — the floor refuses to guess the direction.
# ---------------------------------------------------------------------------
raised=""
if [ -n "$new_records" ]; then
  while IFS='	' read -r key field val; do
    [ -n "$key" ] || continue
    [ "$key" = "UNKEYED" ] && continue
    old_val="$(printf '%s\n' "$old_records" | awk -F'\t' -v k="$key" -v f="$field" \
      '$1==k && $2==f {print $3; exit}')"
    if [ -n "$old_val" ] && [ "$val" -gt "$old_val" ] 2>/dev/null; then
      raised="$raised$key $field: $old_val -> $val (+$((val - old_val)) B)
"
    fi
  done <<EOF
$new_records
EOF
fi

old_unkeyed="$(printf '%s\n' "$old_records" | grep '^UNKEYED	' | sort)" || true
new_unkeyed="$(printf '%s\n' "$new_records" | grep '^UNKEYED	' | sort)" || true
suspect=""
if [ "$old_unkeyed" != "$new_unkeyed" ]; then
  suspect="unkeyed ceiling value line(s) changed — default-deny treats this as a raise
"
fi

if [ -z "$raised" ] && [ -z "$suspect" ]; then
  # No ceiling raised: untouched values, a pure ratchet-down, a new constant's
  # initial values, or a comment-only edit. No trailer owed.
  exit 0
fi

# ---------------------------------------------------------------------------
# A raise (or raise-suspect) exists: the range must carry the trailer.
# ---------------------------------------------------------------------------
bodies="$($git_cmd log --format=%B "$base..$branch" 2>/dev/null)" || \
  die "git log failed for '$base..$branch'" 2

if printf '%s\n' "$bodies" | grep -Eq "$TRAILER_RE"; then
  exit 0
fi

printf '%s: ceiling raise in %s WITHOUT a Budget-Raise trailer (the uncited-raise route):\n' \
  "$PROG" "$BUDGET_FILE" >&2
{
  printf '%s' "$raised"
  printf '%s' "$suspect"
} | while IFS= read -r r; do
  [ -n "$r" ] || continue
  printf '%s:   %s\n' "$PROG" "$r" >&2
done
printf '%s: raising a hard/advisory ceiling requires a commit trailer of the form\n' "$PROG" >&2
printf '%s:   Budget-Raise: ADR-0042 <surface> +<bytes>\n' "$PROG" >&2
printf '%s: on a commit in the range, citing ADR 0042'"'"'s justification rule; lowering (ratchet-down) needs none.\n' "$PROG" >&2
exit 1
