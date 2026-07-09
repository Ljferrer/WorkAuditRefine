#!/usr/bin/env bash
# assert-guard-specificity-in-diff.sh — WAR guard-specificity floor (D6 mechanical arm,
# plan 2026-07-08-audit-gate-verdict-fidelity Task 1.2).
#
# Sibling of assert-test-in-diff.sh. Catches an anti-cheat blind spot: a task ADDS a new
# early-exit guard (a `die "..."` call, or a `printf/echo "..." >&2` next to an
# `exit`/`return`) to a NON-test file, but no test in the same diff asserts that guard's
# stderr message — so the guard's failure branch is provably unexercised, yet the unit
# gate stays green (the happy path still passes) and the audit reads clean.
#
# Usage: assert-guard-specificity-in-diff.sh <integration-base> <task-branch> \
#          [--repo <git-dir>] [--pattern <glob-set>]
# (--repo is test-only: points git at a fixture repo; production invokes from the
#  task-worktree cwd, exactly like assert-test-in-diff.sh.)
#
# Diff = `git diff -U0 <base>...<branch>` (three-dot symmetric diff; zero context so every
# parsed added line is genuinely new, not surrounding context).
#
# Detection (per ADDED line of a NON-test, non-comment file):
#   - `die "MSG"` / `die 'MSG'`  — the repo's canonical early-exit helper *call* (the
#                                   `die() { ... }` *definition* is skipped, see below).
#   - `... "MSG" ... >&2 ...`     — a stderr-directed quoted message, flagged as a guard when
#                                   an `exit`/`return` is on the SAME added line OR the
#                                   immediately-following added line (adjacency).
# MSG = the first quoted string literal (single or double) after the `die` token, else the
# first quoted literal on the stderr line; a trailing `\n` and surrounding whitespace are
# stripped. Function-definition openers (`name() { ... }`, matched after a whitespace strip
# as `*(){*`) and `#`-comment lines are skipped — the ubiquitous
# `die() { printf ... >&2; exit; }` helper is a definition, not a guard, and must never
# self-flag.
#
# Coverage: for each unique new guard MSG, some TEST file in the same diff must contain MSG
# as a substring in its ADDED lines. The set of files that count as tests is EXACTLY the
# assert-test-in-diff.sh gate-mirror default (skills/**/*.test.mjs ∪ repo-wide **/*.test.sh,
# excluding node_modules/.git/.claude) UNIONED with any --pattern tokens — preserving
# floor ⊆ gate: coverage can only be credited to a test the gate would actually run.
#
# Exit codes (load-bearing contract, mirrors assert-test-in-diff.sh / assert-packaging-in-diff.sh):
#   0 — no new guard, or every new guard message is covered by a same-diff test
#   1 — >=1 uncovered new guard message; each printed as "<defining-file>: <message>" on
#       stdout (the auditor's cited evidence). NOT an error — advisory-evidence only.
#   2 — git/ref error (bad ref, unreadable diff, or a `..` in an argument); NEVER collapsed
#       into 1 — the diff could not be trusted, so the caller treats it as cannot-confirm.
#
# ADVISORY-EVIDENCE: this floor mints NO MergeResult status. Exit 1 is a stamped token the
# refiner surfaces and the auditor turns into a test-fidelity finding (severity/disposition
# the auditor's, ADR 0013) — it never blocks a merge and never widens HARD_ESCALATION_REASONS
# or any status enum (ADR 0005; a heuristic detector must not hard-block). Wiring: Task 2.1.
#
# # ponytail: LINE-BASED SHELL HEURISTIC — documented ceiling, per the assert-packaging-in-diff.sh
# # Dockerfile-parser precedent ([[dockerfile-shell-form-parser-heuristic-ceiling]]). It sees:
# #   - only shell early-exit idioms (die / stderr-emit + exit|return); NOT Node `throw`,
# #     Python `raise`, or any non-shell guard;
# #   - only single-line message literals; a message split across lines, built from a
# #     variable, or whose `>&2`/`exit` are >1 added line apart escapes detection;
# #   - `exit`/`return` matched as space-delimited words on the raw line, so a stderr WARNING
# #     whose message contains the literal word "exit"/"return" may be over-flagged.
# # Upgrade path when a masked guard recurs in the learnings feed: replace the line scan with
# # a shell-aware tokenizer (or per-language guard matchers). Widening the parser is not
# # war-shaped now; the judgment-side gap is a deferred /red-team + test-fidelity duty backstop.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors assert-test-in-diff.sh / assert-packaging-in-diff.sh / provision-worktrees.sh.
set -euo pipefail

