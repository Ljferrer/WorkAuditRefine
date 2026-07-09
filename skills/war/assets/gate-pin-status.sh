#!/usr/bin/env bash
# gate-pin-status.sh — WAR refiner-side pin-drift classifier (audit-gate-verdict-fidelity D1).
#
# Sibling of assert-test-in-diff.sh: bash-3.2-safe, cwd-independent, --repo test-only.
# Classifies whether the tree the gate ran on (gateHeadSha) legitimately became the
# tree the auditor seat now judges (observedHead), so the pin proof moves from
# per-seat LLM git-reconstruction into one mechanical check the refiner stamps.
#
# Usage: gate-pin-status.sh <gateHeadSha> <observedHead> [--mapped <file-list>] [--repo <git-dir>]
#   (--repo is test-only: points git at a fixture repo; the pipeline invokes from the
#    _refinery cwd. gateHeadSha = the pin the gate ran at; observedHead = the _refinery
#    tip the seat actually judges.)
#
# --mapped is the EXPLICIT per-task changed-file list the PIPELINE ALWAYS PASSES
# (Task 2.1 computes it as `git diff --name-only <task-merge>^1 <task-merge>` — that
# task's OWN files). It is a whitespace-separated list of EXACT repo-root-relative paths
# (same format as `git diff --name-only` on both sides), matched by exact membership
# (NOT glob — unlike assert-test-in-diff.sh's `--pattern` glob-set).
#
# The mapped set is DELIBERATELY NOT the global gate-discovery set: sibling merges in the
# serial queue nearly always add their own test files, so a global test-glob default would
# read every non-final task as STALE-MISMATCH and permanently defuse the provably-unrun
# HARD path this floor exists to protect.
#
# STANDALONE DEFAULT (absent --mapped): the assert-test-in-diff.sh gate-discovery set
# (skills/**/*.test.mjs + repo-wide **/*.test.sh, node_modules/.git/.claude excluded).
# This default is for MANUAL/STANDALONE invocation ONLY — it is NOT what the pipeline
# passes (the pipeline always passes an explicit --mapped list). Kept so a human running
# the script by hand gets a sensible relevance filter mirroring the gate's own discovery.
#
# Exit codes (load-bearing contract — a git/ref ERROR must NEVER collapse into a status):
#   0 — CONFIRMED (gateHeadSha == observedHead) OR BENIGN-ADVANCE (observedHead descends
#       gateHeadSha and none of the mapped files changed in the intervening range; prints
#       the intervening file list as cited evidence)
#   1 — STALE-MISMATCH (observedHead descends gateHeadSha but a mapped file changed since
#       the gate ran, OR gateHeadSha is not an ancestor of observedHead) — the pin proof
#       is stale/void; prints the offending files
#   2 — git/ref error OR the '(integration_sha …)' pin sentinel — CANNOT CONFIRM; the
#       caller treats this as a SOFT cannot-confirm, NEVER a status. Usage/arg errors also
#       exit 2 (they are errors, not classifications).
#
# Malformed refs (including a '..'-bearing ref) route to exit 2 via the rev-parse
# validation below — deliberately NOT an exit-1 die like assert-test-in-diff.sh's `..`
# guard, because here exit 1 is the STALE-MISMATCH status and a ref error must never be
# read as STALE.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors assert-test-in-diff.sh / validate-auditor-git.sh.
set -euo pipefail

PROG="gate-pin-status"
# die default exit is 2 (error), NOT 1: exit 1 is reserved for the STALE-MISMATCH status
# (printed + exited directly below, never via die). Any bare die is therefore an error → 2,
# so a future edit can never accidentally collapse a git/ref error into the STALE status.
die() { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-2}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <gateHeadSha> <observedHead> [--mapped <file-list>] [--repo <git-dir>]"

gate_head="$1"
observed_head="$2"
shift 2

repo_dir=""
mapped_given=0
mapped_value=""

while [ $# -gt 0 ]; do
  case "$1" in
    --mapped)
      [ $# -ge 2 ] || die "--mapped requires a file-list"
      mapped_given=1; mapped_value="$2"; shift 2 ;;
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path"
      repo_dir="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" ;;
    *)  die "unexpected positional argument '$1'" ;;
  esac
done

if [ -n "$repo_dir" ]; then
  git_cmd="git -C $repo_dir"
else
  git_cmd="git"
fi

# ---------------------------------------------------------------------------
# Mapped-set membership.
# ---------------------------------------------------------------------------

# match_sh_suite / match_default: the STANDALONE default set (absent --mapped) — copied
# verbatim from assert-test-in-diff.sh so the standalone default provably mirrors the gate's
# discovery set (skills/**/*.test.mjs + repo-wide **/*.test.sh, node_modules/.git/.claude
# excluded — memory: floor-script-discovery-set-must-mirror-gate-exclusions). NOT what the
# pipeline passes (see header).
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
match_default() {
  p="$1"
  # Pattern 1: skills/**/*.test.mjs (node --test glob, scoped to skills/, depth-agnostic).
  case "$p" in
    skills/*)
      case "$p" in
        *.test.mjs) return 0 ;;
      esac ;;
  esac
  # Pattern 2: **/*.test.sh (bash-suite find, repo-wide).
  match_sh_suite "$p"
}

