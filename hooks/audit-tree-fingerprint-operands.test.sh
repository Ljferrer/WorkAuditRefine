#!/usr/bin/env bash
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh):
# the Task 8.1 operand forms, the Grep walk-down and Glob non-walk, grep_walk search roots, the grep_walk_root cache, and content sensitivity.
# The shared fixture, payload builders and helpers live in
# audit-tree-fingerprint.test-lib.sh (its header describes the hook and the
# fixture). #2823 split the suite into four files so they run in parallel.
# Plain-bash assertion runner, bash 3.2 safe, cwd-independent.
# Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/audit-tree-fingerprint.test-lib.sh"

# Fixture state the old single suite built before these rows: row e1 (in
# audit-tree-fingerprint.test.sh) committed g in wtB, and row t18 made wtA/sub.
# Row c4 renames that g, and row t30 walks through wtA/sub.
printf 'new\n' > "$TMP/wtB/g"
git -C "$TMP/wtB" add g
git -C "$TMP/wtB" commit -q -m move
mkdir -p "$TMP/wtA/sub"

# --- Task 8.1 operand forms (ruling B, 2026-10-24) ---------------------------
# A `-C` after the subcommand word is git's copy-detection flag (diff, log,
# blame), never a global `-C`: the operand base must not move. From wtC the two
# operands resolve against wtC and reach wtB and wtD; with the old global-only
# reading, `-C ../wtB/f` moved the base into wtB/f and `../wtD/f` resolved to
# wtB/wtD, no such worktree. Red with the gate removed.
run "$(mk_start "$AUD" t28)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t28 "git diff -C ../wtB/f ../wtD/f")"
PCWD="$MAIN"
if touched_is t28 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "subcommand -C does not move the operand base"; else fail "subcommand -C moved the operand base: |$(cat "$FP_ROOT/t28/touched" 2>/dev/null)|"; fi
# The same gate on the real shape: one global -C into the worktrees' parent,
# then `diff -C --no-index T1 T2`. The touched set is exactly the two
# worktrees (the old reading emptied it: `-C --no-index` moved the base to
# `$TMP/--no-index`, and wtA, wtB resolved under it).
run "$(mk_start "$AUD" t29)"
run "$(mk_bash "$AUD" t29 "git -C $TMP diff -C --no-index wtA wtB")"
if touched_is t29 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "a global -C followed by a subcommand -C keeps the operand base at the global -C directory"; else fail "global then subcommand -C routed wrong: |$(cat "$FP_ROOT/t29/touched" 2>/dev/null)|"; fi
# A relative operand with a mid-path `..` segment escapes the cwd worktree:
# from wtA (wtA/sub exists, made at the top of this suite), `sub/../../wtB/f` is wtB/f.
# `diff` resolves to the base (wtA) first, so the set is wtA then wtB.
run "$(mk_start "$AUD" t30)"
PCWD="$TMP/wtA"
run "$(mk_bash "$AUD" t30 "git diff sub/../../wtB/f sub/../../wtB/g")"
PCWD="$MAIN"
if touched_is t30 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "mid-path dotdot operand is touched"; else fail "mid-path .. operand not touched: |$(cat "$FP_ROOT/t30/touched" 2>/dev/null)|"; fi
# A `..` after a symlink resolves PHYSICALLY for git's --no-index open: wtA
# holds `lnk -> wtB/sub`, so `lnk/../f` is wtB/f to the kernel and to git
# (`git diff --no-index lnk/../f /dev/null` from wtA reads wtB/f, verified on
# git 2.54). bash's default `-L` cd would remove `lnk/..` lexically and
# resolve it to wtA, so the rows go red when canon drops `-P`. Both arms of
# the operand: relative from wtA (`diff` and the cwd resolve to wtA, so the
# set is wtA then wtB), then absolute from $MAIN (no marker there, so the
# operand alone gives the set: wtB physically, then wtA lexically, the
# fail-closed over-touch). The Read tool and git's in-repo rule read the SAME path
# LEXICALLY (Read of `/var/../private/etc/hosts` opens, while the physical
# `/private/private/etc/hosts` does not exist), so the Read and Glob arms,
# which have no base fallback, must touch wtA as well: task_worktree_of
# takes both resolutions (physical first), and rows t30c, t30d and t30e go
# red when the lexical arm (lexical_dir) is dropped. The link and wtB/sub
# are removed after the rows, so later wtA and wtB fingerprints are
# unchanged.
mkdir -p "$TMP/wtB/sub"
ln -s "$TMP/wtB/sub" "$TMP/wtA/lnk"
run "$(mk_start "$AUD" t30b)"
PCWD="$TMP/wtA"
run "$(mk_bash "$AUD" t30b "git diff --no-index lnk/../f /dev/null")"
PCWD="$MAIN"
if touched_is t30b "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "symlink-then-dotdot operand is touched at the link target's parent"; else fail "symlink then .. resolved lexically: |$(cat "$FP_ROOT/t30b/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t30c)"
run "$(mk_bash "$AUD" t30c "git diff --no-index $TMP/wtA/lnk/../f /dev/null")"
if touched_is t30c "$(printf '%s\n%s' "$WTB" "$WTA")"; then pass "absolute symlink-then-dotdot operand is touched at the link target's parent"; else fail "absolute symlink then .. missed a reading: |$(cat "$FP_ROOT/t30c/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t30d)"
run "$(mk_read "$AUD" t30d "$TMP/wtA/lnk/../f")"
if touched_is t30d "$(printf '%s\n%s' "$WTB" "$WTA")"; then pass "symlink-then-dotdot Read touches the lexical worktree as well as the physical one"; else fail "symlink then .. Read missed a reading: |$(cat "$FP_ROOT/t30d/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t30e)"
run "$(mk_glob "$AUD" t30e "$TMP/wtA/lnk/..")"
if touched_is t30e "$(printf '%s\n%s' "$WTB" "$WTA")"; then pass "symlink-then-dotdot Glob path touches the lexical worktree as well as the physical one"; else fail "symlink then .. Glob missed a reading: |$(cat "$FP_ROOT/t30e/touched" 2>/dev/null)|"; fi
# Two paths only the LEXICAL reading reaches, both Read from $MAIN. A
# multi-`..` path through a planted link: `wtA/lnk2 -> wtB/sub/deeper`, so
# `wtA/lnk2/../../wtD/f` is wtB/wtD/f to the kernel (no such dir: the
# physical walk stops at wtB) and wtD/f to the Read tool (verified
# 2026-10-26: the Read tool opened it as wtD/f while `cat` failed on it),
# so the set is wtB then wtD. A mid-path `..` over a missing component,
# no link at all: `wtC/nosuch/../../wtB/f` stops the physical walk at wtC
# (no marker) and is wtB/f to the Read tool, so the set is wtB alone. Both
# rows go red when the lexical arm of task_worktree_of is replaced by `:`.
mkdir -p "$TMP/wtB/sub/deeper"
ln -s "$TMP/wtB/sub/deeper" "$TMP/wtA/lnk2"
run "$(mk_start "$AUD" t30f)"
run "$(mk_read "$AUD" t30f "$TMP/wtA/lnk2/../../wtD/f")"
if touched_is t30f "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "multi-dotdot Read through a planted link touches the worktree the lexical reading reaches"; else fail "multi-dotdot Read through a link missed the lexical worktree: |$(cat "$FP_ROOT/t30f/touched" 2>/dev/null)|"; fi
rm "$TMP/wtA/lnk2"
rmdir "$TMP/wtB/sub/deeper"
run "$(mk_start "$AUD" t30g)"
run "$(mk_read "$AUD" t30g "$TMP/wtC/nosuch/../../wtB/f")"
if touched_is t30g "$WTB"; then pass "mid-path dotdot Read over a missing component touches the worktree the lexical reading reaches"; else fail "mid-path .. over a missing component missed the lexical worktree: |$(cat "$FP_ROOT/t30g/touched" 2>/dev/null)|"; fi
rm "$TMP/wtA/lnk"
rmdir "$TMP/wtB/sub"
# A `--<opt>=<value>` whose value is a bare relative path (no `./`, no `../`)
# into a nested task worktree: `git blame --contents=<file>` reads that file.
# `HEAD`, `--` and `f` resolve to $MAIN (no marker), so wtE is the only line.
mkdir -p "$MAIN/.claude/war-worktrees/r/wtE"
printf 'marker\n' > "$MAIN/.claude/war-worktrees/r/wtE/.war-task"
WTE="$(cd "$MAIN/.claude/war-worktrees/r/wtE" && pwd -P)"
run "$(mk_start "$AUD" t31)"
run "$(mk_bash "$AUD" t31 "git blame --contents=.claude/war-worktrees/r/wtE/f HEAD -- f")"
if touched_is t31 "$WTE"; then pass "option value path inside a worktree is touched"; else fail "--opt=<bare relative> value not touched: |$(cat "$FP_ROOT/t31/touched" 2>/dev/null)|"; fi
# An attached short-option file value: git reads `-O<orderfile>` (and
# `-X<exclude-file>` on ls-files), so the text after the option letter is a
# path, resolved against the base like a `--opt=<value>` value.
run "$(mk_start "$AUD" t31b)"
run "$(mk_bash "$AUD" t31b "git diff -O.claude/war-worktrees/r/wtE/f HEAD")"
if touched_is t31b "$WTE"; then pass "an attached short-option file value inside a worktree is touched"; else fail "-O<bare relative> value not touched: |$(cat "$FP_ROOT/t31b/touched" 2>/dev/null)|"; fi
# The absolute arm of the same value: `-O/abs/<file>` is touched as is.
run "$(mk_start "$AUD" t31c)"
run "$(mk_bash "$AUD" t31c "git diff -O$MAIN/.claude/war-worktrees/r/wtE/f HEAD")"
if touched_is t31c "$WTE"; then pass "an attached short-option absolute file value inside a worktree is touched"; else fail "-O</abs> value not touched: |$(cat "$FP_ROOT/t31c/touched" 2>/dev/null)|"; fi
# A file-valued letter inside a short-option cluster: git's parse_options
# reads `-pO<orderfile>` letter by letter, so the text after `O` is the
# orderfile (git 2.54 fails on a missing one: "failed to read orderfile").
# The guard admits the cluster (`-p` after the subcommand is local). Both
# arms of the value: bare relative, then absolute.
run "$(mk_start "$AUD" t31d)"
run "$(mk_bash "$AUD" t31d "git diff -pO.claude/war-worktrees/r/wtE/f HEAD")"
if touched_is t31d "$WTE"; then pass "an attached file value inside a short-option cluster is touched"; else fail "-pO<bare relative> cluster value not touched: |$(cat "$FP_ROOT/t31d/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t31e)"
run "$(mk_bash "$AUD" t31e "git diff -pO$MAIN/.claude/war-worktrees/r/wtE/f HEAD")"
if touched_is t31e "$WTE"; then pass "an attached absolute file value inside a short-option cluster is touched"; else fail "-pO</abs> cluster value not touched: |$(cat "$FP_ROOT/t31e/touched" 2>/dev/null)|"; fi
# The cluster value is the text after the FIRST file-valued letter, so a
# value that itself holds a later `O`, `X` or `S` (`wtE/OX`) must stay whole:
# a longest-prefix cut would resolve it to the base or to `/`, and the
# touched set would miss wtE. Both arms again: bare relative, then absolute.
run "$(mk_start "$AUD" t31f)"
run "$(mk_bash "$AUD" t31f "git diff -pO.claude/war-worktrees/r/wtE/OX HEAD")"
if touched_is t31f "$WTE"; then pass "a cluster value holding a later file-valued letter is touched whole"; else fail "-pO<bare relative with a later O/X> cluster value not touched: |$(cat "$FP_ROOT/t31f/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t31g)"
run "$(mk_bash "$AUD" t31g "git diff -pO$MAIN/.claude/war-worktrees/r/wtE/OX HEAD")"
if touched_is t31g "$WTE"; then pass "an absolute cluster value holding a later file-valued letter is touched whole"; else fail "-pO</abs with a later O/X> cluster value not touched: |$(cat "$FP_ROOT/t31g/touched" 2>/dev/null)|"; fi
# The space form of a file-valued flag: the value is the next token, resolved
# against the base like every other operand.
run "$(mk_start "$AUD" t32)"
run "$(mk_bash "$AUD" t32 "git blame --ignore-revs-file .claude/war-worktrees/r/wtE/revs HEAD -- f")"
if touched_is t32 "$WTE"; then pass "a space-form file-valued flag's bare relative value is touched"; else fail "--ignore-revs-file <bare relative> value not touched: |$(cat "$FP_ROOT/t32/touched" 2>/dev/null)|"; fi
# A `~/<path>` operand and a bare `~` operand inside a task worktree: HOME is
# wtB for this row, the cwd is wtC (no marker), so wtB is the only line.
_home="$HOME"; HOME="$TMP/wtB"
run "$(mk_start "$AUD" t33)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t33 "git diff --no-index ~/f ~")"
PCWD="$MAIN"
HOME="$_home"
if touched_is t33 "$WTB"; then pass "tilde operand inside a worktree is touched"; else fail "tilde operand inside a worktree not touched: |$(cat "$FP_ROOT/t33/touched" 2>/dev/null)|"; fi
# A directory operand that holds task worktrees: `git diff <dir> /dev/null`
# from wtC implies --no-index ($TMP is outside wtC's work tree) and recurses
# every worktree under $TMP, so each marked one is touched, in `git worktree
# list` order (the superproject's, then the submodule's). wtD still has its
# .git here (row a4, in the deadline suite, removes it there).
run "$(mk_start "$AUD" t34)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t34 "git diff $TMP /dev/null")"
PCWD="$MAIN"
if touched_is t34 "$(printf '%s\n%s\n%s\n%s' "$WTA" "$WTB" "$WTD" "$WTS")"; then pass "directory operand holding worktrees touches each"; else fail "directory operand walk-down wrong: |$(cat "$FP_ROOT/t34/touched" 2>/dev/null)|"; fi
# The walk-down is narrowed to a --no-index command (explicit, or implied by
# git for a two-path `diff` with either path outside the work tree) or an
# operand outside the base's work tree: an in-repo directory operand (`./`
# from $MAIN, three operands, so no implied --no-index) reads the repository's
# own tree and touches no task worktree. A marked worktree nested under $MAIN
# (the real layout) is the oracle for this row and the rows below it down to
# its removal, which keeps the later start-record line counts unchanged.
git -C "$MAIN" worktree add -q "$MAIN/.claude/wtQ" -b q
printf 'marker\n' > "$MAIN/.claude/wtQ/.war-task"
WTQ="$(cd "$MAIN/.claude/wtQ" && pwd -P)"
run "$(mk_start "$AUD" t35)"
run "$(mk_bash "$AUD" t35 "git diff HEAD -- ./")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t35/touched" ]; then pass "an in-repo directory operand without --no-index touches no task worktree"; else fail "in-repo directory operand walked down (rc=$RC touched=|$(cat "$FP_ROOT/t35/touched" 2>/dev/null)|)"; fi
# The cwd fallback never walks down: `git log -1` from $MAIN reads $MAIN's
# own tree, not the nested worktree.
run "$(mk_start "$AUD" t36)"
run "$(mk_bash "$AUD" t36 "git log -1")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t36/touched" ]; then pass "the Bash cwd fallback does not walk down into nested task worktrees"; else fail "cwd fallback walked down (rc=$RC touched=|$(cat "$FP_ROOT/t36/touched" 2>/dev/null)|)"; fi
# With --no-index an in-repo directory operand does recurse: `.` from $MAIN
# reaches the nested worktree.
run "$(mk_start "$AUD" t37)"
run "$(mk_bash "$AUD" t37 "git diff --no-index . /dev/null")"
if touched_is t37 "$WTQ"; then pass "an in-repo directory operand under --no-index touches the nested task worktree"; else fail "--no-index in-repo directory operand not walked: |$(cat "$FP_ROOT/t37/touched" 2>/dev/null)|"; fi
# git implies --no-index when exactly two paths follow `diff` and EITHER is
# outside the work tree (builtin/diff.c), so `git diff . /dev/null` from $MAIN
# runs with no --no-index token, and the hook walks `.` on the conservative
# side: for a directory paired with a file git itself reads only `./null`
# (diff-no-index fixup_paths), so the nested worktree is over-touched here.
# The oracle is git itself: the same command in the fixture names no "outside
# repository" error (it fails on the missing `./null` instead), where a
# non-implied form (t41, t44) does. t39 is the row where git really recurses
# the run directory.
run "$(mk_start "$AUD" t38)"
run "$(mk_bash "$AUD" t38 "git diff . /dev/null")"
if touched_is t38 "$WTQ"; then pass "an in-repo directory operand under implied --no-index touches the nested task worktree"; else fail "implied --no-index in-repo directory operand not walked: |$(cat "$FP_ROOT/t38/touched" 2>/dev/null)|"; fi
git -C "$MAIN" diff --quiet . /dev/null 2>"$TMP/err"
if ! grep -q 'outside repository' "$TMP/err"; then pass "git itself treats the two-path form with one outside path as --no-index"; else fail "git did not imply --no-index for 'diff . /dev/null': $(cat "$TMP/err")"; fi
# The live layout: the run directory (`.claude` here) diffed against a
# directory outside $MAIN, behind a leading flag git skips when it counts the
# paths. $TMP/wtC is unmarked and holds no worktree, so only wtQ is touched.
run "$(mk_start "$AUD" t39)"
run "$(mk_bash "$AUD" t39 "git diff --stat .claude $TMP/wtC")"
if touched_is t39 "$WTQ"; then pass "the run directory diffed against a directory outside the repo touches its nested task worktree"; else fail "run-directory operand under implied --no-index not walked: |$(cat "$FP_ROOT/t39/touched" 2>/dev/null)|"; fi
# A `--` ends the leading options and is not counted as a path.
run "$(mk_start "$AUD" t40)"
run "$(mk_bash "$AUD" t40 "git diff -- . /dev/null")"
if touched_is t40 "$WTQ"; then pass "a -- before the two paths still implies --no-index"; else fail "-- form of implied --no-index not walked: |$(cat "$FP_ROOT/t40/touched" 2>/dev/null)|"; fi
# Three operands never imply --no-index (git refuses the outside path), so
# the in-repo directory is not walked.
run "$(mk_start "$AUD" t41)"
run "$(mk_bash "$AUD" t41 "git diff HEAD . /dev/null")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t41/touched" ]; then pass "three operands never imply --no-index, so the in-repo directory is not walked"; else fail "three-operand diff walked down (rc=$RC touched=|$(cat "$FP_ROOT/t41/touched" 2>/dev/null)|)"; fi
if ! git -C "$MAIN" diff --quiet HEAD . /dev/null 2>"$TMP/err" && grep -q 'outside repository' "$TMP/err"; then pass "git itself refuses the outside path when three operands follow diff"; else fail "git implied --no-index for 'diff HEAD . /dev/null': $(cat "$TMP/err")"; fi
# Two in-repo paths imply nothing: `.` is not walked.
run "$(mk_start "$AUD" t42)"
run "$(mk_bash "$AUD" t42 "git diff . .claude")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t42/touched" ]; then pass "two in-repo paths imply no --no-index, so the in-repo directory is not walked"; else fail "two in-repo paths walked down (rc=$RC touched=|$(cat "$FP_ROOT/t42/touched" 2>/dev/null)|)"; fi
# The paths resolve against the global -C base, not the payload cwd: from
# wtC, `git -C $MAIN diff . /dev/null` reads $MAIN's `.`, so wtQ is touched
# and nothing under wtC is.
run "$(mk_start "$AUD" t43)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t43 "git -C $MAIN diff . /dev/null")"
PCWD="$MAIN"
if touched_is t43 "$WTQ"; then pass "implied --no-index resolves its two paths against the global -C base"; else fail "implied --no-index under -C wrong: |$(cat "$FP_ROOT/t43/touched" 2>/dev/null)|"; fi
# Only `diff` implies --no-index: `git log . /dev/null` refuses the outside
# path and reads nothing under `.`.
run "$(mk_start "$AUD" t44)"
run "$(mk_bash "$AUD" t44 "git log . /dev/null")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t44/touched" ]; then pass "a two-path non-diff command implies no --no-index"; else fail "non-diff two-path command walked down (rc=$RC touched=|$(cat "$FP_ROOT/t44/touched" 2>/dev/null)|)"; fi
git -C "$MAIN" worktree remove --force "$MAIN/.claude/wtQ"
git -C "$MAIN" branch -q -D q

