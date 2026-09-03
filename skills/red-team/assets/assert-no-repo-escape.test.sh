#!/usr/bin/env bash
# Tests for assert-no-repo-escape.sh — /red-team sandbox-escape guard (both modes).
#
# Each case runs from a fresh mktemp cwd (memory relative-path-test-needs-clean-cwd)
# against a fresh temp git repo. Snapshot/baseline artifacts are ALWAYS created in a
# separate mktemp dir (artifact_path below), never inside the target repo's working
# tree — the guard refuses an in-tree artifact (cases 14/15) precisely because such a
# file would false-trip its own porcelain check. macOS bash 3.2.57 compatible.
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Residual detection ceilings — mirrors the script's ponytail. No case below can
# assert these away; they are recorded so a reader does not mistake the suite's green
# for total coverage:
#   • b2 origin-side: a probe pushing an INVENTED (non-pattern) ref name to origin
#     still slips, because the ref-diff half is deliberately local-only.
#   • Pattern-slipping refs that PREDATE the first baselined run: already present when
#     the snapshot is taken, so the diff baselines them as legitimate.
#   • Gitignored leaks WITHOUT a --baseline, and ignored files that PREDATE the
#     snapshot. Check (d) diffs the live ignored FILE set against the baselined one, so
#     a new ignored file reds (cases 29 and 32) — but a baseline is required, residue
#     already present at snapshot time is baselined as legitimate (case 33), and a path
#     under the run-authored allowlist is never reported (case 31).
#
# Cases:
#   CHECK MODE — pre-existing behavior (byte-equivalent without --baseline):
#   1.  clean repo (no origin) -> exit 0
#   2.  stray working-tree file (porcelain non-empty) -> exit 1
#   3a. junk LOCAL ref matching refs/heads/redteam-* -> exit 1
#   3b. junk LOCAL ref matching *-sandbox-* -> exit 1
#   4.  junk ref on a STUBBED origin remote (no local junk ref) -> exit 1
#   5.  non-repo / git error -> exit 2 (asserted != 1 — the boundary never collapses)
#   6.  .. traversal in --repo -> exit 2 (guard rule)
#   7.  CONTROL: benign local ref name, clean tree, no origin -> exit 0
#       (delete-and-trace: proves the junk pattern is specific, not match-all —
#        widening it to '*' flips this to 1)
#   8.  CONTROL: origin with only a benign head -> exit 0
#       (delete-and-trace: proves the remote arm is pattern-specific, not
#        "any remote ref = escape")
#   9.  SOURCE LOCK: die() definition carries the ${2:-2} default (infra code),
#       not ${2:-1} — no call site omits the code today, so this is the only way
#       to prove the default itself against a silent revert.
#   10. CALL-SITE LOCK: every `die "..."` invocation in the guard (definition and
#       comment lines excluded) passes an explicit exit code — the §4.4 one-time
#       manual sweep made a permanent standing guard.
#   SNAPSHOT MODE (--snapshot):
#   11. clean repo -> exit 0, and the file carries "<refname> <objectname>" lines
#   12. PRE-RUN REFUSAL (ref arm): a b1-pattern local ref already present -> exit 1,
#       and NO snapshot file is written (residue is never laundered into a baseline)
#   13. PRE-RUN REFUSAL (porcelain arm): a stray working-tree file -> exit 1, no file
#   ARGUMENT / CONTAINMENT LAYER (runs before any check):
#   14. --snapshot resolving inside the --repo working tree -> exit 2
#   15. --baseline resolving inside the --repo working tree -> exit 2
#   16. relative --snapshot path -> exit 2
#   17. --snapshot combined with --baseline -> exit 2 (usage error)
#   18. '..' inside an ABSOLUTE --snapshot / --baseline path -> exit 2 (the traversal
#       refusal, extended to both new flags)
#   REF-DIFF (check mode with --baseline):
#   19. identical pre/post ref set + clean tree -> exit 0, and the no-baseline stderr
#       advisory is ABSENT under --baseline
#   20. #1244 DEMONSTRATED RED (half 1): pattern-slipping `rogue` branch, NO --baseline
#       -> exit 0 with the stderr advisory present exactly once, naming the heuristic
#       ceiling, the --baseline upgrade, and the ignored half being off
#   21. #1244 DEMONSTRATED RED (half 2): same fixture WITH --baseline -> exit 1
#   22. moved sibling-branch SHA -> exit 1
#   23. deleted ref -> exit 1
#   24. NAMESPACE EXCLUSION: a refs/remotes/* delta -> exit 0
#   25. NAMESPACE INCLUSION: a created refs/tags/* ref -> exit 1
#   26. --baseline pointing at a missing file -> exit 2 (asserted != 1)
#   27. ORDERING: a missing --baseline on a repo that WOULD escape -> exit 2, not 1
#       (an infra fault is never preempted by an escape conclusion)
#   28. zero-byte --baseline file -> exit 2, asserted explicitly != 1 — the awk
#       NR==FNR degeneracy pin, case 26's missing-file sibling
#   29. gitignored-path leak with --baseline -> exit 1 naming the leaked path — the
#       check (d) ignored-file diff (this case's ceiling pin was FLIPPED by the
#       widening; it asserted exit 0 before)
#   30. ORDERING PIN: a zero-byte --baseline on a repo that WOULD escape on check (b1)
#       -> exit 2 with the zero-byte message — arg-parse infra validation outranks
#       escape detection, which case 28's non-escaping `rogue` fixture cannot pin
#   IGNORED-FILE DIFF (check (d), --baseline only):
#   31. ALLOWLIST CONTROL: the only new ignored file sits under a run-authored
#       allowlist pattern (.claude/red-team/) -> exit 0
#   32. a NEW file inside a directory the baseline ALREADY listed files under -> exit 1
#       naming the new file (the `git status --porcelain --ignored` blind spot)
#   33. PRE-EXISTING RESIDUE CONTROL: an ignored file present BEFORE the snapshot ->
#       snapshot exits 0 (residue is baselined, never refused) and check stays exit 0
#   34. BACK-COMPAT CONTROL: an OLD-FORMAT baseline with no ignored section makes the
#       ignored half vacuous -> exit 0 even with a live leak
#   35. SOURCE LOCK: the ignored half's four git/read failure paths each die with their
#       own message (unreachable behaviorally — `git status` dies first on a non-repo)
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-no-repo-escape.sh"

PASS=0
FAIL=0
TMPFILES=""