# is_mapped <path> -> exit 0 iff <path> is in the mapped set.
is_mapped() {
  p="$1"
  if [ "$mapped_given" -eq 1 ]; then
    # Explicit per-task list (the pipeline always passes this): whitespace-separated
    # EXACT repo-root-relative paths. Exact membership, not glob. `set -f` guards the
    # unquoted for-list word-split from pathname-expanding a token that happens to carry
    # a glob metacharacter (the assert-test-in-diff.sh noglob idiom); it does not change
    # the exact `=` comparison.
    _m=1
    set -f
    for tok in $mapped_value; do
      if [ "$p" = "$tok" ]; then _m=0; break; fi
    done
    set +f
    return $_m
  fi
  # Standalone default (absent --mapped): the gate-discovery set. NOT the pipeline path.
  match_default "$p"
}

# ---------------------------------------------------------------------------
# (a) Sentinel + ref validation → exit 2 (cannot confirm; never a status).
# ---------------------------------------------------------------------------
# The pin can legitimately be the '(integration_sha …)' sentinel (pinOrSentinel in
# workflow-template.js emits it for an unrecorded/malformed integration_sha). Detect it
# explicitly for a distinctive diagnostic; a bare rev-parse would also fail on it, but the
# explicit branch gives the caller a clear "sentinel" reason (delete-and-traceable).
case "$gate_head" in
  '(integration_sha'*)
    die "gate-HEAD pin is the '(integration_sha …)' sentinel (unrecorded/malformed pin); cannot confirm pin" 2 ;;
esac

# Validate AND canonicalize both refs with rev-parse --verify (satisfies the contract's
# 'git cat-file -t <sha> fails ⇒ exit 2' — rev-parse --verify is the stronger equivalent:
# it fails on a bad ref, a '..'-bearing ref, or a non-commit object). Canonical shas make
# the CONFIRMED equality check robust to abbreviated-vs-full / ref-name-vs-sha forms.
# `|| true` keeps the failing substitution from tripping set -e; --quiet ⇒ empty on failure.
gate_full="$($git_cmd rev-parse --verify --quiet "${gate_head}^{commit}" 2>/dev/null || true)"
[ -n "$gate_full" ] || die "gate-HEAD sha is not a valid git commit object: $gate_head" 2
observed_full="$($git_cmd rev-parse --verify --quiet "${observed_head}^{commit}" 2>/dev/null || true)"
[ -n "$observed_full" ] || die "observed-HEAD sha is not a valid git commit object: $observed_head" 2

# ---------------------------------------------------------------------------
# (b) CONFIRMED — the gate ran on exactly the tree the seat judges.
# ---------------------------------------------------------------------------
if [ "$gate_full" = "$observed_full" ]; then
  printf 'CONFIRMED\n'
  exit 0
fi

# ---------------------------------------------------------------------------
# Ancestry + intervening diff (shared by (c) and (d)).
# ---------------------------------------------------------------------------
# is-ancestor: exit 0 = ancestor, 1 = not ancestor (a legitimate STALE-MISMATCH), and any
# OTHER code = git error → exit 2 (never collapse into a status). `|| anc=$?` captures the
# code without tripping set -e. (Unreachable in practice after rev-parse validation, but
# coded defensively so dropping the validation can never silently misread an error as
# "not ancestor".)
anc=0
$git_cmd merge-base --is-ancestor "$gate_full" "$observed_full" || anc=$?
if [ "$anc" -gt 1 ]; then
  die "git merge-base --is-ancestor failed for $gate_full $observed_full" 2
fi

# Two-dot diff (per the contract): the net file-set differing between the pin and the
# observed tip. When gateHeadSha is an ancestor this is exactly the intervening range;
# for a diverged pair it is the endpoint tree difference.
intervening="$($git_cmd diff --name-only "$gate_full..$observed_full" 2>/dev/null)" || \
  die "git diff failed for $gate_full..$observed_full" 2

# offending = intervening ∩ mapped set.
offending=""
if [ -n "$intervening" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if is_mapped "$f"; then
      offending="${offending}${f}
"
    fi
  done <<EOF
$intervening
EOF
fi

# ---------------------------------------------------------------------------
# (c) / (d) classify.
# ---------------------------------------------------------------------------
if [ "$anc" -eq 0 ]; then
  # observedHead descends gateHeadSha.
  if [ -z "$offending" ]; then
    # (c) BENIGN-ADVANCE — advance touched none of this task's own files.
    printf 'BENIGN-ADVANCE\n'
    printf 'intervening files (none in the mapped set):\n'
    if [ -n "$intervening" ]; then printf '%s\n' "$intervening"; fi
    exit 0
  fi
  # (d) STALE-MISMATCH — a mapped (task-own) file changed since the gate ran.
  printf 'STALE-MISMATCH\n'
  printf 'mapped file(s) changed since the gate ran at %s:\n' "$gate_full"
  printf '%s' "$offending"
  exit 1
fi

# (d) STALE-MISMATCH — gateHeadSha is not an ancestor of observedHead: the tree the gate
# ran on is not in the observed tip's history, so the gate proof does not apply.
printf 'STALE-MISMATCH\n'
printf 'gate-HEAD %s is not an ancestor of observed-HEAD %s (diverged)\n' "$gate_full" "$observed_full"
if [ -n "$offending" ]; then
  printf 'offending mapped file(s) differing between the trees:\n'
  printf '%s' "$offending"
fi
exit 1
