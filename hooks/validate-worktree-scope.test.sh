#!/usr/bin/env bash
# Tests for the WAR worktree-scope guard (hooks/validate-worktree-scope.sh).
# Plain-bash assertion runner: pipes crafted PreToolUse payloads into the hook
# and asserts the exit code. No bats, no package.json — runs under macOS bash
# 3.2.57 (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 (this script) = all cases passed; non-zero = at least one failed.
set -u

# Resolve the hook next to this test file, so the gate can run us from any cwd.
HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/validate-worktree-scope.sh"

fails=0
n=0

# run <payload-json> -> echoes the hook's exit code
run() { printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1; echo $?; }

# run_home <home-dir> <payload-json> -> exit code, with HOME pinned to $1 for
# THIS case only (per-case env pinning, no global export; deliberately NOT
# shared with the sibling warn-bash-write-scope suite — Q16 keeps file-disjoint
# suites' helpers independent). Proves the servitor $HOME anchor (#810).
run_home() { printf '%s' "$2" | HOME="$1" bash "$HOOK" >/dev/null 2>&1; echo $?; }

# run_home_err <home-dir> <payload-json> -> the hook's STDERR (the deny message),
# for asserting self-diagnosis content. Stdout is discarded; stderr is captured.
run_home_err() { printf '%s' "$2" | HOME="$1" bash "$HOOK" 2>&1 >/dev/null; }

# run_nohome <payload-json> -> exit code with HOME truly UNSET (env -u HOME),
# distinct from HOME='' (set-but-empty). Both must reach the fallback shape glob
# via the ${HOME:-} spelling WITHOUT tripping `set -u` (a bare $HOME would crash).
run_nohome() { printf '%s' "$1" | env -u HOME bash "$HOOK" >/dev/null 2>&1; echo $?; }

# mk <agent_type-string> <file_path-string> -> a PreToolUse payload.
# $1 is a raw agent_type string (e.g. war-worker); $2 is a raw file path.
# Uses jq -nc --arg to avoid printf double-quote escaping making tests vacuous
# (printf-json-escaping-vacuous-test-case).
mk() { jq -nc --arg at "$1" --arg fp "$2" '{"agent_type":$at,"tool_input":{"file_path":$fp}}'; }

# expect <description> <expected-code> <actual-code>
expect() {
  n=$((n + 1))
  if [ "$2" = "$3" ]; then
    printf 'ok %d - %s (exit %s)\n' "$n" "$1" "$3"
  else
    printf 'FAIL %d - %s (expected %s, got %s)\n' "$n" "$1" "$2" "$3"
    fails=$((fails + 1))
  fi
}

# ---------------------------------------------------------------------------
# Fixtures: a throwaway tree where one branch carries a .war-task marker.
#   $WT/wt/<task>/...   has an ancestor (.../wt/<task>) holding .war-task
#   $WT/plain/...       has no .war-task ancestor (stands in for main checkout)
# ---------------------------------------------------------------------------
WT="$(mktemp -d 2>/dev/null || mktemp -d -t warscope)"
cleanup() { rm -rf "$WT"; }
trap cleanup EXIT

mkdir -p "$WT/wt/task-1/sub/deep"
: > "$WT/wt/task-1/.war-task"
mkdir -p "$WT/plain/sub"

INSIDE_WT="$WT/wt/task-1/sub/deep/file.txt"   # ancestor has .war-task
OUTSIDE_WT="$WT/plain/sub/file.txt"           # no .war-task ancestor

# Servitor targets (path-pattern based; dirs need not exist for the hook).
SERV_MEM="$WT/repo/.claude/projects/myproj/memory/x.md"
SERV_LEARN="$WT/repo/docs/learnings/phase-1.md"
SERV_RANDOM="$WT/repo/src/whatever.md"

# $HOME-anchoring fixtures (#810). HOME is pinned per case via run_home; the
# servitor arm string-matches the path, so these dirs need not exist.
SERV_HOME="$WT/home"                                              # pinned $HOME root
SERV_MEM_UNDER_HOME="$SERV_HOME/.claude/projects/proj/memory/x.md"      # under pinned $HOME
SERV_MEM_OTHER_PROJ="$SERV_HOME/.claude/projects/other-proj/memory/y.md" # cross-project, same $HOME
SERV_MEM_OUTSIDE_HOME="$WT/other/.claude/projects/proj/memory/x.md"      # shape-matching, NOT under $HOME

# ---------------------------------------------------------------------------
# Cases (mirror the plan's 9 acceptance cases for Task 1).
# ---------------------------------------------------------------------------