pass() { printf 'ok - %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf 'FAIL - %s\n' "$1" >&2; FAIL=$((FAIL + 1)); }

cleanup() {
  for d in $TMPFILES; do
    rm -rf "$d"
  done
}
trap cleanup EXIT

# setup_repo: fresh git repo with one commit; echo its path.
setup_repo() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $T"
  git -C "$T" init -q
  git -C "$T" config user.email war@test.local
  git -C "$T" config user.name "WAR Test"
  git -C "$T" config commit.gpgsign false
  printf 'seed\n' > "$T/seed.txt"
  git -C "$T" add seed.txt
  git -C "$T" commit -qm "seed"
  printf '%s\n' "$T"
}

# fresh_cwd: a clean mktemp dir to run the guard from (cwd-independence).
fresh_cwd() {
  C="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $C"
  printf '%s\n' "$C"
}

# artifact_path <name>: an ABSOLUTE path for a snapshot/baseline file, inside a fresh
# mktemp dir — by construction outside every target repo's working tree, which the
# guard's containment check requires (cases 14/15 pin the refusal of an in-tree one).
artifact_path() { printf '%s/%s\n' "$(fresh_cwd)" "$1"; }

# run_guard <repo>: run the guard from a clean cwd; echo the exit code.
run_guard() {
  _cwd="$(fresh_cwd)"
  _rc=0
  ( cd "$_cwd" && bash "$SCRIPT" --repo "$1" ) >/dev/null 2>&1 || _rc=$?
  printf '%s\n' "$_rc"
}

# run_guard_args <args...>: run_guard's arbitrary-argument sibling (run_guard is fixed to
# the --repo-only form the pre-existing cases use). Echoes the exit code; output discarded.
run_guard_args() {
  _cwd="$(fresh_cwd)"
  _rc=0
  ( cd "$_cwd" && bash "$SCRIPT" "$@" ) >/dev/null 2>&1 || _rc=$?
  printf '%s\n' "$_rc"
}

# run_guard_err <stderr-file> <args...>: like run_guard_args, but the guard's stderr is
# kept at <stderr-file> for inspection. Both other runners DISCARD all output, so the
# advisory assertions (absent in case 19, present exactly once in case 20) are only
# possible through this variant.
run_guard_err() {
  _errf="$1"; shift
  _cwd="$(fresh_cwd)"
  _rc=0
  ( cd "$_cwd" && bash "$SCRIPT" "$@" ) >/dev/null 2>"$_errf" || _rc=$?
  printf '%s\n' "$_rc"
}

# take_snapshot <repo> <snap-file> <case-label>: pre-run snapshot for a ref-diff case. A
# nonzero here is a bad FIXTURE, not the behavior under test, so it is reported against
# that case rather than silently producing a vacuous baseline.
take_snapshot() {
  _snap_rc="$(run_guard_args --repo "$1" --snapshot "$2")"
  if [ "$_snap_rc" -ne 0 ]; then
    fail "$3: FIXTURE — pre-run snapshot expected exit 0, got $_snap_rc"
  fi
}

# ---------------------------------------------------------------------------
# Case 1: clean repo (no origin) -> exit 0
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
rc1="$(run_guard "$R1")"
if [ "$rc1" -eq 0 ]; then
  pass "case 1: clean repo -> exit 0"
else
  fail "case 1: clean repo -> expected exit 0, got $rc1"
fi

# ---------------------------------------------------------------------------
# Case 2: stray working-tree file (porcelain non-empty) -> exit 1
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
printf 'leaked\n' > "$R2/stray-sandbox-artifact.txt"   # untracked stray file
rc2="$(run_guard "$R2")"
if [ "$rc2" -eq 1 ]; then
  pass "case 2: stray working-tree file -> exit 1"
else
  fail "case 2: stray working-tree file -> expected exit 1, got $rc2"
fi

# ---------------------------------------------------------------------------
# Case 3a: junk LOCAL ref matching refs/heads/redteam-* -> exit 1
# Create the branch WITHOUT checkout so the working tree stays clean — this
# isolates the local-ref arm from the porcelain arm.
# ---------------------------------------------------------------------------
R3A="$(setup_repo)"
git -C "$R3A" branch redteam-probe-123 2>/dev/null
rc3a="$(run_guard "$R3A")"
if [ "$rc3a" -eq 1 ]; then
  pass "case 3a: junk local ref (redteam-*) -> exit 1"
else
  fail "case 3a: junk local ref (redteam-*) -> expected exit 1, got $rc3a"
fi

# ---------------------------------------------------------------------------
# Case 3b: junk LOCAL ref matching *-sandbox-* -> exit 1
# ---------------------------------------------------------------------------
R3B="$(setup_repo)"
git -C "$R3B" branch probe-sandbox-9 2>/dev/null
rc3b="$(run_guard "$R3B")"
if [ "$rc3b" -eq 1 ]; then
  pass "case 3b: junk local ref (*-sandbox-*) -> exit 1"
else
  fail "case 3b: junk local ref (*-sandbox-*) -> expected exit 1, got $rc3b"
fi

# ---------------------------------------------------------------------------
# Case 4: junk ref on a STUBBED origin remote -> exit 1
# Push a junk branch to a stubbed origin, then DELETE the local junk branch so
# only the remote carries it — isolates the remote (b2 ls-remote) arm from the
# local (b1 for-each-ref) arm. Working tree stays clean, so the porcelain arm is
# inert too. NOTE: `git push` also writes the remote-tracking ref
# refs/remotes/origin/redteam-sandbox-leak, which b1's unpatterned for-each-ref
# enumerates; `branch -D` only removes refs/heads/*, so we must also drop the
# remote-tracking ref or b1 would fire first and b2 would get zero coverage.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
ORIGIN4="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $ORIGIN4"
git -C "$ORIGIN4" init -q --bare
git -C "$R4" remote add origin "$ORIGIN4"
git -C "$R4" branch redteam-sandbox-leak 2>/dev/null
git -C "$R4" push -q origin redteam-sandbox-leak 2>/dev/null
git -C "$R4" branch -D redteam-sandbox-leak >/dev/null 2>&1   # drop LOCAL heads/ copy
git -C "$R4" update-ref -d refs/remotes/origin/redteam-sandbox-leak >/dev/null 2>&1  # drop remote-tracking copy so ONLY b2 can fire
rc4="$(run_guard "$R4")"
if [ "$rc4" -eq 1 ]; then
  pass "case 4: junk ref on stubbed origin (local copy dropped) -> exit 1"
else
  fail "case 4: junk ref on stubbed origin -> expected exit 1, got $rc4"
fi

# ---------------------------------------------------------------------------
# Case 5: non-repo / git error -> exit 2 (asserted != 1 — boundary never collapses)
# ---------------------------------------------------------------------------
NOTREPO="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $NOTREPO"
rc5="$(run_guard "$NOTREPO")"
if [ "$rc5" -eq 2 ]; then
  pass "case 5: non-repo -> exit 2 (not 1 — correctness boundary)"