PROG="assert-guard-specificity-in-diff"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <integration-base> <task-branch> [--repo <dir>] [--pattern <glob-set>]"

base="$1"
branch="$2"
shift 2

repo_dir=""
custom_pattern=""
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path"
      repo_dir="$2"; shift 2 ;;
    --pattern)
      [ $# -ge 2 ] || die "--pattern requires a glob-set"
      custom_pattern="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" ;;
    *)  die "unexpected positional argument '$1'" ;;
  esac
done

# ---------------------------------------------------------------------------
# Safety: reject .. traversal in base or branch args (mirrors the siblings — a `..`
# token resolves to a relative path traversal when the arg looks like a filesystem path;
# fail loud before any git op). Exit 2 (git/ref error), NOT 1 — a rejected ref is a hard
# error, never the "uncovered guard" signal, so it can never be misread as a finding.
# ---------------------------------------------------------------------------
case "$base" in
  *..*)  die "base argument contains '..'; refusing to use potentially unsafe ref: $base" 2 ;;
esac
case "$branch" in
  *..*)  die "branch argument contains '..'; refusing to use potentially unsafe ref: $branch" 2 ;;
esac

# ---------------------------------------------------------------------------
# git runner: `git -C <repo_dir>` when --repo given, else cwd (like the siblings).
# ---------------------------------------------------------------------------
if [ -n "$repo_dir" ]; then
  GIT() { git -C "$repo_dir" "$@"; }
else
  GIT() { git "$@"; }
fi

# Three-dot -U0 diff. A bad ref makes git fail -> exit 2 (never a "no guard" 0, never a 1).
diff_out="$(GIT diff -U0 "$base...$branch" 2>/dev/null)" || \
  die "git diff failed for '$base...$branch'" 2

# ---------------------------------------------------------------------------
# Test-file matcher — EXACTLY assert-test-in-diff.sh's gate-mirror default, unioned with
# any --pattern token (floor ⊆ gate for the coverage corpus). A file matching here is a
# TEST (its added lines feed the coverage corpus); a non-matching file is a guard SOURCE.
# ---------------------------------------------------------------------------

# match_sh_suite <path> -> 0 iff a *.test.sh bash suite the gate's UNCONDITIONAL discovery
# loop would run: repo-wide, excluding node_modules/.git/.claude (mirrors resolveGate's
# `find . -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*'
#  -not -path '*/.claude/*'`). Unioned into BOTH the default and the custom-pattern branch.
match_sh_suite() {
  p="$1"
  case "$p" in
    node_modules/*|*/node_modules/*) return 1 ;;
    .git/*|*/.git/*)                 return 1 ;;
    .claude/*|*/.claude/*)           return 1 ;;
    *.test.sh)                       return 0 ;;
  esac
  return 1
}

# match_default <path> -> 0 if the path matches the gate's default test patterns.
match_default() {
  p="$1"
  # Pattern 1: skills/**/*.test.mjs (node --test glob, scoped to skills/, depth-agnostic).
  case "$p" in
    skills/*)
      case "$p" in
        *.test.mjs) return 0 ;;
      esac ;;
  esac
  # Pattern 2: **/*.test.sh (repo-wide bash-suite find).
  match_sh_suite "$p"
}

# is_test_file <path> -> 0 iff <path> counts as a test (default set ∪ --pattern).
is_test_file() {
  itf_f="$1"
  if [ -n "$custom_pattern" ]; then
    itf_hit=0
    # `set -f` (noglob) keeps IFS word-splitting while suppressing pathname expansion —
    # without it `for pat in $custom_pattern` would glob-expand a token like `*.test.ts`
    # against the cwd (memory: weak-test-assertion-passes-without-feature-being-exercised).
    set -f
    for pat in $custom_pattern; do
      case "$itf_f" in $pat) itf_hit=1; break ;; esac
    done
    set +f
    if [ "$itf_hit" = 1 ]; then return 0; fi
    # UNION the gate's unconditional *.test.sh discovery arm — floor ⊆ gate survives any
    # --pattern: a *.test.sh suite always counts as a test for coverage.
    if match_sh_suite "$itf_f"; then return 0; fi
    return 1
  fi
  if match_default "$itf_f"; then return 0; fi
  return 1
}