# 1: war-worker writing inside a dir whose ancestor has .war-task -> 0
expect "war-worker inside .war-task ancestor allowed" \
  0 "$(run "$(mk 'war-worker' "$INSIDE_WT")")"

# 2: war-worker with no .war-task ancestor -> 2 (deny)
expect "war-worker outside any worktree denied" \
  2 "$(run "$(mk 'war-worker' "$OUTSIDE_WT")")"

# 3: war-auditor anywhere -> 2 (hard-deny, read-only)
expect "war-auditor write denied (read-only)" \
  2 "$(run "$(mk 'war-auditor' "$INSIDE_WT")")"

# 4a: war-servitor under .../.claude/projects/<p>/memory/x.md, with HOME pinned
# so the path sits under the servitor's own $HOME anchor (#810 retrofit) -> 0.
expect "war-servitor memory path under pinned \$HOME allowed" \
  0 "$(run_home "$WT/repo" "$(mk 'war-servitor' "$SERV_MEM")")"

# 4b: war-servitor under a random path -> 2 (deny)
expect "war-servitor random path denied" \
  2 "$(run "$(mk 'war-servitor' "$SERV_RANDOM")")"

# 5: war-servitor under .../docs/learnings/phase-1.md -> 2 (deny).
# #58 resolution: the repo-root allowance is SUBTRACTED — the servitor writes
# only the local memory root; docs/learnings is populated by the Lead Gate-2
# promotion. Delete-the-feature: this fails (gets 0) if the */docs/learnings/*
# alternative is reverted back into the hook's servitor allow-glob.
expect "war-servitor learnings path denied (#58 repo-root subtracted)" \
  2 "$(run "$(mk 'war-servitor' "$SERV_LEARN")")"

# 6: war-refiner anywhere -> 0 (unrestricted)
expect "war-refiner unrestricted" \
  0 "$(run "$(mk 'war-refiner' "$OUTSIDE_WT")")"

# 7: no agent_type (main session) -> 0 (fail-open)
# Payload carries no agent_type key at all.
expect "main session (no agent_type) fail-open" \
  0 "$(run "$(jq -nc --arg fp "$OUTSIDE_WT" '{"tool_input":{"file_path":$fp}}')")"

# 8: unknown agent_type 'some-other-agent' -> 0 (fail-open / back-compat)
expect "unknown agent_type fail-open" \
  0 "$(run "$(mk 'some-other-agent' "$OUTSIDE_WT")")"

# 9: no file_path (e.g. a Bash tool) -> 0
# A war-worker with an empty tool_input: even the strictest role must not deny
# a tool that writes no file.
expect "no file_path -> allowed" \
  0 "$(run '{"agent_type":"war-worker","tool_input":{}}')"

# Regression guard (not in the 9 acceptance cases, but load-bearing): a
# war-worker given a *relative* path with no .war-task ancestor must DENY and
# TERMINATE. The ancestor walk uses `dirname`, which converges to "." for a
# relative path and `dirname .` == "." — without a progress guard the loop
# spins forever and hangs the PreToolUse hook. We bound the call so a
# regression surfaces as a timeout instead of hanging this suite.
#
# Implementation: use `timeout` when available (Linux/brew coreutils); fall
# back to a background-watchdog approach that works on macOS bash 3.2.57 where
# `perl -e 'alarm N; exec @ARGV'` does not propagate the child's exit code.
# rel_guard <payload>: runs the hook from a verified-.war-task-free dir so the
# relative payload resolves under a clean ancestor chain regardless of where the
# suite itself is invoked (including from inside a .war-task worktree on CI).
#
# Clean dir: a subdirectory of $WT/plain (the suite's own .war-task-free fixture
# created above at :47), NOT an ambient mktemp -d, which may land under a
# .war-task ancestor when TMPDIR points inside a worktree root on Linux/CI.
#
# Precondition: walk the chosen dir's ancestors; if any holds .war-task, emit a
# SPECIFIC marker and abort loud — a non-isolatable environment must never
# silently mis-assert.
#
# Uses `timeout` when available; falls back to a background-watchdog pattern
# that works on macOS bash 3.2.57 (perl alarm+exec does not propagate exit codes
# reliably on macOS).
rel_guard() {
  # Root under the suite's controlled .war-task-free fixture, not ambient mktemp.
  _rg_clean="$WT/plain/rg_cwd"
  mkdir -p "$_rg_clean"

  # Precondition: verify no ancestor of _rg_clean carries .war-task.
  _rg_check="$_rg_clean"
  while [ "$_rg_check" != "/" ] && [ -n "$_rg_check" ]; do
    if [ -e "$_rg_check/.war-task" ]; then
      printf 'REL_GUARD_PRECONDITION_FAILED: %s has .war-task — clean dir is not isolatable\n' "$_rg_check" >&2
      return 1
    fi
    _rg_check="$(dirname "$_rg_check")"
  done

  if command -v timeout >/dev/null 2>&1; then
    _rg_rc=0
    ( cd "$_rg_clean" && printf '%s' "$1" | timeout 10 bash "$HOOK" >/dev/null 2>&1 ) || _rg_rc=$?
    echo "$_rg_rc"
    return
  fi
  # MacOS fallback: run hook in background from a clean dir; kill if too slow.
  ( cd "$_rg_clean" && printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1 ) &
  _rg_pid=$!
  ( sleep 10 2>/dev/null && kill "$_rg_pid" 2>/dev/null ) &
  _rg_wdog=$!
  wait "$_rg_pid" 2>/dev/null; _rg_rc=$?
  kill "$_rg_wdog" 2>/dev/null; wait "$_rg_wdog" 2>/dev/null || true
  echo "$_rg_rc"
}
expect "war-worker relative path denies (no infinite loop)" \
  2 "$(rel_guard '{"agent_type":"war-worker","tool_input":{"file_path":"relative/sub/file.txt"}}')"