else
  fail "case 5: non-repo -> expected exit 2, got $rc5 (2-vs-1 boundary violated)"
fi

# ---------------------------------------------------------------------------
# Case 6: .. traversal in --repo -> exit 2 (guard rule)
# ---------------------------------------------------------------------------
_cwd6="$(fresh_cwd)"
rc6=0
( cd "$_cwd6" && bash "$SCRIPT" --repo "../evil" ) >/dev/null 2>&1 || rc6=$?
if [ "$rc6" -eq 2 ]; then
  pass "case 6: .. traversal in --repo -> exit 2"
else
  fail "case 6: .. traversal in --repo -> expected exit 2, got $rc6"
fi

# ---------------------------------------------------------------------------
# Case 7: CONTROL — benign local ref, clean tree, no origin -> exit 0
# Delete-and-trace: proves the junk pattern is specific. Widen the case globs in
# the script to '*' and this flips to 1.
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
git -C "$R7" branch feature-normal-work 2>/dev/null
rc7="$(run_guard "$R7")"
if [ "$rc7" -eq 0 ]; then
  pass "case 7: CONTROL benign local ref -> exit 0 (pattern is specific)"
else
  fail "case 7: CONTROL benign local ref -> expected exit 0, got $rc7"
fi

# ---------------------------------------------------------------------------
# Case 8: CONTROL — origin with only a benign head -> exit 0
# Delete-and-trace: proves the remote arm is pattern-specific, not "any remote
# ref = escape". Drop the pattern guard on the remote arm and this flips to 1.
# ---------------------------------------------------------------------------
R8="$(setup_repo)"
ORIGIN8="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $ORIGIN8"
git -C "$ORIGIN8" init -q --bare
git -C "$R8" remote add origin "$ORIGIN8"
# Push the current (benign) branch to origin.
_cur8="$(git -C "$R8" rev-parse --abbrev-ref HEAD)"
git -C "$R8" push -q origin "$_cur8" 2>/dev/null
rc8="$(run_guard "$R8")"
if [ "$rc8" -eq 0 ]; then
  pass "case 8: CONTROL benign origin head -> exit 0 (remote arm is specific)"
else
  fail "case 8: CONTROL benign origin head -> expected exit 0, got $rc8"
fi

# ---------------------------------------------------------------------------
# Case 9: SOURCE LOCK — die() default exit substitution is ${2:-2} (the infra
# code), not ${2:-1}. A behavioral exercise is impossible today because every die
# call site passes an explicit code (case 10 locks that), so this source-level
# assertion is the only guard against a silent revert of the default itself (#812):
# ${2:-1} would let a code-omitting die misreport an infra failure (2) as an
# escape (1). Delete-and-trace: reverting the source to ${2:-1} flips this to FAIL.
# ---------------------------------------------------------------------------
die_def_line="$(grep '^die()' "$SCRIPT" || true)"
if printf '%s\n' "$die_def_line" | grep -qF '${2:-2}'; then
  pass "case 9: die() default exit substitution is \${2:-2} (infra code)"
else
  fail "case 9: die() must default to \${2:-2}; definition line was: $die_def_line"
fi

# ---------------------------------------------------------------------------
# Case 10: STANDING NEGATIVE CALL-SITE LOCK — every `die "..."` invocation in the
# guard script (the die() definition line and comment lines excluded) MUST pass an
# explicit trailing exit code. Converts the spec §4.4 one-time manual sweep into a
# permanent guard: a future code-omitting die call — silently taking the ${2:-2}
# default — is a RED test here, not a diff-review hope. Every call site passes an
# explicit 2 today; the live count is echoed in the pass line rather than frozen in
# this comment, so growing the guard never stales the banner. Delete-and-trace: drop
# the trailing code from any call site and this flips to FAIL.
# Ceiling: detection strips to the message's closing (last) double-quote and
# requires a digit after it; exact for this script (messages quote internals with
# ' and carry no escaped "). An embedded escaped " would need a real parser.
# ---------------------------------------------------------------------------
callsite_offenders=""
callsite_seen=0
while IFS= read -r _line; do
  [ -n "$_line" ] || continue
  callsite_seen=$((callsite_seen + 1))
  _after="${_line##*\"}"                 # text after the message's closing quote
  case "$_after" in
    *[0-9]*) : ;;                        # explicit exit code present -> OK
    *) callsite_offenders="$callsite_offenders
    $_line" ;;
  esac
done <<CALLSITES
$(grep 'die "' "$SCRIPT" | grep -v '^[[:space:]]*#')
CALLSITES
if [ "$callsite_seen" -lt 1 ]; then
  fail "case 10: no die call sites found in $SCRIPT (lock would be vacuous)"
elif [ -z "$callsite_offenders" ]; then
  pass "case 10: all $callsite_seen die call site(s) pass an explicit exit code"
else
  fail "case 10: die call site(s) missing an explicit exit code:$callsite_offenders"
fi

# ===========================================================================
# SNAPSHOT MODE (--snapshot)
# ===========================================================================

# ---------------------------------------------------------------------------
# Case 11: snapshot mode on a clean repo -> exit 0, and the written file carries
# "<refname> <objectname>" lines (the ref-diff's whole input; a snapshot of bare
# refnames would silently make every SHA-move case in this suite undetectable).
# ---------------------------------------------------------------------------
R11="$(setup_repo)"
SNAP11="$(artifact_path snap.txt)"
rc11="$(run_guard_args --repo "$R11" --snapshot "$SNAP11")"
if [ "$rc11" -ne 0 ]; then
  fail "case 11: snapshot on clean repo -> expected exit 0, got $rc11"
elif [ ! -f "$SNAP11" ]; then
  fail "case 11: snapshot mode exited 0 but wrote no file at $SNAP11"
elif grep -qE '^refs/heads/[^ ]+ [0-9a-f]{7,}$' "$SNAP11"; then
  pass "case 11: snapshot mode -> exit 0, file carries refname+objectname lines"
else
  fail "case 11: snapshot file lacks a '<refname> <objectname>' line; content was: $(cat "$SNAP11")"
fi