# --- Grep walk-down where ripgrep recurses; the Glob non-walk (#2439) ---------
# The Grep tool runs ripgrep with --hidden and no --no-ignore, so ripgrep
# enters every folder below the search root R except one that the repo
# holding it ignores by pattern; at or under an explicit R that is itself
# ignored, it enters everything (D4). The hook stands in for that walk with
# `check-ignore --no-index` per folder. The Glob arm stays walk-up only (D5).
# Fixture: `.claude/` appended to $MAIN's info/exclude (as
# provision-worktrees.sh ensure-exclude writes), a marked worktree wtR
# registered under the run dir `.claude/war-worktrees/r`, and a marked
# worktree wtP under the plain non-repo folders `$TMP/plain/mid`. Both are
# added here and removed at the end of this window, so the start-record line
# counts and skip lists of the other rows keep their exact content. Each
# negative row first asserts that wtR is in the seat's start record, so the
# row can fail.
printf '.claude/\n' >> "$MAIN/.git/info/exclude"
git -C "$MAIN" worktree add -q "$MAIN/.claude/war-worktrees/r/wtR" -b rwalk
printf 'marker\n' > "$MAIN/.claude/war-worktrees/r/wtR/.war-task"
WTR="$(cd "$MAIN/.claude/war-worktrees/r/wtR" && pwd -P)"
mkdir -p "$TMP/plain/mid"
git -C "$MAIN" worktree add -q "$TMP/plain/mid/wtP" -b pwalk
printf 'marker\n' > "$TMP/plain/mid/wtP/.war-task"
WTP="$(cd "$TMP/plain/mid/wtP" && pwd -P)"
# Oracle, independent of the hook: git calls the run dir ignored by pattern.
if git -C "$MAIN" check-ignore -q --no-index -- .claude/war-worktrees/r/; then
  pass "oracle: the run dir under the excluded .claude/ is ignored by pattern"