# ---------------------------------------------------------------------------
# Structural assertion: war-servitor.md frontmatter tools allowlist (F01 D1)
#
# The servitor must have a `tools:` line in its YAML frontmatter that explicitly
# lists exactly Read, Grep, Glob, Write, Edit — and must NOT grant Bash.
# This pins the capability-allowlist contract so the harness can enforce it.
# ---------------------------------------------------------------------------
SERVITOR_MD="$HERE/../agents/war-servitor.md"

# Extract the YAML frontmatter (between the first two --- delimiters).
# Use awk for portability (no perl, no python) — works on macOS bash 3.2.57.
frontmatter="$(awk '/^---/{if(++c==2) exit} c==1{print}' "$SERVITOR_MD")"

# Check: tools: line exists in frontmatter
tools_line="$(printf '%s\n' "$frontmatter" | grep '^tools:')"
n=$((n + 1))
if [ -n "$tools_line" ]; then
  printf 'ok %d - war-servitor.md frontmatter contains tools: line\n' "$n"
else
  printf 'FAIL %d - war-servitor.md frontmatter missing tools: line\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Read
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Read'; then
  printf 'ok %d - war-servitor.md tools: grants Read\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Read\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Grep
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Grep'; then
  printf 'ok %d - war-servitor.md tools: grants Grep\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Grep\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Glob
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Glob'; then
  printf 'ok %d - war-servitor.md tools: grants Glob\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Glob\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Write
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Write'; then
  printf 'ok %d - war-servitor.md tools: grants Write\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Write\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Edit
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Edit'; then
  printf 'ok %d - war-servitor.md tools: grants Edit\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Edit\n' "$n"
  fails=$((fails + 1))
fi

# Check: the tools section of the frontmatter does NOT grant Bash — covers both
# inline `tools: [Bash, ...]` AND block-style `- Bash` on a separate line.
# (frontmatter-tools-negation-check-single-line-only: grep on tools_line alone
# misses YAML block-style entries; extract the tools block and scan it.)
# Strategy: take the tools: line plus any immediately following "- " list lines
# (block-style YAML list continuation), then check that block for Bash.
#
# BLOCK-EXTRACTION REFERENCE IMPLEMENTATION (negation-convention anchor).
# This awk is the canonical example of the frontmatter *negation* convention:
# a negation check ("does NOT grant Bash") must extract the full fenced tools
# block (the `tools:` line PLUS its following `- ` continuation lines) before
# scanning — never grep a bare `^tools:` header, which sees only the first line
# and silently misses block-style `- Bash`. Task 1.2's guard-conventions.test.sh
# meta-guard points here as the PASS reference; keep this block walk intact.
tools_block="$(printf '%s\n' "$frontmatter" | awk '/^tools:/{found=1; print; next} found && /^- /{print; next} found{exit}')"
n=$((n + 1))
if ! printf '%s\n' "$tools_block" | grep -q 'Bash'; then
  printf 'ok %d - war-servitor.md tools block does NOT grant Bash (inline+block-style scan)\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools block grants Bash — confinement is broken\n' "$n"
  fails=$((fails + 1))