# ---------------------------------------------------------------------------
# Case 12: PRE-RUN REFUSAL (ref arm) — a b1-pattern local ref already present when
# the snapshot is taken is exit 1: it is a PRIOR run's residue (the #1244 cross-run
# collision shape), and baselining it would launder it into "legitimate" for the
# whole run. Also asserts NO file is written — the refusal must not leave a
# half-trusted baseline behind for a later --baseline invocation to read.
# ---------------------------------------------------------------------------
R12="$(setup_repo)"
git -C "$R12" branch redteam-leftover-from-a-prior-run 2>/dev/null
SNAP12="$(artifact_path snap.txt)"
rc12="$(run_guard_args --repo "$R12" --snapshot "$SNAP12")"
if [ "$rc12" -ne 1 ]; then
  fail "case 12: snapshot on repo with pre-existing junk ref -> expected exit 1, got $rc12"
elif [ -f "$SNAP12" ]; then
  fail "case 12: refused snapshot must write NO baseline file, but $SNAP12 exists"
else
  pass "case 12: pre-run refusal (junk ref predates run) -> exit 1, no baseline written"
fi

# ---------------------------------------------------------------------------
# Case 13: PRE-RUN REFUSAL (porcelain arm) — a dirty working tree before launch is
# exit 1 for the same reason: post-run check (a) compares against "clean", so
# pre-existing dirt must be resolved, never baselined.
# ---------------------------------------------------------------------------
R13="$(setup_repo)"
printf 'pre-existing dirt\n' > "$R13/uncommitted.txt"
SNAP13="$(artifact_path snap.txt)"
rc13="$(run_guard_args --repo "$R13" --snapshot "$SNAP13")"
if [ "$rc13" -ne 1 ]; then
  fail "case 13: snapshot on dirty repo -> expected exit 1, got $rc13"
elif [ -f "$SNAP13" ]; then
  fail "case 13: refused snapshot must write NO baseline file, but $SNAP13 exists"
else
  pass "case 13: pre-run refusal (dirty working tree) -> exit 1, no baseline written"
fi

# ===========================================================================
# ARGUMENT / CONTAINMENT LAYER (runs before any check)
# ===========================================================================

# ---------------------------------------------------------------------------
# Case 14: a --snapshot path resolving INSIDE the --repo working tree -> exit 2.
# An in-tree artifact would false-trip the guard's own porcelain check.
# This case is also the two-sided-normalization pin: `setup_repo` uses mktemp -d,
# which on macOS returns the /var/folders/... SYMLINK ALIAS of /private/var/folders/...
# The guard resolves the repo dir AND the artifact's parent with `pwd -P` before the
# prefix compare; normalize only the artifact side and this exact case goes GREEN-when-
# it-should-be-2 (physical artifact vs logical repo prefix never matches).
# ---------------------------------------------------------------------------
R14="$(setup_repo)"
rc14="$(run_guard_args --repo "$R14" --snapshot "$R14/in-tree-snap.txt")"
if [ "$rc14" -eq 2 ]; then
  pass "case 14: --snapshot inside the repo tree -> exit 2 (both sides resolved physically)"
else
  fail "case 14: --snapshot inside the repo tree -> expected exit 2, got $rc14"
fi

# ---------------------------------------------------------------------------
# Case 15: a --baseline path resolving INSIDE the --repo working tree -> exit 2.
# Same containment rule; asserted on the other flag so a one-flag implementation reds.
# ---------------------------------------------------------------------------
R15="$(setup_repo)"
printf 'refs/heads/main 0000000000000000000000000000000000000000\n' > "$R15/in-tree-base.txt"
git -C "$R15" add in-tree-base.txt >/dev/null 2>&1
git -C "$R15" commit -qm "in-tree baseline"   # committed, so porcelain stays clean
rc15="$(run_guard_args --repo "$R15" --baseline "$R15/in-tree-base.txt")"
if [ "$rc15" -eq 2 ]; then
  pass "case 15: --baseline inside the repo tree -> exit 2"
else
  fail "case 15: --baseline inside the repo tree -> expected exit 2, got $rc15"
fi

# ---------------------------------------------------------------------------
# Case 16: a RELATIVE --snapshot path -> exit 2. The guard is invoked from whatever
# cwd the Lead happens to hold and the Bash tool resets cwd between calls, so a
# relative artifact path is unresolvable in principle, not merely inconvenient.
# ---------------------------------------------------------------------------
R16="$(setup_repo)"
rc16="$(run_guard_args --repo "$R16" --snapshot "relative-snap.txt")"
if [ "$rc16" -eq 2 ]; then
  pass "case 16: relative --snapshot path -> exit 2"
else
  fail "case 16: relative --snapshot path -> expected exit 2, got $rc16"
fi

# ---------------------------------------------------------------------------
# Case 17: --snapshot combined with --baseline -> exit 2 (usage error). The modes
# are opposites — snapshot WRITES a baseline, check READS one — so a combined
# invocation has no coherent meaning and must never silently pick one.
# Non-vacuity: the --baseline file here is a REAL snapshot, deliberately not a
# nonexistent path. Point it at a missing file and this case passes for the wrong
# reason — the missing-baseline die (case 26) supplies the 2, and deleting the
# exclusivity check entirely leaves the suite green (measured). With a valid
# baseline, deleting that check makes snapshot mode win and return 0, so this reds.
# ---------------------------------------------------------------------------
R17="$(setup_repo)"
SNAP17="$(artifact_path snap.txt)"
take_snapshot "$R17" "$SNAP17" "case 17"
rc17="$(run_guard_args --repo "$R17" --snapshot "$(artifact_path other.txt)" --baseline "$SNAP17")"
if [ "$rc17" -eq 2 ]; then
  pass "case 17: --snapshot + --baseline combined -> exit 2 (usage error)"
else
  fail "case 17: --snapshot + --baseline combined -> expected exit 2, got $rc17"
fi

# ---------------------------------------------------------------------------
# Case 18: '..' inside an ABSOLUTE artifact path -> exit 2, on both new flags.
# Non-vacuity: both paths are absolute AND resolve outside the repo, so containment
# alone lets them through — only the extended traversal refusal catches them. The
# --baseline path resolves (via '..') to a REAL snapshot of this very repo: point it
# at a missing file instead and this half passes for the wrong reason — the
# missing-baseline die (case 26) supplies the same 2 (case 17's own warning, applied
# to the sibling flag). Drop either new `case ... *..*` arm from the guard and the
# matching half flips 2 -> 0: the snapshot half writes its file, the baseline half
# reads its snapshot and the clean ref-diff passes. (Case 6 pins the same rule on
# --repo.)
# ---------------------------------------------------------------------------
R18="$(setup_repo)"
_out18="$(fresh_cwd)"
rc18a="$(run_guard_args --repo "$R18" --snapshot "$_out18/../traversal-snap.txt")"
SNAP18="$(artifact_path base.txt)"
take_snapshot "$R18" "$SNAP18" "case 18"
rc18b="$(run_guard_args --repo "$R18" --baseline "$(dirname "$SNAP18")/../$(basename "$(dirname "$SNAP18")")/base.txt")"
if [ "$rc18a" -eq 2 ] && [ "$rc18b" -eq 2 ]; then
  pass "case 18: '..' in an absolute --snapshot/--baseline path -> exit 2 (both flags)"
