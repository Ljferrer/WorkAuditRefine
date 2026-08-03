#!/usr/bin/env bash
# assert-no-repo-escape.sh — /red-team sandbox-escape detection guard (two modes).
#
# Runs AROUND the verification Workflow (see skills/red-team/SKILL.md): snapshot
# mode immediately BEFORE launch, check mode BETWEEN the Workflow return and the
# gate. Executed probes copy the repo into throwaway sandboxes and run
# destructive git there; a cwd reset between Bash calls or a bare `git push` can
# leak that work back into the REAL repo (recorded escape: memory
# redteam-executed-probe-cwd-reset-hits-real-remote). The hardened
# `git -C <sandbox>` scope-lock in the executed probe preamble is the PREVENTION
# layer; this guard is the DETECTION authority (Layer-2/3 doctrine, ADR 0033).
# A nonzero result quarantines the verdict through the self-confound gate —
# never CLEARED — until the state is clean.
#
# Usage:
#   assert-no-repo-escape.sh --repo <abs-repo-dir> --snapshot <abs-file>   # pre-run
#   assert-no-repo-escape.sh --repo <abs-repo-dir> [--baseline <abs-file>] # post-run
#
# --snapshot and --baseline are mutually exclusive (usage error -> 2). Both must
# be ABSOLUTE paths resolving OUTSIDE the --repo working tree: an in-tree
# artifact would false-trip check (a) below. Containment compares BOTH sides
# physically (`cd … && pwd -P` on the repo dir and on the artifact's parent),
# because macOS `mktemp -d` hands back the `/var/folders/…` symlink alias of
# `/private/var/folders/…` and a one-sided normalization is a silent bypass in
# one direction and a false refusal in the other. A missing artifact parent
# directory is an infra error (2), not a pass.
#
# SNAPSHOT MODE (--snapshot): pre-run local integrity refusal FIRST — the
#   working tree must be porcelain-clean and no local ref may match the check
#   (b1) junk pattern. A hit is exit 1, refusing to baseline pre-existing residue
#   or dirt (the #1244 cross-run collision shape, caught before launch) rather
#   than laundering it into the baseline. Deliberately LOCAL-only: origin is not
#   polled pre-run, so (b2) stays a check-mode floor. Then the full local ref set
#   (`for-each-ref '%(refname) %(objectname)'`) is written to the file; exit 0.
#   A git failure or an unwritable file is 2.
#
# CHECK MODE (default). Checks, given --repo <abs>:
#   (a) `git -C <repo> status --porcelain` must be EMPTY — no stray working-tree
#       files a probe left behind. This half is EXACT for tracked and
#       untracked-but-not-ignored paths (porcelain does not report ignored ones —
#       see the third ceiling in the ponytail below).
#   (b1) no local ref (`for-each-ref`) and (b2) no remote head (`ls-remote
#       --heads origin`, only when an `origin` remote is configured) matches the
#       throwaway-sandbox junk pattern: `refs/heads/redteam-*` or `*-sandbox-*`.
#   (c) WITH --baseline only: the exact ref-diff. a/b1/b2 above remain the
#       unconditional floor; then any ref ADDED, REMOVED, or SHA-MOVED versus the
#       snapshot is an escape (1), naming the delta ref(s) — fully NAME-AGNOSTIC
#       (no allowlist, no pattern; a name exclusion would reintroduce the very
#       heuristic hole the diff exists to close). The diff is scoped to
#       `refs/heads/` and `refs/tags/`. That NAMESPACE scoping is load-bearing,
#       not a softening: `for-each-ref` also covers `refs/remotes/*`, which moves
#       on any background or IDE `git fetch` and is never a probe writing into
#       the repo, and this repo's linked worktrees share one ref store — an
#       unscoped diff would turn ordinary concurrent activity into "escape
#       detected". A missing or unreadable baseline file is 2 (validated at
#       arg-parse time, so an infra fault can never be preempted by, or collapse
#       into, an escape conclusion), never 1 and never a silent pass.
#   Without --baseline, check mode is byte-equivalent to the pre-ref-diff script
#   in exit codes, stdout, and check behavior; the only delta is exactly one
#   stderr advisory naming the heuristic ceiling and the --baseline upgrade.
#
# ponytail: with --baseline the ref half is EXACT, not a heuristic — three
# detection ceilings remain.
#   1. b2 origin-side: a probe pushing an invented (non-pattern) ref name to
#      origin still slips, because the ref-diff half is deliberately LOCAL — a
#      pre-run `ls-remote` would put network flake inside a floor script.
#   2. Refs that predate the first baselined run: a pattern-slipping ref already
#      present when the snapshot is taken is baselined as legitimate. Snapshot
#      mode cannot see it and the pre-run refusal cannot pattern-match it.
#   3. Gitignored leak paths: `git status --porcelain` does not report ignored
#      files, so a probe writing into `node_modules/`, `*.log`, `screenshots/`,
#      `.claude/teams/`, or `war-memory-queries.jsonl` is invisible to check (a),
#      invisible to the snapshot-mode pre-run refusal, and adds no ref for the
#      diff to see. Widening (a) to `--ignored` needs its own back-compat pin and
#      a ruling on legitimately-ignored dirs; it is recorded as the
#      gitignored-leak-paths backstop, not taken here.
# Two things are NOT among those three and must not be counted as ceilings:
#   • OVER-detection — a local branch or tag another session or worktree creates
#     during the run window is a real delta the namespace scoping cannot remove.
#     It is triaged by ACTION-PROVENANCE (SKILL.md Step 4): a delta no probe
#     authored is recorded, not an escape.
#   • A probe that ignores the SCOPE-LOCK preamble and runs a ref-writing sandbox
#     form anyway. The diff firing there is a TRUE POSITIVE about an unsanctioned
#     action, not a miss. (The sanctioned idioms — `git clone --no-hardlinks`,
#     `cp -R` for read/edit-only work, `worktree add --detach` for read-only
#     inspection — write no ref into the target.)
#
# Exit codes (load-bearing floor-family contract; sibling: assert-test-in-diff.sh,
# assert-no-submodule-mutation.sh — the 1-vs-2 boundary routes differently):
#   0 — clean (no stray files, no junk ref, no ref delta) / snapshot written
#   1 — escape detected (stray working-tree file OR junk sandbox ref OR a ref
#       added/removed/moved vs the baseline) / snapshot-mode pre-run residue
#   2 — git error / non-repo / usage or containment error / unreadable baseline —
#       a NON-clean, NON-escape signal the caller must never collapse into 1 or
#       treat as a pass.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
set -euo pipefail