fi

# ---------------------------------------------------------------------------
# Task 2 (#58): .. path traversal denial tests.
#
# The hook must reject any path containing a `..` segment — even if the
# literal glob or .war-task ancestor walk would otherwise allow it. This
# closes the traversal hole in both the war-servitor and war-worker branches.
# ---------------------------------------------------------------------------

# Servitor: a learnings-looking path that contains .. -> deny (exit 2).
# e.g. /x/docs/learnings/../../etc/foo matches */docs/learnings/* but escapes.
SERV_DOTDOT="$WT/x/docs/learnings/../../etc/foo"
expect "war-servitor path with .. denied (traversal)" \
  2 "$(run "$(mk 'war-servitor' "$SERV_DOTDOT")")"

# Servitor: a memory-looking path that contains .. -> deny (exit 2).
SERV_MEM_DOTDOT="$WT/repo/.claude/projects/p/memory/../../etc/shadow"
expect "war-servitor memory path with .. denied (traversal)" \
  2 "$(run "$(mk 'war-servitor' "$SERV_MEM_DOTDOT")")"

# Worker: a path that contains .. whose literal dirname chain hits .war-task
# ancestor (the .war-task dir is in the path literally, but .. escapes it).
WORKER_DOTDOT="$WT/wt/task-1/sub/../../../plain/file.txt"
expect "war-worker path with .. denied (traversal)" \
  2 "$(run "$(mk 'war-worker' "$WORKER_DOTDOT")")"

# Regression: clean (no-..) servitor memory path still allowed (HOME pinned so
# SERV_MEM sits under the $HOME anchor — #810 retrofit).
expect "war-servitor clean memory path still allowed (regression, pinned \$HOME)" \
  0 "$(run_home "$WT/repo" "$(mk 'war-servitor' "$SERV_MEM")")"

# Regression: clean (no-..) servitor learnings path now DENIED (#58 subtraction);
# the .. guard is not what blocks it — the servitor allow-glob no longer covers
# docs/learnings at all.
expect "war-servitor clean learnings path denied (#58 repo-root subtracted)" \
  2 "$(run "$(mk 'war-servitor' "$SERV_LEARN")")"

# Regression: clean (no-..) worker inside-worktree path still allowed.
expect "war-worker clean inside-worktree path still allowed (regression)" \
  0 "$(run "$(mk 'war-worker' "$INSIDE_WT")")"

# ---------------------------------------------------------------------------
# T2 back-compat: the .. guard fires BEFORE the per-agent case, so it applies
# to ALL agent types — including war-refiner and the main session (no agent_type).
# Ratified ADR 0002 D5: dotdot-guard-applies-to-all-agent-types.
# ---------------------------------------------------------------------------

# Refiner: a .. path -> denied (exit 2); the .. guard is pre-case, not limited
# to war-worker or war-servitor.
REFINER_DOTDOT="$WT/docs/learnings/../../etc/shadow"
expect "war-refiner path with .. denied (pre-case, all agents)" \
  2 "$(run "$(mk 'war-refiner' "$REFINER_DOTDOT")")"

# Main session (no agent_type): a .. path -> denied (exit 2).
expect "main session (no agent_type) path with .. denied (pre-case, all agents)" \
  2 "$(run "$(jq -nc --arg fp "$REFINER_DOTDOT" '{"tool_input":{"file_path":$fp}}')")"

# Regression: refiner with a clean (no-..) path remains unrestricted (fail-open).
expect "war-refiner clean path still allowed (fail-open preserved)" \
  0 "$(run "$(mk 'war-refiner' "$OUTSIDE_WT")")"

# Regression: main session with a clean (no-..) path remains fail-open.
expect "main session (no agent_type) clean path still allowed (fail-open preserved)" \
  0 "$(run "$(jq -nc --arg fp "$OUTSIDE_WT" '{"tool_input":{"file_path":$fp}}')")"

# ---------------------------------------------------------------------------
# Task 1.1: FULL '..' traversal equivalence class — the LEADING-relative
# (`../etc/foo`) and BARE (`..`) shapes. These have no '/' before the '..', so
# the old `*/../*|*/..` pair MISSED them (dotdot-pattern-misses-leading-
# relative-traversal). The widened class `..|../*|*/../*|*/..` catches them.
# These cases are RED against the old pattern and GREEN after the widening.
# Covered for a confined role (war-worker) AND the all-agents path (war-refiner
# + no-agent_type), since the guard is pre-`case "$atype"` (ADR 0002 D5).
# ---------------------------------------------------------------------------