else
  fail "case 18: '..' traversal -> expected exit 2 on both flags, got snapshot=$rc18a baseline=$rc18b"
fi

# ===========================================================================
# REF-DIFF (check mode with --baseline)
# ===========================================================================

# ---------------------------------------------------------------------------
# Case 19: identical pre/post ref set + clean tree + --baseline -> exit 0. The
# no-false-positive floor: without this, an always-escaping diff would pass every
# other ref-diff case in this suite.
# Also the advisory's NEGATIVE half (case 20 pins the positive): with --baseline
# passed, the no-baseline stderr advisory must be ABSENT — a regression widening
# the sole emit site's `[ -z "$baseline_file" ]` guard would otherwise tell a Lead
# who DID pass a baseline that the ref checks are only a name heuristic.
# ---------------------------------------------------------------------------
R19="$(setup_repo)"
SNAP19="$(artifact_path snap.txt)"
take_snapshot "$R19" "$SNAP19" "case 19"
ERR19="$(artifact_path stderr19.txt)"
rc19="$(run_guard_err "$ERR19" --repo "$R19" --baseline "$SNAP19")"
if [ "$rc19" -ne 0 ]; then
  fail "case 19: unchanged ref set + --baseline -> expected exit 0, got $rc19"
elif grep -q 'advisory' "$ERR19"; then
  fail "case 19: --baseline mode must NOT emit the no-baseline advisory; stderr was: $(cat "$ERR19")"
else
  pass "case 19: unchanged ref set + clean tree + --baseline -> exit 0, advisory absent"
fi

# ---------------------------------------------------------------------------
# Case 20: #1244 DEMONSTRATED RED, half 1 — a probe-invented, PATTERN-SLIPPING branch
# (`rogue`) with a clean working tree, checked WITHOUT --baseline: exit 0, plus the
# stderr advisory.
#
# This case IS the recorded #1244 miss. No-baseline check mode is check-equivalent to
# the pre-ref-diff script — same checks a/b1/b2, same exit codes, same stdout, the lone
# delta being the advisory asserted here — so this green exit 0 records the old
# behavior exactly. FIXTURE HISTORY, not a reproduction instruction: no pre-change
# script is kept and no reader is asked to re-run one. The demonstration is the PAIRING
# with case 21 — same fixture, --baseline added, exit 1.
#
# The advisory assertion is pinned to its three subjects (the heuristic ceiling, the
# --baseline upgrade, and the ignored half being off) and needs run_guard_err:
# run_guard/run_guard_args discard output. The third subject is the stderr half of the
# claim both doc surfaces make (SKILL.md Step 4, references/lenses.md: 'the gitignored
# half does not run at all — the guard says exactly that on stderr').
# ---------------------------------------------------------------------------
R20="$(setup_repo)"
git -C "$R20" branch rogue 2>/dev/null           # slips refs/heads/redteam-* and *-sandbox-*
ERR20="$(artifact_path stderr.txt)"
rc20="$(run_guard_err "$ERR20" --repo "$R20")"
if [ "$rc20" -ne 0 ]; then
  fail "case 20: pattern-slipping ref without --baseline -> expected exit 0 (the recorded miss), got $rc20"
elif ! grep -q 'advisory' "$ERR20"; then
  fail "case 20: no-baseline check mode must emit the stderr advisory; stderr was: $(cat "$ERR20")"
elif [ "$(grep -c 'advisory' "$ERR20")" -ne 1 ]; then
  fail "case 20: the advisory must be emitted exactly ONCE; stderr was: $(cat "$ERR20")"
elif ! grep -q -- '--baseline' "$ERR20"; then
  fail "case 20: the advisory must name the --baseline upgrade; stderr was: $(cat "$ERR20")"
elif ! grep -qi 'heuristic' "$ERR20"; then
  fail "case 20: the advisory must name the heuristic ceiling; stderr was: $(cat "$ERR20")"
elif grep -qi 'does not run at all without a baseline' "$ERR20"; then
  pass "case 20: #1244 repro without --baseline -> exit 0 + advisory once (heuristic ceiling + --baseline + ignored half off)"
else
  fail "case 20: the advisory must say the gitignored half does not run without a baseline; stderr was: $(cat "$ERR20")"
fi

# ---------------------------------------------------------------------------
# Case 21: #1244 DEMONSTRATED RED, half 2 — the SAME fixture as case 20 with
# --baseline: exit 1. Name-agnostic detection; `rogue` matches no junk pattern, so
# only the ref-diff can see it.
# ---------------------------------------------------------------------------
R21="$(setup_repo)"
SNAP21="$(artifact_path snap.txt)"
take_snapshot "$R21" "$SNAP21" "case 21"
git -C "$R21" branch rogue 2>/dev/null           # the "probe" writes its ref AFTER the snapshot
rc21="$(run_guard_args --repo "$R21" --baseline "$SNAP21")"
if [ "$rc21" -eq 1 ]; then
  pass "case 21: #1244 repro WITH --baseline -> exit 1 (name-agnostic ref-diff)"
else
  fail "case 21: #1244 repro with --baseline -> expected exit 1, got $rc21"
fi

# ---------------------------------------------------------------------------
# Case 22: a MOVED sibling-branch SHA -> exit 1. Only refs/heads/sibling is
# repointed (update-ref, no checkout, no commit), so the ref SET is identical and
# the working tree stays clean: a name-only diff that ignored %(objectname) would
# report 0 here.
# ---------------------------------------------------------------------------
R22="$(setup_repo)"
printf 'second\n' > "$R22/second.txt"
git -C "$R22" add second.txt
git -C "$R22" commit -qm "second"
git -C "$R22" branch sibling "$(git -C "$R22" rev-parse HEAD~1)" 2>/dev/null
SNAP22="$(artifact_path snap.txt)"
take_snapshot "$R22" "$SNAP22" "case 22"
git -C "$R22" update-ref refs/heads/sibling "$(git -C "$R22" rev-parse HEAD)"
rc22="$(run_guard_args --repo "$R22" --baseline "$SNAP22")"
if [ "$rc22" -eq 1 ]; then
  pass "case 22: moved sibling-branch SHA (same ref set) -> exit 1"
else
  fail "case 22: moved sibling-branch SHA -> expected exit 1, got $rc22"
fi