PROG="assert-no-repo-escape"
# die() default exit = 2 (the conservative infra code, per the header exit
# contract), NOT 1. The escape code (1) is emitted ONLY by escape() below — its
# hardcoded `exit 1` IS the detection path. Every die call site passes an explicit
# code (all 2) today; the default only governs a future code-omitting die call,
# which must read as an infra failure (2), never a false escape (1). Locked by
# assert-no-repo-escape.test.sh (source default lock + negative call-site lock).
die()    { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-2}"; }
escape() { printf '%s: escape detected — %s\n' "$PROG" "$1" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
repo_dir=""
snapshot_file=""
baseline_file=""
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path" 2
      repo_dir="$2"; shift 2 ;;
    --snapshot)
      [ $# -ge 2 ] || die "--snapshot requires a path" 2
      snapshot_file="$2"; shift 2 ;;
    --baseline)
      [ $# -ge 2 ] || die "--baseline requires a path" 2
      baseline_file="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" 2 ;;
    *)  die "unexpected positional argument '$1'" 2 ;;
  esac
done

[ -n "$repo_dir" ] || die "usage: $PROG --repo <abs-repo-dir> [--snapshot <abs-file> | --baseline <abs-file>]" 2

# Reject .. traversal (universal guard rule; mirrors siblings). Extended to the
# artifact flags: the containment compare below resolves the artifact's PARENT
# physically (pwd -P), so a '..' in the directory portion is normalized away
# before the compare ever sees it — but a '..' BASENAME, and any path whose
# parent cannot be resolved, are not covered by that resolution. Refusing '..'
# outright keeps the rule uniform with --repo and the sibling floors.
case "$repo_dir" in
  *..*) die "repo argument contains '..'; refusing unsafe path: $repo_dir" 2 ;;
esac
case "$snapshot_file" in
  *..*) die "--snapshot argument contains '..'; refusing unsafe path: $snapshot_file" 2 ;;
esac
case "$baseline_file" in
  *..*) die "--baseline argument contains '..'; refusing unsafe path: $baseline_file" 2 ;;
esac