# Leading-relative `../etc/foo`: confined worker -> deny (exit 2).
expect "war-worker leading-relative '../' path denied (traversal class)" \
  2 "$(run "$(mk 'war-worker' "../etc/foo")")"

# Leading-relative `../etc/foo`: refiner (all-agents pre-case) -> deny (exit 2).
expect "war-refiner leading-relative '../' path denied (pre-case, all agents)" \
  2 "$(run "$(mk 'war-refiner' "../etc/foo")")"

# Leading-relative `../etc/foo`: no agent_type (main session) -> deny (exit 2).
expect "main session (no agent_type) leading-relative '../' path denied (pre-case)" \
  2 "$(run "$(jq -nc '{"tool_input":{"file_path":"../etc/foo"}}')")"

# Bare `..`: confined worker -> deny (exit 2).
expect "war-worker bare '..' path denied (traversal class)" \
  2 "$(run "$(mk 'war-worker' "..")")"

# Bare `..`: refiner (all-agents pre-case) -> deny (exit 2).
expect "war-refiner bare '..' path denied (pre-case, all agents)" \
  2 "$(run "$(mk 'war-refiner' "..")")"

# Bare `..`: no agent_type (main session) -> deny (exit 2).
expect "main session (no agent_type) bare '..' path denied (pre-case)" \
  2 "$(run "$(jq -nc '{"tool_input":{"file_path":".."}}')")"

# ---------------------------------------------------------------------------
# Task 1.2 (#810): servitor $HOME anchor + suffix-anchored agent-type arms.
#
# The servitor memory-write glob is now anchored to the CURRENT user's $HOME
# (with the unanchored shape glob retained only as the HOME-unset/empty
# fallback), and all three agent-type arms are suffix-anchored (*war-<role>,
# not *war-<role>*). HOME is pinned per case via run_home / run_nohome so the
# cases stay hermetic regardless of the runner's ambient HOME.
# ---------------------------------------------------------------------------

# Anchored allow: a memory path UNDER the pinned $HOME -> allow (exit 0). The
# positive baseline for the discriminator triple below (under=allow,
# cross-project=allow, outside=deny), all sharing one pinned $HOME.
expect "war-servitor memory path under pinned \$HOME allowed (#810 anchor)" \
  0 "$(run_home "$SERV_HOME" "$(mk 'war-servitor' "$SERV_MEM_UNDER_HOME")")"

# Cross-project residual (re-ratified #810): a DIFFERENT project slug under the
# user's OWN $HOME is still allowed — per-run project-slug anchoring is out of
# reach (a hook cannot receive per-run values), so this residual is by design.
expect "war-servitor cross-project memory path under own \$HOME allowed (re-ratified residual)" \
  0 "$(run_home "$SERV_HOME" "$(mk 'war-servitor' "$SERV_MEM_OTHER_PROJ")")"

# Anchor deny: a path matching the memory SHAPE but rooted OUTSIDE the pinned
# $HOME -> deny (exit 2). Delete-the-feature: reverting the anchored case pattern
# to the bare shape glob flips this to exit 0 (the shape alone would then match).
expect "war-servitor shape path outside pinned \$HOME denied (#810 anchor)" \
  2 "$(run_home "$SERV_HOME" "$(mk 'war-servitor' "$SERV_MEM_OUTSIDE_HOME")")"

# ...and the deny message names the anchored expectation (self-diagnosis for an
# operator hit by a HOME anomaly — plan Q15). Substring is glob-free so it does
# not itself count as a memory-glob survivor (End state 4).
serv_anchor_deny="$(run_home_err "$SERV_HOME" "$(mk 'war-servitor' "$SERV_MEM_OUTSIDE_HOME")")"
n=$((n + 1))
case "$serv_anchor_deny" in
  *".claude/projects/<project>/memory"*)
    printf 'ok %d - servitor anchor-deny message names the anchored expectation\n' "$n" ;;
  *)
    printf 'FAIL %d - servitor anchor-deny message omits the anchored expectation (got: %s)\n' "$n" "$serv_anchor_deny"
    fails=$((fails + 1)) ;;
esac

# Trailing-slash HOME normalized (${home%/}): a trailing '/' on $HOME must not
# brick the match. Delete-the-feature: dropping the ${home%/} strip forms a '//'
# in the anchored pattern and flips this to deny (exit 2).
expect "war-servitor pinned \$HOME with trailing slash still allows (normalization)" \
  0 "$(run_home "$SERV_HOME/" "$(mk 'war-servitor' "$SERV_MEM_UNDER_HOME")")"