# is_scan_excluded <path> -> 0 iff the path lives under a tree we never scan for guards
# either (node_modules/.git/.claude) — keeps the source side symmetric with the test side.
is_scan_excluded() {
  case "$1" in
    node_modules/*|*/node_modules/*) return 0 ;;
    .git/*|*/.git/*)                 return 0 ;;
    .claude/*|*/.claude/*)           return 0 ;;
  esac
  return 1
}

# ---------------------------------------------------------------------------
# extract_msg <string> -> the FIRST quoted string literal (single or double) in <string>,
# whichever quote opens earlier. Empty if none.
# ---------------------------------------------------------------------------
extract_msg() {
  em_s="$1"
  em_msg=""
  em_pre_dq="${em_s%%\"*}"
  em_pre_sq="${em_s%%\'*}"
  em_has_dq=0
  em_has_sq=0
  if [ "$em_pre_dq" != "$em_s" ]; then em_has_dq=1; fi
  if [ "$em_pre_sq" != "$em_s" ]; then em_has_sq=1; fi
  if [ "$em_has_dq" = 1 ] && [ "$em_has_sq" = 1 ]; then
    if [ "${#em_pre_dq}" -le "${#em_pre_sq}" ]; then
      em_after="${em_s#*\"}"; em_msg="${em_after%%\"*}"
    else
      em_after="${em_s#*\'}"; em_msg="${em_after%%\'*}"
    fi
  elif [ "$em_has_dq" = 1 ]; then
    em_after="${em_s#*\"}"; em_msg="${em_after%%\"*}"
  elif [ "$em_has_sq" = 1 ]; then
    em_after="${em_s#*\'}"; em_msg="${em_after%%\'*}"
  fi
  printf '%s' "$em_msg"
}

# ---------------------------------------------------------------------------
# Parse state (mutated by handle_added_line; globals persist because the read loop below
# uses a heredoc, NOT a pipe — a pipe would run the loop in a subshell and lose the state).
# ---------------------------------------------------------------------------
in_hunk=0
cur_file=""
cur_is_test=0
pending_msg=""     # a stderr message awaiting an exit/return on the NEXT added line
pending_file=""
test_added=""      # newline-joined added lines of every test file (coverage corpus)
guard_hits=""      # newline-joined "<msg>\t<file>" for every detected new guard

TAB="$(printf '\t')"

# record_guard <msg> <file>: normalize <msg> (strip one trailing `\n`, trim) and append.
record_guard() {
  rg_msg="$1"; rg_file="$2"
  rg_msg="${rg_msg%\\n}"                                    # drop one trailing literal \n
  rg_msg="${rg_msg#"${rg_msg%%[![:space:]]*}"}"            # ltrim
  rg_msg="${rg_msg%"${rg_msg##*[![:space:]]}"}"            # rtrim
  [ -n "$rg_msg" ] || return 0
  guard_hits="$guard_hits$rg_msg$TAB$rg_file
"
}

# handle_added_line <content>: classify one added content line.
handle_added_line() {
  hal="$1"
  # left-trim
  lt="${hal#"${hal%%[![:space:]]*}"}"
  if [ -z "$lt" ]; then pending_msg=""; pending_file=""; return 0; fi
  # skip #-comments (a `# die "x"` comment is not a guard, and a test's comment is not
  # a real assertion — exclude from both the guard scan and the coverage corpus).
  case "$lt" in \#*) pending_msg=""; pending_file=""; return 0 ;; esac
  # skip function-definition openers (`name() { ... }`) — the die() helper itself lives
  # here; a definition is never a guard. Whitespace-strip then match `*(){*`.
  hal_nospace="$(printf '%s' "$lt" | tr -d '[:space:]')"
  case "$hal_nospace" in *'(){'*) pending_msg=""; pending_file=""; return 0 ;; esac

  if [ "$cur_is_test" = 1 ]; then
    test_added="$test_added$lt
"
    return 0
  fi

  # --- NON-test file: guard detection ---

  # 1. die "MSG" / die 'MSG' call (not the die() definition, already skipped above).
  hal_is_die=0
  case "$lt" in
    'die "'*|"die '"*|*' die "'*|*" die '"*) hal_is_die=1 ;;
  esac
  if [ "$hal_is_die" = 1 ]; then
    hal_after="${lt#*die }"
    record_guard "$(extract_msg "$hal_after")" "$cur_file"
    pending_msg=""; pending_file=""
    return 0
  fi

  # exit/return present as a space-delimited word? (`;` normalized to space first).
  hal_has_exit=0
  hal_padded=" $(printf '%s' "$lt" | tr ';' ' ') "
  case "$hal_padded" in
    *' exit '*|*' return '*) hal_has_exit=1 ;;
  esac

  # 2. stderr-directed quoted message (`>&2` + a quote).
  hal_has_stderr=0
  case "$lt" in *'>&2'*) hal_has_stderr=1 ;; esac
  if [ "$hal_has_stderr" = 1 ]; then
    hal_msg="$(extract_msg "$lt")"
    if [ -n "$hal_msg" ]; then
      if [ "$hal_has_exit" = 1 ]; then
        record_guard "$hal_msg" "$cur_file"          # exit on same line -> guard now
        pending_msg=""; pending_file=""
      else
        pending_msg="$hal_msg"; pending_file="$cur_file"   # wait for next line's exit
      fi
    else
      pending_msg=""; pending_file=""
    fi
    return 0
  fi

  # 3. exit/return line immediately following a pending stderr message (adjacency).
  if [ "$hal_has_exit" = 1 ] && [ -n "$pending_msg" ]; then
    record_guard "$pending_msg" "$pending_file"
    pending_msg=""; pending_file=""
    return 0
  fi

  # any other line breaks adjacency.
  pending_msg=""; pending_file=""
  return 0
}

# ---------------------------------------------------------------------------
# Single pass over the -U0 diff. File attribution comes from the pre-hunk `+++ b/<path>`
# header; we honor `--- `/`+++ ` as headers ONLY when NOT in a hunk (in_hunk=0), which
# disambiguates them from added/deleted CONTENT lines that happen to start with `+++`/`---`
# (a content line only appears after a `@@`, where in_hunk=1).
# ---------------------------------------------------------------------------
while IFS= read -r line; do
  case "$line" in
    "diff --git "*)
      in_hunk=0; cur_file=""; cur_is_test=0; pending_msg=""; pending_file="" ;;
    "@@"*)
      in_hunk=1; pending_msg=""; pending_file="" ;;    # new hunk breaks adjacency
    *)
      if [ "$in_hunk" -eq 0 ]; then
        case "$line" in
          "+++ "*)
            path="${line#+++ }"
            case "$path" in
              b/*) cur_file="${path#b/}" ;;
              *)   cur_file="" ;;
            esac
            cur_is_test=0
            if [ -n "$cur_file" ]; then
              if is_scan_excluded "$cur_file"; then
                cur_file=""                            # never scan node_modules/.git/.claude
              elif is_test_file "$cur_file"; then
                cur_is_test=1
              fi
            fi ;;
          *) : ;;                                      # other pre-hunk headers: ignore
        esac
      else
        case "$line" in
          "+"*) handle_added_line "${line#+}" ;;       # added content
          *)    : ;;                                   # '-' del / '\' no-newline: ignore
        esac
      fi ;;
  esac
done <<EOF
$diff_out
EOF

# ---------------------------------------------------------------------------
# Coverage: each UNIQUE guard message must appear as a substring in the test corpus.
# ---------------------------------------------------------------------------
uncovered=""
seen=""    # newline-joined messages already reported (dedup on the literal message)
if [ -n "$guard_hits" ]; then
  while IFS="$TAB" read -r gmsg gfile; do
    [ -n "$gmsg" ] || continue
    # dedup: skip a message already emitted (exact-line match against $seen).
    already=0
    if [ -n "$seen" ]; then
      while IFS= read -r s; do
        if [ "$s" = "$gmsg" ]; then already=1; break; fi
      done <<SEEN
$seen
SEEN
    fi
    [ "$already" -eq 0 ] || continue
    seen="$seen$gmsg
"
    # covered iff the corpus contains the message as a LITERAL substring (quoted -> no glob).
    case "$test_added" in
      *"$gmsg"*) ;;                                   # covered
      *) uncovered="$uncovered$gfile: $gmsg
" ;;
    esac
  done <<EOF
$guard_hits
EOF
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [ -n "$uncovered" ]; then
  printf '%s' "$uncovered"             # "<file>: <message>" lines (already newline-terminated)
  exit 1
fi
exit 0