if [ -n "$snapshot_file" ] && [ -n "$baseline_file" ]; then
  die "--snapshot and --baseline are mutually exclusive (snapshot mode WRITES a baseline; check mode READS one)" 2
fi

# assert_artifact_outside <flag> <path>: the artifact must be absolute and must
# resolve outside the --repo working tree. BOTH sides are resolved PHYSICALLY
# (pwd -P) before comparing — on macOS `mktemp -d` returns the /var/folders/…
# alias of /private/var/folders/…, so a one-sided normalization compares a
# logical path against a physical one and silently mis-answers.
assert_artifact_outside() {
  _flag="$1"
  _path="$2"
  case "$_path" in
    /*) : ;;
    *) die "$_flag path must be ABSOLUTE (a relative path resolves against the caller's cwd, which is not stable): $_path" 2 ;;
  esac
  _repo_norm=""
  _repo_norm="$(cd "$repo_dir" 2>/dev/null && pwd -P)" \
    || die "$_flag containment check: --repo directory does not exist or is not readable: $repo_dir" 2
  _art_dir="$(dirname "$_path")"
  _art_parent=""
  _art_parent="$(cd "$_art_dir" 2>/dev/null && pwd -P)" \
    || die "$_flag path's parent directory does not exist: $_art_dir" 2
  _art_norm="$_art_parent/$(basename "$_path")"
  case "$_art_norm" in
    "$_repo_norm"|"$_repo_norm"/*)
      die "$_flag path resolves INSIDE the --repo working tree ($_repo_norm); an in-tree artifact false-trips the porcelain check: $_art_norm" 2 ;;
  esac
}

[ -z "$snapshot_file" ] || assert_artifact_outside "--snapshot" "$snapshot_file"
[ -z "$baseline_file" ] || assert_artifact_outside "--baseline" "$baseline_file"

# Baseline readability is validated HERE, at arg-parse time, deliberately ahead
# of every check: an infra fault (2) must never be preempted by — or collapse
# into — an escape conclusion (1). Checks a/b1/b2 still run unchanged below as
# the unconditional floor.
if [ -n "$baseline_file" ]; then
  [ -e "$baseline_file" ] || die "--baseline file does not exist (infra error, never a pass): $baseline_file" 2
  [ -f "$baseline_file" ] || die "--baseline path is not a regular file: $baseline_file" 2
  [ -r "$baseline_file" ] || die "--baseline file is not readable: $baseline_file" 2
fi

# ---------------------------------------------------------------------------
# SNAPSHOT MODE: pre-run integrity refusal, then write the baseline.
# ---------------------------------------------------------------------------
if [ -n "$snapshot_file" ]; then
  pre_status=""
  pre_status="$(git -C "$repo_dir" status --porcelain 2>/dev/null)" \
    || die "git status failed for repo '$repo_dir' (not a repo?)" 2
  if [ -n "$pre_status" ]; then
    escape "pre-run residue — the working tree is DIRTY before the run; resolve it, never baseline it:
$pre_status"
  fi

  pre_refs=""
  pre_refs="$(git -C "$repo_dir" for-each-ref --format='%(refname)' 2>/dev/null)" \
    || die "git for-each-ref failed for repo '$repo_dir'" 2
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    case "$ref" in
      refs/heads/redteam-*|*-sandbox-*)
        escape "pre-run residue — junk local ref predates this run (a prior run's leftovers; resolve it, never baseline it): $ref" ;;
    esac
  done <<PRE_REFS
$pre_refs
PRE_REFS

  snap_out=""
  snap_out="$(git -C "$repo_dir" for-each-ref --format='%(refname) %(objectname)' 2>/dev/null)" \
    || die "git for-each-ref (ref-set dump) failed for repo '$repo_dir'" 2
  if ! { printf '%s\n' "$snap_out" > "$snapshot_file"; } 2>/dev/null; then
    die "failed to write the snapshot file (unwritable path?): $snapshot_file" 2
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# CHECK MODE. Without --baseline the ref half is only the name heuristic — say
# so exactly once, on stderr (stdout and the exit contract stay byte-equivalent
# to the pre-ref-diff script).
# ---------------------------------------------------------------------------
if [ -z "$baseline_file" ]; then
  printf '%s: advisory — no --baseline: the ref checks are a NAME HEURISTIC (refs/heads/redteam-*, *-sandbox-*) that a probe-invented ref name slips. Take a pre-run `--snapshot <abs-file>` and re-run with `--baseline <abs-file>` for the exact ref-diff.\n' \
    "$PROG" >&2
fi

# ---------------------------------------------------------------------------
# Check (a): working tree must be clean. A git failure here (non-repo, bad
# path) is exit 2 — NEVER collapsed into the escape (1) or clean (0) signal.
# ---------------------------------------------------------------------------
status_out=""
status_out="$(git -C "$repo_dir" status --porcelain 2>/dev/null)" \
  || die "git status failed for repo '$repo_dir' (not a repo?)" 2

if [ -n "$status_out" ]; then
  escape "stray working-tree file(s):
$status_out"
fi

# ---------------------------------------------------------------------------
# Check (b1): no LOCAL ref matches the junk sandbox pattern.
# ---------------------------------------------------------------------------
local_refs=""
local_refs="$(git -C "$repo_dir" for-each-ref --format='%(refname)' 2>/dev/null)" \
  || die "git for-each-ref failed for repo '$repo_dir'" 2

while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  case "$ref" in
    refs/heads/redteam-*|*-sandbox-*)
      escape "junk local ref: $ref" ;;
  esac
done <<LOCAL_REFS
$local_refs
LOCAL_REFS

# ---------------------------------------------------------------------------
# Check (b2): no REMOTE head on origin matches the junk pattern.
# Only run when an `origin` remote is configured — a repo with no origin has no
# remote to leak onto (benign, not an error). An origin that IS configured but
# whose ls-remote fails (network, bad url) is a git error -> exit 2.
# ---------------------------------------------------------------------------
remotes=""
remotes="$(git -C "$repo_dir" remote 2>/dev/null)" \
  || die "git remote failed for repo '$repo_dir'" 2

has_origin=0
while IFS= read -r rname; do
  [ "$rname" = "origin" ] && has_origin=1
done <<REMOTES
$remotes
REMOTES

if [ "$has_origin" -eq 1 ]; then
  ls_out=""
  ls_out="$(git -C "$repo_dir" ls-remote --heads origin 2>/dev/null)" \
    || die "git ls-remote --heads origin failed for repo '$repo_dir'" 2
  # ls-remote lines: "<sha>\t<refname>"; awk $2 is the refname.
  remote_refs=""
  remote_refs="$(printf '%s\n' "$ls_out" | awk '{print $2}')" || true
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    case "$ref" in
      refs/heads/redteam-*|*-sandbox-*)
        escape "junk ref on origin: $ref" ;;
    esac
  done <<REMOTE_REFS
$remote_refs
REMOTE_REFS
fi

# ---------------------------------------------------------------------------
# Check (c): the exact ref-diff (only with --baseline). Name-agnostic within
# refs/heads/ and refs/tags/ — see the header for why the NAMESPACE scoping is
# load-bearing and why there is no name allowlist inside it.
# ---------------------------------------------------------------------------
if [ -n "$baseline_file" ]; then
  live_dump=""
  live_dump="$(git -C "$repo_dir" for-each-ref --format='%(refname) %(objectname)' 2>/dev/null)" \
    || die "git for-each-ref (ref-diff) failed for repo '$repo_dir'" 2

  # awk pass: the baseline file first (NR==FNR), then the live dump on stdin.
  # Output lines are "added|moved|removed: <refname>", sorted for determinism
  # (awk's `for (r in base)` iteration order is unspecified).
  delta=""
  delta="$(printf '%s\n' "$live_dump" | awk '
    NR == FNR {
      if ($1 ~ /^refs\/heads\// || $1 ~ /^refs\/tags\//) { base[$1] = $2 }
      next
    }
    {
      if ($1 ~ /^refs\/heads\// || $1 ~ /^refs\/tags\//) {
        live[$1] = $2
        if (!($1 in base))       { print "added:   " $1 }
        else if (base[$1] != $2) { print "moved:   " $1 }
      }
    }
    END { for (r in base) if (!(r in live)) print "removed: " r }
  ' "$baseline_file" - | LC_ALL=C sort)" \
    || die "ref-diff failed while reading the baseline '$baseline_file'" 2

  if [ -n "$delta" ]; then
    escape "ref-diff vs baseline '$baseline_file' — ref(s) under refs/heads/ or refs/tags/ changed during the run:
$delta"
  fi
fi

# ---------------------------------------------------------------------------
# Clean: no stray files, no junk ref, no ref delta.
# ---------------------------------------------------------------------------
exit 0