# ---------------------------------------------------------------------------
# Case 23: a DELETED ref -> exit 1. The removal direction of the diff; an
# added-and-moved-only implementation reports 0 here.
# ---------------------------------------------------------------------------
R23="$(setup_repo)"
git -C "$R23" branch doomed 2>/dev/null
SNAP23="$(artifact_path snap.txt)"
take_snapshot "$R23" "$SNAP23" "case 23"
git -C "$R23" update-ref -d refs/heads/doomed
rc23="$(run_guard_args --repo "$R23" --baseline "$SNAP23")"
if [ "$rc23" -eq 1 ]; then
  pass "case 23: deleted ref -> exit 1"
else
  fail "case 23: deleted ref -> expected exit 1, got $rc23"
fi

# ---------------------------------------------------------------------------
# Case 24: NAMESPACE EXCLUSION — a refs/remotes/* delta -> exit 0.
# `for-each-ref` also enumerates remote-tracking refs, which move on any background
# or IDE `git fetch` and are never a probe writing into the repo (origin-side pushes
# remain the b2 ceiling). Real repos also share one ref store across linked worktrees,
# so an unscoped diff would turn ordinary concurrent activity into "escape detected"
# and make CLEARED unreachable. WITHOUT this case the refs/heads|refs/tags filter is
# deletable with the whole list still green — verified: strip the namespace test from
# the guard's awk pass and this case alone flips 0 -> 1.
# ---------------------------------------------------------------------------
R24="$(setup_repo)"
SNAP24="$(artifact_path snap.txt)"
take_snapshot "$R24" "$SNAP24" "case 24"
git -C "$R24" update-ref refs/remotes/origin/some-other-branch "$(git -C "$R24" rev-parse HEAD)"
rc24="$(run_guard_args --repo "$R24" --baseline "$SNAP24")"
if [ "$rc24" -eq 0 ]; then
  pass "case 24: refs/remotes/* delta -> exit 0 (namespace exclusion is load-bearing)"
else
  fail "case 24: refs/remotes/* delta -> expected exit 0, got $rc24 (namespace scoping lost)"
fi

# ---------------------------------------------------------------------------
# Case 25: NAMESPACE INCLUSION — a created refs/tags/* ref -> exit 1. The paired
# other half of case 24: scoping the diff must EXCLUDE refs/remotes without also
# narrowing it to refs/heads only. A probe tagging the target is a real escape.
# ---------------------------------------------------------------------------
R25="$(setup_repo)"
SNAP25="$(artifact_path snap.txt)"
take_snapshot "$R25" "$SNAP25" "case 25"
git -C "$R25" tag v-probe-escape 2>/dev/null
rc25="$(run_guard_args --repo "$R25" --baseline "$SNAP25")"
if [ "$rc25" -eq 1 ]; then
  pass "case 25: created refs/tags/* ref -> exit 1 (namespace inclusion)"
else
  fail "case 25: created refs/tags/* ref -> expected exit 1, got $rc25 (tags dropped from the diff)"
fi

# ---------------------------------------------------------------------------
# Case 26: --baseline pointing at a MISSING file -> exit 2, asserted != 1. Infra
# never collapses into escape, and never into a silent pass.
# Non-vacuity: the fixture carries a `rogue` branch, so the tempting wrong
# implementation — treat an absent baseline as an EMPTY one — would report every live
# ref as "added" and return 1. Only validating the file itself returns 2 here.
# ---------------------------------------------------------------------------
R26="$(setup_repo)"
git -C "$R26" branch rogue 2>/dev/null
MISSING26="$(artifact_path never-written.txt)"
rc26="$(run_guard_args --repo "$R26" --baseline "$MISSING26")"
if [ "$rc26" -eq 2 ]; then
  pass "case 26: missing --baseline file -> exit 2 (not 1 — infra never becomes escape)"
else
  fail "case 26: missing --baseline file -> expected exit 2, got $rc26 (2-vs-1 boundary violated)"
fi

# ---------------------------------------------------------------------------
# Case 27: ORDERING — an infra fault must never be PREEMPTED by an escape
# conclusion. This fixture would escape on its own merits (a b1-pattern junk ref
# fires check (b1) -> 1) AND names a missing --baseline. Because the guard validates
# the baseline at arg-parse time, ahead of every check, the answer is 2.
# Non-vacuity: case 26 cannot pin this — its repo has nothing to escape on, so it
# stays green even if the validation moves down to the ref-diff (where awk's own read
# failure still yields 2). Move it down and THIS case flips 2 -> 1, because (b1)
# reaches its escape first. Measured: with the arg-parse validation block deleted the
# rest of the suite stays green and only this case, case 28 and case 30 red (case 28
# for the zero-byte arm: awk opens the empty file, every live ref lands in base[] while
# live[] stays empty, exit 1 against an expected 2; case 30 is this ordering pin's
# zero-byte twin).
# ---------------------------------------------------------------------------
R27="$(setup_repo)"
git -C "$R27" branch redteam-would-escape 2>/dev/null
MISSING27="$(artifact_path never-written.txt)"
rc27="$(run_guard_args --repo "$R27" --baseline "$MISSING27")"
if [ "$rc27" -eq 2 ]; then
  pass "case 27: missing --baseline outranks a live escape -> exit 2 (infra never preempted)"
else
  fail "case 27: missing --baseline + escaping repo -> expected exit 2, got $rc27 (infra preempted by escape)"
fi

# ---------------------------------------------------------------------------
# Case 28: a ZERO-BYTE --baseline file -> exit 2, asserted explicitly != 1. Case
# 26's missing-file sibling: this file exists, is a regular file, and is readable,
# so only the guard's `-s` (non-empty) check can refuse it. A zero-byte FIRST
# operand defeats the awk NR==FNR two-file idiom: NR never diverges from FNR, the
# loader branch fires for every stdin record too, so base[] is loaded from the LIVE
# dump while live[] stays empty, and the END block reports every live ref as
# "removed" — the inverted removed-every-ref verdict. Non-vacuity: the fixture carries a `rogue` branch, so the degeneracy
# has refs to invert. Delete-and-trace: drop the `-s` check from the guard and
# this case reds at exit 1 with that inverted removed-every-ref message (a
# truncated-write infra fault laundered into an escape). ORDERING is NOT pinned
# here — `rogue` slips the (b1) junk pattern, so this fixture would exit 0 on its
# own merits. Case 30 is the ordering twin, with an escaping fixture.
# ---------------------------------------------------------------------------
R28="$(setup_repo)"
git -C "$R28" branch rogue 2>/dev/null
EMPTY28="$(artifact_path zero-byte-baseline.txt)"
: > "$EMPTY28"                       # exists, regular, readable — and zero bytes
ERR28="$(artifact_path stderr28.txt)"
rc28="$(run_guard_err "$ERR28" --repo "$R28" --baseline "$EMPTY28")"
if [ "$rc28" -eq 2 ]; then
  if grep -qF -- 'zero bytes (a truncated or failed snapshot write' "$ERR28"; then
    pass "case 28: zero-byte --baseline file -> exit 2 naming the zero-byte baseline (not 1 — infra never becomes escape)"
  else
    fail "case 28: exit 2 but stderr does not carry the -s die's 'zero bytes' message (another exit-2 die supplied the 2?); stderr was: $(cat "$ERR28")"
  fi