# HOME truly UNSET (env -u HOME): the ${HOME:-} spelling must not let `set -u`
# kill the hook — it falls back to the unanchored shape glob and allows.
# Delete-the-feature: a bare $HOME here crashes the hook (exit != 0), not 0.
expect "war-servitor HOME unset -> fallback shape glob allows (\${HOME:-} spelling)" \
  0 "$(run_nohome "$(mk 'war-servitor' "$SERV_MEM")")"

# HOME set-but-EMPTY (HOME=''): distinct from unset; ${HOME:-} collapses it to
# empty too, so the same fallback shape glob allows.
expect "war-servitor HOME empty -> fallback shape glob allows (\${HOME:-} spelling)" \
  0 "$(run_home "" "$(mk 'war-servitor' "$SERV_MEM")")"

# Exact live dispatched shape work-audit-refine:war-servitor still hits the
# CONFINED servitor arm (suffix-anchored *war-servitor): an outside path denies.
# Under-capture guard — if this fell to the fail-open default arm it would be 0.
expect "exact-shape :war-servitor still confined (outside path denied)" \
  2 "$(run_home "$SERV_HOME" "$(mk 'work-audit-refine:war-servitor' "$SERV_RANDOM")")"

# Trailing-junk work-audit-refine:war-servitor-helper no longer matches the
# suffix-anchored *war-servitor arm -> falls to the fail-open default arm (0).
# Delete-the-feature: under the old *war-servitor* substring pattern this
# SERV_RANDOM write denied (exit 2).
expect "trailing-junk :war-servitor-helper falls to fail-open default arm" \
  0 "$(run_home "$SERV_HOME" "$(mk 'work-audit-refine:war-servitor-helper' "$SERV_RANDOM")")"

# Exact live dispatched shape work-audit-refine:war-auditor still hits the
# read-only auditor arm (suffix-anchored *war-auditor) -> write denied. Deny-side
# under-capture guard: if this fell to default it would fail-open (0), silently
# letting a read-only auditor write.
expect "exact-shape :war-auditor still write-denied (deny-side under-capture guard)" \
  2 "$(run "$(mk 'work-audit-refine:war-auditor' "$INSIDE_WT")")"

# Trailing-junk :war-auditor-helper no longer matches *war-auditor -> fail-open
# default (0). Delete-the-feature: under the old *war-auditor* substring pattern
# this denied (2).
expect "trailing-junk :war-auditor-helper falls to fail-open default arm" \
  0 "$(run "$(mk 'work-audit-refine:war-auditor-helper' "$INSIDE_WT")")"

# Exact live dispatched shape work-audit-refine:war-worker still hits the worker
# arm (suffix-anchored *war-worker): an outside-worktree write denies.
expect "exact-shape :war-worker still gated (outside-worktree write denied)" \
  2 "$(run "$(mk 'work-audit-refine:war-worker' "$OUTSIDE_WT")")"

# Trailing-junk :war-worker-helper no longer matches *war-worker -> fail-open
# default (0). Delete-the-feature: under the old *war-worker* substring pattern
# this denied (2).
expect "trailing-junk :war-worker-helper falls to fail-open default arm" \
  0 "$(run "$(mk 'work-audit-refine:war-worker-helper' "$OUTSIDE_WT")")"

# Grep assertion: no dead 'warned' variable remains in the hook
# (printf-json-escaping-vacuous-test-case cleanup, D6 verified-correction).
n=$((n + 1))
if ! grep -q '\bwarned\b' "$HOOK"; then
  printf 'ok %d - no dead warned variable in hook\n' "$n"
else
  printf 'FAIL %d - dead warned variable found in hook\n' "$n"
  fails=$((fails + 1))
fi

# Grep assertion: no dead 'warned' variable in the sibling advisory warn-hook
# either — the dead-var class is closed across both hooks (#554 hooks hygiene).
WARN_HOOK="$HERE/warn-bash-write-scope.sh"
n=$((n + 1))
if ! grep -q '\bwarned\b' "$WARN_HOOK"; then
  printf 'ok %d - no dead warned variable in warn-bash-write-scope.sh\n' "$n"
else
  printf 'FAIL %d - dead warned variable found in warn-bash-write-scope.sh\n' "$n"
  fails=$((fails + 1))
fi

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-worktree-scope.test.sh: PASS"