else
  fail "oracle vacuous: check-ignore --no-index does not ignore the run dir"
fi
# End state 6: R is the run dir, at or under the ignored `.claude`, so ripgrep
# enters every folder below it and the hook marks every worktree below R. A
# second seat searches one level up (`.claude/war-worktrees`), so the folder
# `r` lies between R and wtR: git calls `r` ignored (its leading dir
# `.claude` is), and only the at-or-under rule on R itself marks wtR.
run "$(mk_start "$AUD" gw1)"
run "$(mk_grep "$AUD" gw1 "$MAIN/.claude/war-worktrees/r")"
run "$(mk_start "$AUD" gw1b)"
run "$(mk_grep "$AUD" gw1b "$MAIN/.claude/war-worktrees")"
if touched_is gw1 "$WTR" && touched_is gw1b "$WTR"; then pass "Grep path under the excluded dir walks down into the task worktree below it (the run dir and its parent)"; else fail "Grep under the excluded dir did not walk down: run dir |$(cat "$FP_ROOT/gw1/touched" 2>/dev/null)| parent |$(cat "$FP_ROOT/gw1b/touched" 2>/dev/null)|"; fi
# End state 7: R is a plain dir; `mid` is a folder no work tree holds (git's
# "not a git repository" exit there is no error) and wtP is a repo root, so
# neither is ignored and wtP is marked.
run "$(mk_start "$AUD" gw2)"
run "$(mk_grep "$AUD" gw2 "$TMP/plain")"
if touched_is gw2 "$WTP"; then pass "Grep path at a plain dir walks down through a folder no work tree holds"; else fail "Grep at a plain dir did not walk down: |$(cat "$FP_ROOT/gw2/touched" 2>/dev/null)|"; fi
# End state 8: a no-path Grep from the main checkout cwd, and a Grep whose
# path is the main checkout, reach `.claude` first, which $MAIN ignores, so
# wtR is never marked (no false AUDIT-TAMPER from a sibling worktree).
run "$(mk_start "$AUD" gw3)"
_gw3s=0; in_start gw3 "$WTR" && _gw3s=1
run "$(mk_tool "$AUD" gw3 Grep '{"pattern":"base"}')"
run "$(mk_grep "$AUD" gw3 "$MAIN")"
if [ "$_gw3s" = 1 ] && [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/gw3/touched" ]; then pass "Grep from the main checkout walks no excluded worktree (no path, and path = the main checkout)"; else fail "Grep from the main checkout walked an excluded worktree (in-start=$_gw3s rc=$RC touched=|$(cat "$FP_ROOT/gw3/touched" 2>/dev/null)|)"; fi
# End state 9: the Glob arm never walks down, even at the run dir, where the
# Grep arm does (D5).
run "$(mk_start "$AUD" gw4)"
_gw4s=0; in_start gw4 "$WTR" && _gw4s=1
run "$(mk_glob "$AUD" gw4 "$MAIN/.claude/war-worktrees/r")"
if [ "$_gw4s" = 1 ] && [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/gw4/touched" ]; then pass "Glob path walks no nested worktree (the run dir: walk-up only)"; else fail "Glob path walked down (in-start=$_gw4s rc=$RC touched=|$(cat "$FP_ROOT/gw4/touched" 2>/dev/null)|)"; fi
# End state 19: from the main checkout's parent ($TMP), ripgrep enters the
# repo root $MAIN and then applies $MAIN's exclude to `.claude`, so wtR is not
# marked; the sibling worktrees beside $MAIN are repo roots and are marked,
# which shows the walk ran.
run "$(mk_start "$AUD" gw5)"
_gw5s=0; in_start gw5 "$WTR" && _gw5s=1
run "$(mk_grep "$AUD" gw5 "$TMP")"
if [ "$_gw5s" = 1 ] && ! touched_has gw5 "$WTR" && touched_has gw5 "$WTA" && touched_has gw5 "$WTP"; then pass "Grep path at the main checkout's parent walks no excluded worktree"; else fail "Grep at the main checkout's parent walked wrong (in-start=$_gw5s touched=|$(cat "$FP_ROOT/gw5/touched" 2>/dev/null)|)"; fi
# PIN-6: when the ignore test errors for a folder inside a work tree, the hook
# marks (over-touch, never under-touch). A git shim fails every check-ignore,
# so a Grep with path = the main checkout marks wtR.
SHIMCI="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimci)"
printf '#!/bin/bash\ncase " $* " in *" check-ignore "*) exit 128 ;; esac\nexec "%s" "$@"\n' "$(command -v git)" > "$SHIMCI/git"
chmod +x "$SHIMCI/git"
run "$(mk_start "$AUD" gw7)"
_p="$(mk_grep "$AUD" gw7 "$MAIN")"
OUT="$(printf '%s' "$_p" | PATH="$SHIMCI:$PATH" bash "$HOOK" 2>/dev/null)"; RC=$?
rm -rf "$SHIMCI"
if [ "$RC" = 0 ] && touched_is gw7 "$WTR"; then pass "a check-ignore error inside a work tree marks the worktree below (over-touch)"; else fail "a check-ignore error did not mark (rc=$RC touched=|$(cat "$FP_ROOT/gw7/touched" 2>/dev/null)|)"; fi
# End state 18: once a file under `.claude/` is tracked (off the walk path, as
# this repo tracks .claude/war/config.json), plain `check-ignore` calls
# `.claude` not ignored while it still calls `.claude/war-worktrees` ignored,
# so a hook on plain check-ignore would skip wtR. `--no-index` still calls
# `.claude` ignored, as ripgrep does, so a Grep at `.claude` marks wtR.
printf '{}\n' > "$MAIN/.claude/war/config.json"
git -C "$MAIN" add -f .claude/war/config.json
git -C "$MAIN" commit -q -m 'track a file under .claude'
if ! git -C "$MAIN" check-ignore -q -- .claude/ && git -C "$MAIN" check-ignore -q -- .claude/war-worktrees/ \
   && git -C "$MAIN" check-ignore -q --no-index -- .claude/; then
  pass "oracle: with tracked content, plain check-ignore calls .claude not ignored and --no-index calls it ignored"
else
  fail "oracle vacuous: plain and --no-index check-ignore agree on .claude with tracked content"
fi
run "$(mk_start "$AUD" gw6)"
run "$(mk_grep "$AUD" gw6 "$MAIN/.claude")"
if touched_is gw6 "$WTR"; then pass "Grep path at the excluded dir with tracked content walks down"; else fail "Grep at the excluded dir with tracked content did not walk down: |$(cat "$FP_ROOT/gw6/touched" 2>/dev/null)|"; fi
# End state 20: `--no-index` never reads the index, so no behavior row can
# show it; every code line that runs check-ignore carries both flags.
_ci="$(grep -E '^[^#]*git .*check-ignore' "$HOOK")"
_cin="$(printf '%s\n' "$_ci" | grep -c .)"
_ciok="$(printf '%s\n' "$_ci" | grep -F -e '-c core.fsmonitor=false' | grep -cF -e '--no-index')"
if [ -n "$_ci" ] && [ "$_cin" = "$_ciok" ]; then
  pass "check-ignore calls are pattern-only (structural: --no-index and core.fsmonitor=false on every check-ignore call)"
else
  fail "a check-ignore call reads the index or runs fsmonitor: |$_ci|"
fi
# --- grep_walk takes both readings of the search root (#2475, #2476) ----------
# <run dir>/nosuch/.. fails the physical test, and its folded reading is the
# run dir. The missing root below it reads nothing, so it walks nothing.
run "$(mk_start "$AUD" pg1)"
run "$(mk_grep "$AUD" pg1 "$MAIN/.claude/war-worktrees/r/nosuch/..")"
if [ "$RC" = 0 ] && touched_is pg1 "$WTR"; then pass "a Grep root like <run dir>/nosuch/.. touches through its lexical reading"; else fail "the lexical Grep root did not walk: |$(cat "$FP_ROOT/pg1/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" pg2)"
PCWD="$MAIN/.claude/war-worktrees/r"
_p="$(mk_grep "$AUD" pg2 "nosuch/..")"
PCWD="$MAIN"
run "$_p"
if [ "$RC" = 0 ] && touched_is pg2 "$WTR"; then pass "a relative Grep root folds against the payload cwd"; else fail "the relative lexical Grep root did not walk: |$(cat "$FP_ROOT/pg2/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" pg3)"
_pg3s=0; in_start pg3 "$WTR" && _pg3s=1
run "$(mk_grep "$AUD" pg3 "$MAIN/.claude/war-worktrees/r/nosuch")"
if [ "$_pg3s" = 1 ] && [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/pg3/touched" ]; then pass "a missing Grep root walks no worktree (the exact folded dir, not its nearest ancestor)"; else fail "a missing Grep root walked: |$(cat "$FP_ROOT/pg3/touched" 2>/dev/null)|"; fi
# The two readings disagree across a planted link: the kernel reads lnk/.. as
# the run dir, and the fold reads it as the plain dir. Each holds a worktree.
mkdir -p "$MAIN/.claude/war-worktrees/r/inner"
ln -s "$MAIN/.claude/war-worktrees/r/inner" "$TMP/plain/lnk"
run "$(mk_start "$AUD" pg4)"
run "$(mk_grep "$AUD" pg4 "$TMP/plain/lnk/..")"
if [ "$RC" = 0 ] && touched_has pg4 "$WTR" && touched_has pg4 "$WTP"; then pass "a Grep root across a planted link walks both readings"; else fail "a Grep root across a link missed a reading: |$(cat "$FP_ROOT/pg4/touched" 2>/dev/null)|"; fi
rm -f "$TMP/plain/lnk"
# #2476 ruling: the glob override stays a recorded residual, so a glob-bearing
# Grep from the main checkout still follows the git-pattern rule.
run "$(mk_start "$AUD" pg5)"
_pg5s=0; in_start pg5 "$WTR" && _pg5s=1
run "$(mk_tool "$AUD" pg5 Grep '{"pattern":"base","glob":".claude/**"}')"
if [ "$_pg5s" = 1 ] && [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/pg5/touched" ]; then pass "a glob-bearing Grep keeps the git-pattern rule (recorded residual)"; else fail "a glob-bearing Grep walked an excluded worktree: |$(cat "$FP_ROOT/pg5/touched" 2>/dev/null)|"; fi
git -C "$MAIN" worktree remove --force "$MAIN/.claude/war-worktrees/r/wtR"
git -C "$MAIN" branch -q -D rwalk
git -C "$MAIN" worktree remove --force "$TMP/plain/mid/wtP"
git -C "$MAIN" branch -q -D pwalk
# --- the grep_walk_root folder cache (#2471) ----------------------------------
# Each folder's check-ignore answer is cached for one walk: `_gno` (not
# ignored) and `_gyes` (ignored). A git shim counts the check-ignore calls of
# one Grep run, so a row proves the cached arm ran, not only that the touched
# set came out right. GC1: two worktrees under one plain folder p: the second
# one hits `_gno` and is still touched (a `_gno` arm that skipped would leave
# it out). Calls: the root and p, once each. GC2: w3 under the plain folder p,
# and w4 and w5 under p/ign, which $MAIN ignores: w3 is touched, w4 and w5 are
# not. Calls: the root, p and ign, once each, so p's second and third visits
# hit `_gno` and ign's second visit hits `_gyes`.
SHIMGC="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimgc)"
printf '#!/bin/bash\ncase " $* " in *" check-ignore "*) printf x >> "%s" ;; esac\nexec "%s" "$@"\n' "$TMP/cicount" "$(command -v git)" > "$SHIMGC/git"
chmod +x "$SHIMGC/git"
printf 'gc2/p/ign/\n' >> "$MAIN/.git/info/exclude"
mkdir -p "$MAIN/gc1/p" "$MAIN/gc2/p/ign"
for _g in gc1/p/w1 gc1/p/w2 gc2/p/w3 gc2/p/ign/w4 gc2/p/ign/w5; do
  git -C "$MAIN" worktree add -q "$MAIN/$_g" -b "${_g##*/}"
  printf 'marker\n' > "$MAIN/$_g/.war-task"
done
GW1="$(cd "$MAIN/gc1/p/w1" && pwd -P)"; GW2="$(cd "$MAIN/gc1/p/w2" && pwd -P)"
GW3="$(cd "$MAIN/gc2/p/w3" && pwd -P)"
if git -C "$MAIN" check-ignore -q --no-index -- gc2/p/ign/ && ! git -C "$MAIN" check-ignore -q --no-index -- gc2/p/; then
  pass "oracle: gc2/p/ign is ignored by pattern and gc2/p is not"
else
  fail "oracle vacuous: the GC fixture's ignore rule does not hold"
fi
run "$(mk_start "$AUD" gc1)"
: > "$TMP/cicount"
_p="$(mk_grep "$AUD" gc1 "$MAIN/gc1")"
OUT="$(printf '%s' "$_p" | PATH="$SHIMGC:$PATH" bash "$HOOK" 2>/dev/null)"; RC=$?
_ci="$(wc -c < "$TMP/cicount" | tr -d ' ')"
if [ "$RC" = 0 ] && touched_has gc1 "$GW1" && touched_has gc1 "$GW2" && [ "$_ci" = 2 ]; then
  pass "GC1: the second worktree under a shared plain folder hits the _gno cache and is touched"
else
  fail "GC1: _gno cache hit wrong (rc=$RC check-ignore calls=$_ci touched=|$(cat "$FP_ROOT/gc1/touched" 2>/dev/null | tr '\n' ' ')|)"
fi
run "$(mk_start "$AUD" gc2)"
: > "$TMP/cicount"
_p="$(mk_grep "$AUD" gc2 "$MAIN/gc2")"
OUT="$(printf '%s' "$_p" | PATH="$SHIMGC:$PATH" bash "$HOOK" 2>/dev/null)"; RC=$?
_ci="$(wc -c < "$TMP/cicount" | tr -d ' ')"
if [ "$RC" = 0 ] && touched_is gc2 "$GW3" && [ "$_ci" = 3 ]; then
  pass "GC2: worktrees under a shared ignored folder hit the _gyes cache and stay untouched, beside a touched one under the plain folder"
else
  fail "GC2: _gyes cache hit wrong (rc=$RC check-ignore calls=$_ci touched=|$(cat "$FP_ROOT/gc2/touched" 2>/dev/null | tr '\n' ' ')|)"
fi
for _g in gc1/p/w1 gc1/p/w2 gc2/p/w3 gc2/p/ign/w4 gc2/p/ign/w5; do
  git -C "$MAIN" worktree remove --force "$MAIN/$_g"
  git -C "$MAIN" branch -q -D "${_g##*/}"
done
rm -rf "$MAIN/gc1" "$MAIN/gc2" "$SHIMGC" "$TMP/cicount"

# --- content sensitivity: a second edit to an already-dirty path -------------
# Each path below is dirty before the seat starts and edited once after, so
# its status record is the same at verdict time; only the blob hash moves.
# porcelain v1 C-quotes a path with a space, a double quote or a control byte
# even under core.quotePath=false; the -z form carries it raw. A staged rename
# record carries its source path as an extra -z field; its blob is the new
# path's. The --stdin-paths batch reader ends a path at a newline, strips a
# trailing CR and C-unquotes a line whose first byte is a double quote (a raw
# name there kills the whole batch): each of those three forms is hashed
# outside the batch, and a plain dirty sibling beside such a name must keep
# its own content sensitivity.
printf 'one\n' > "$TMP/wtB/a b"
run "$(mk_start "$AUD" c1)"
run "$(mk_read "$AUD" c1 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/a b"
if escalates_on c1 "$WTB"; then pass "a second edit to an untracked path with a space escalates (status record unchanged)"; else fail "space path edit not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
printf 'one\n' > "$TMP/wtB/q\"x"
run "$(mk_start "$AUD" c2)"
run "$(mk_read "$AUD" c2 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/q\"x"
if escalates_on c2 "$WTB"; then pass "a second edit to an untracked path with a double quote escalates"; else fail "double-quote path edit not caught (rc=$RC out=|$OUT|)"; fi
printf 'one\n' > "$TMP/wtB/n
l"
run "$(mk_start "$AUD" c3)"
run "$(mk_read "$AUD" c3 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/n
l"
if escalates_on c3 "$WTB"; then pass "a second edit to an untracked path with a newline escalates"; else fail "newline path edit not caught (rc=$RC out=|$OUT|)"; fi
git -C "$TMP/wtB" mv g g2
_rn="$(git -C "$TMP/wtB" diff --cached --name-status -M)"
printf 'r1\n' >> "$TMP/wtB/g2"
run "$(mk_start "$AUD" c4)"
run "$(mk_read "$AUD" c4 "$TMP/wtB/f")"
printf 'r2\n' >> "$TMP/wtB/g2"
if [ "$_rn" = "$(printf 'R100\tg\tg2')" ] && escalates_on c4 "$WTB"; then pass "a second edit to the new path of a staged rename escalates"; else fail "rename path edit not caught (staged=|$_rn| rc=$RC out=|$OUT|)"; fi
printf 'one\n' > "$TMP/wtB/\"lead"
run "$(mk_start "$AUD" c5)"
run "$(mk_read "$AUD" c5 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/\"lead"
if escalates_on c5 "$WTB"; then pass "a second edit to an untracked path whose first byte is a double quote escalates"; else fail "leading-quote path edit not caught (rc=$RC out=|$OUT|)"; fi
printf 'one\n' > "$TMP/wtB/$CRN"
run "$(mk_start "$AUD" c6)"
run "$(mk_read "$AUD" c6 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/$CRN"
if escalates_on c6 "$WTB"; then pass "a second edit to an untracked path ending in CR escalates"; else fail "trailing-CR path edit not caught (rc=$RC out=|$OUT|)"; fi
# The leading-quote and trailing-CR names are still dirty in wtB: a second
# edit to a plain dirty sibling must escalate on its own blob, not vanish
# into a dead batch that marks every batched path `unreadable`.
printf 'one\n' > "$TMP/wtB/p"
run "$(mk_start "$AUD" c7)"
run "$(mk_read "$AUD" c7 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/p"
if escalates_on c7 "$WTB"; then pass "a second edit to a plain dirty sibling of a leading-quote and a trailing-CR name escalates"; else fail "plain sibling edit not caught beside odd names (rc=$RC out=|$OUT|)"; fi
# Negative control: the same odd names stay dirty, nothing moves, and the
# verdict passes, so the c rows above fail on the edit and not on churn in
# the out-of-batch arm or the batch zip between two runs.
run "$(mk_start "$AUD" c8)"
run "$(mk_read "$AUD" c8 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" c8)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unchanged worktree with odd-name dirty paths passes"; else fail "unchanged odd-name worktree did not pass (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# hash-object runs no clean filter: a `text` attribute would normalize CRLF
# to LF on the way in and hide a line-ending-only second edit. One row per
# hash-object arm: the batch (plain name e) and the single call (the CR name).
printf 'e text\nr* text\n' > "$TMP/wtB/.gitattributes"
printf 'x\n' > "$TMP/wtB/e"
run "$(mk_start "$AUD" c9)"
run "$(mk_read "$AUD" c9 "$TMP/wtB/f")"
printf 'x\r\n' > "$TMP/wtB/e"
if escalates_on c9 "$WTB"; then pass "a line-ending-only second edit under a text attribute escalates (batch arm, no clean filter)"; else fail "clean filter hid a CRLF edit in the batch arm (rc=$RC out=|$OUT|)"; fi
printf 'x\n' > "$TMP/wtB/$CRN"
run "$(mk_start "$AUD" c10)"
run "$(mk_read "$AUD" c10 "$TMP/wtB/f")"
printf 'x\r\n' > "$TMP/wtB/$CRN"
if escalates_on c10 "$WTB"; then pass "a line-ending-only second edit to a CR-named path under a text attribute escalates (single-call arm, no clean filter)"; else fail "clean filter hid a CRLF edit in the single-call arm (rc=$RC out=|$OUT|)"; fi
# A symlink is fingerprinted by its link text, never by its target: a
# retarget to a same-content file keeps the status record and the target's
# blob the same, and a link to a directory is not a regular file at all. The
# unchanged links then pass, so the two rows fail on the retarget alone.
printf 'same\n' > "$TMP/wtB/x1"
printf 'same\n' > "$TMP/wtB/x2"
ln -s x1 "$TMP/wtB/lnk"
run "$(mk_start "$AUD" c11)"
run "$(mk_read "$AUD" c11 "$TMP/wtB/f")"
ln -sfn x2 "$TMP/wtB/lnk"
if escalates_on c11 "$WTB"; then pass "an untracked symlink retargeted to a same-content file escalates (link text hashed, target never read)"; else fail "symlink retarget not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
mkdir -p "$TMP/wtB/d1" "$TMP/wtB/d2"
ln -s d1 "$TMP/wtB/dlnk"
run "$(mk_start "$AUD" c12)"
run "$(mk_read "$AUD" c12 "$TMP/wtB/f")"
ln -sfn d2 "$TMP/wtB/dlnk"
if escalates_on c12 "$WTB"; then pass "an untracked symlink retargeted between directories escalates"; else fail "directory symlink retarget not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
run "$(mk_start "$AUD" c13)"
run "$(mk_read "$AUD" c13 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" c13)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unchanged worktree with dirty symlinks passes"; else fail "unchanged symlink worktree did not pass (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# The link text is the whole record: a link to a file OUTSIDE the worktree
# whose target content changes mid-round still passes, because the hook never
# reads the target. This row goes red if the -L arm ever follows the link.
printf 'o1\n' > "$TMP/outside"
ln -s "$TMP/outside" "$TMP/wtB/olnk"
run "$(mk_start "$AUD" c14)"
run "$(mk_read "$AUD" c14 "$TMP/wtB/f")"
printf 'o2\n' >> "$TMP/outside"
run "$(mk_verdict "$AUD" c14)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "a symlink whose out-of-worktree target changes passes (symlink target is never read)"; else fail "symlink target was read (rc=$RC out=|$OUT| err=|$ERR|)"; fi


# ---------------------------------------------------------------------------
finish audit-tree-fingerprint-operands.test.sh