elif [ "$rc28" -eq 1 ]; then
  fail "case 28: zero-byte --baseline file -> got 1 (NR==FNR degeneracy: infra collapsed into escape)"
else
  fail "case 28: zero-byte --baseline file -> expected exit 2, got $rc28"
fi

# ---------------------------------------------------------------------------
# Case 29: GITIGNORED-PATH LEAK -> exit 1 naming the leaked path. This case used
# to pin the opposite — ponytail ceiling 3 as a documented false negative — and the
# ignored-file widening FLIPPED it, which was the deliberate first act of that
# widening. `git status --porcelain` still never reports an ignored file, so check
# (a) is byte-unchanged; check (d) catches the leak by diffing the live ignored FILE
# set against the set the snapshot recorded. FIXTURE-ORDERING TRAP: the .gitignore is
# committed BEFORE the snapshot — left untracked, it would fire the snapshot-mode
# pre-run porcelain refusal and never reach the assertion.
# Red-at-base: against the unwidened guard this case exits 0 (no check (d) at all).
# ---------------------------------------------------------------------------
R29="$(setup_repo)"
printf '*.log\n' > "$R29/.gitignore"
git -C "$R29" add .gitignore
git -C "$R29" commit -qm "ignore logs"          # committed BEFORE the snapshot
SNAP29="$(artifact_path snap.txt)"
take_snapshot "$R29" "$SNAP29" "case 29"
printf 'probe leak\n' > "$R29/probe-residue.log"  # lands only under the ignored pattern
# Non-vacuity (coded, not just prose): without the leak actually written AND actually
# ignored, this case degenerates into case 19's clean-repo green and pins nothing.
[ -f "$R29/probe-residue.log" ] || fail "case 29: FIXTURE — leak file was not written"
git -C "$R29" check-ignore -q probe-residue.log || fail "case 29: FIXTURE — the leak path is not ignored"
ERR29="$(artifact_path stderr29.txt)"
rc29="$(run_guard_err "$ERR29" --repo "$R29" --baseline "$SNAP29")"
if [ "$rc29" -eq 1 ]; then
  if grep -qF -- 'probe-residue.log' "$ERR29"; then
    pass "case 29: gitignored-path leak -> exit 1 naming the leaked path (check (d))"
  else
    fail "case 29: exit 1 but stderr does not name the leaked path (another check supplied the 1?); stderr was: $(cat "$ERR29")"
  fi
else
  fail "case 29: gitignored-path leak -> expected exit 1, got $rc29 (check (d) not detecting)"
fi

# ---------------------------------------------------------------------------
# Case 30: ORDERING PIN — a ZERO-BYTE --baseline on a repo that WOULD escape.
# Case 27 pins the same law for a MISSING baseline; case 28 pins the zero-byte
# refusal itself but cannot pin ordering, because its `rogue` branch slips the (b1)
# junk pattern and so never reaches an escape. This fixture carries a
# `refs/heads/redteam-*` branch, which (b1) DOES match, so the two answers diverge:
# arg-parse validation first -> 2, check (b1) first -> 1.
# This case is green at HEAD; it is a PIN, not a red-at-base case. Non-vacuity by
# delete-and-trace (case 27/28 convention): move the baseline validation block below
# check (b1) in a scratch copy of the guard and this case flips 2 -> 1.
# ---------------------------------------------------------------------------
R30="$(setup_repo)"
git -C "$R30" branch redteam-would-escape 2>/dev/null
EMPTY30="$(artifact_path zero-byte-baseline.txt)"
: > "$EMPTY30"                       # exists, regular, readable — and zero bytes
ERR30="$(artifact_path stderr30.txt)"
rc30="$(run_guard_err "$ERR30" --repo "$R30" --baseline "$EMPTY30")"
if [ "$rc30" -eq 2 ]; then
  if grep -qF -- 'zero bytes (a truncated or failed snapshot write' "$ERR30"; then
    pass "case 30: zero-byte --baseline outranks a live (b1) escape -> exit 2 naming the zero-byte baseline"
  else
    fail "case 30: exit 2 but stderr does not carry the -s die's 'zero bytes' message; stderr was: $(cat "$ERR30")"
  fi
elif [ "$rc30" -eq 1 ]; then
  fail "case 30: zero-byte --baseline + escaping repo -> got 1 (infra preempted by escape detection)"
else
  fail "case 30: zero-byte --baseline + escaping repo -> expected exit 2, got $rc30"
fi

# ---------------------------------------------------------------------------
# Case 31: ALLOWLIST CONTROL — the only new ignored file lands under a run-authored
# allowlist pattern (.claude/red-team/), so check (d) stays clean. Every /red-team run
# writes its verification scaffold there, so without the allowlist the guard would red
# on every real run of its own home repo. Delete-and-trace: drop the ignored_allowed
# arm from the guard and this case alone flips 0 -> 1, while case 29 stays green.
# ---------------------------------------------------------------------------
R31="$(setup_repo)"
printf '.claude/\n' > "$R31/.gitignore"
git -C "$R31" add .gitignore
git -C "$R31" commit -qm "ignore .claude"       # committed BEFORE the snapshot
SNAP31="$(artifact_path snap.txt)"
take_snapshot "$R31" "$SNAP31" "case 31"
mkdir -p "$R31/.claude/red-team"
printf 'scaffold\n' > "$R31/.claude/red-team/run-2026-09-02.js"
git -C "$R31" check-ignore -q .claude/red-team/run-2026-09-02.js \
  || fail "case 31: FIXTURE — the allowlisted path is not ignored"
rc31="$(run_guard_args --repo "$R31" --baseline "$SNAP31")"
if [ "$rc31" -eq 0 ]; then
  pass "case 31: new ignored file under the run-authored allowlist -> exit 0"
else
  fail "case 31: allowlisted ignored file -> expected exit 0, got $rc31 (allowlist not honoured)"
fi

# ---------------------------------------------------------------------------
# Case 32: a NEW file INSIDE a directory the baseline already listed files under
# -> exit 1 naming the new file. This is the case that rules out
# `git status --porcelain --ignored` as the snapshot mechanism: porcelain collapses
# a pre-existing ignored directory into ONE `!!` entry, so both snapshot and live
# would read `node_modules/` and the diff would be empty. Recording the ignored set
# at FILE level is what makes the new file visible.
# Red-at-base: against the unwidened guard this case exits 0.
# ---------------------------------------------------------------------------
R32="$(setup_repo)"
printf 'node_modules/\n' > "$R32/.gitignore"
git -C "$R32" add .gitignore
git -C "$R32" commit -qm "ignore node_modules"  # committed BEFORE the snapshot
mkdir -p "$R32/node_modules/pkg"
printf 'first\n' > "$R32/node_modules/pkg/first.js"   # present BEFORE the snapshot
SNAP32="$(artifact_path snap.txt)"
take_snapshot "$R32" "$SNAP32" "case 32"
printf 'second\n' > "$R32/node_modules/pkg/second.js" # the leak, inside a baselined dir
git -C "$R32" check-ignore -q node_modules/pkg/second.js \
  || fail "case 32: FIXTURE — the leak path is not ignored"
grep -qF -- 'node_modules/pkg/first.js' "$SNAP32" \
  || fail "case 32: FIXTURE — the baseline did not record the pre-existing ignored file"
ERR32="$(artifact_path stderr32.txt)"
rc32="$(run_guard_err "$ERR32" --repo "$R32" --baseline "$SNAP32")"
if [ "$rc32" -eq 1 ]; then
  if grep -qF -- 'node_modules/pkg/second.js' "$ERR32"; then
    pass "case 32: new ignored file inside a baselined directory -> exit 1 naming it"
  else
    fail "case 32: exit 1 but stderr does not name the new file; stderr was: $(cat "$ERR32")"
  fi
else
  fail "case 32: new ignored file inside a baselined directory -> expected exit 1, got $rc32"
fi

# ---------------------------------------------------------------------------
# Case 33: PRE-EXISTING RESIDUE CONTROL — an ignored file present BEFORE the
# snapshot. Snapshot mode BASELINES it (exit 0, never a pre-run refusal) and check
# mode stays clean. This is the ratified routing OD-2 half: this repo carries its own
# `!!` entries through a machine-local `.git/info/exclude`, so refusing pre-existing
# ignored residue would dead-lock the guard on its own home repo. Delete-and-trace:
# make snapshot mode refuse ignored residue and this case reds at the FIXTURE line.
# ---------------------------------------------------------------------------
R33="$(setup_repo)"
printf '*.log\n' > "$R33/.gitignore"
git -C "$R33" add .gitignore
git -C "$R33" commit -qm "ignore logs"          # committed BEFORE the snapshot
printf 'old residue\n' > "$R33/pre-existing.log"  # ignored, present BEFORE the snapshot
git -C "$R33" check-ignore -q pre-existing.log \
  || fail "case 33: FIXTURE — the residue path is not ignored"
SNAP33="$(artifact_path snap.txt)"
take_snapshot "$R33" "$SNAP33" "case 33"        # fails the case if snapshot refuses
rc33="$(run_guard_args --repo "$R33" --baseline "$SNAP33")"
if [ "$rc33" -eq 0 ]; then
  pass "case 33: ignored residue predating the snapshot -> baselined, check exit 0"
else
  fail "case 33: pre-existing ignored residue -> expected exit 0, got $rc33"
fi

# ---------------------------------------------------------------------------
# Case 34: BACK-COMPAT CONTROL — an OLD-FORMAT baseline, written before the
# ignored-file widening, carries no `# ignored-files` section. The ignored half then
# goes vacuous and check (d) passes, even with a live leak that case 29 proves is
# otherwise caught. Fail-open by design: a pre-widening baseline must not read as an
# escape. The old-format file is derived from a REAL new-format snapshot by stripping
# the section, so the ref half stays exact and only the ignored half differs.
# ---------------------------------------------------------------------------
R34="$(setup_repo)"
printf '*.log\n' > "$R34/.gitignore"
git -C "$R34" add .gitignore
git -C "$R34" commit -qm "ignore logs"          # committed BEFORE the snapshot
SNAP34="$(artifact_path snap.txt)"
take_snapshot "$R34" "$SNAP34" "case 34"
OLD34="$(artifact_path old-format-baseline.txt)"
grep -v '^ignored ' "$SNAP34" | grep -v '^# ignored-files' > "$OLD34"
grep -qF -- '# ignored-files' "$OLD34" \
  && fail "case 34: FIXTURE — the old-format baseline still carries the ignored section"
[ -s "$OLD34" ] || fail "case 34: FIXTURE — the old-format baseline is empty (would exit 2 on -s)"
printf 'probe leak\n' > "$R34/probe-residue.log"
git -C "$R34" check-ignore -q probe-residue.log \
  || fail "case 34: FIXTURE — the leak path is not ignored"
rc34="$(run_guard_args --repo "$R34" --baseline "$OLD34")"
if [ "$rc34" -eq 0 ]; then
  pass "case 34: old-format baseline (no ignored section) -> ignored half vacuous, exit 0"
else
  fail "case 34: old-format baseline -> expected exit 0 (fail-open back-compat), got $rc34"
fi

# ---------------------------------------------------------------------------
# Case 35: SOURCE LOCK — the ignored-half's four git/read failure paths each die
# with a distinct message AND an explicit exit 2. They are SECONDARY defensive
# branches: in both modes a `git status` call runs first and dies on a non-repo or
# unreadable path, so no fixture can reach a bare `git ls-files` failure. A source
# lock is therefore the only available coverage, and it is the point that matters —
# an ignored-half git fault must classify as infra (2), never collapse into escape
# (1) or a silent pass. Case 10's standing call-site lock already proves the
# explicit code; this case names the four messages so a rewrite cannot drop one
# silently. Delete-and-trace: remove any one die from the guard and this reds.
# ---------------------------------------------------------------------------
ign_die_missing=""
for _msg in \
  "git ls-files (ignored-file dump) failed for repo '" \
  "git ls-files (ignored-file diff) failed for repo '" \
  "failed to read the ignored-file section of the baseline '" \
  "ignored-file diff failed while reading the baseline '"
do
  if ! grep -qF -- "$_msg" "$SCRIPT"; then
    ign_die_missing="$ign_die_missing
    $_msg"
  fi
done
if [ -z "$ign_die_missing" ]; then
  pass "case 35: the four ignored-half failure paths each die with their own message (exit 2 per case 10)"
else
  fail "case 35: ignored-half die message(s) missing from the guard:$ign_die_missing"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-no-repo-escape: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
