#!/usr/bin/env bash
# Tests for safe-swap.sh do_verify — the two §4.8 rules added for the memory
# substrate, the #891 repo-completeness hard fail (Rule 3), plus a regression
# guard for the budget hard-fail (unchanged).
#
# Rule 1 (archive-aware wikilinks): a [[slug]] resolving into archive/<slug>.md
#         is a cold link, NOT dangling; a row resolving into archive/ is not a
#         missing row. Cases 5/6 (Task 1.2, criterion 5) FREEZE the dangling-LINK
#         half of Rule 1 as the sole link-removal authority: an archive-only link
#         is not flagged; a link resolving in neither hot nor archive/ IS flagged.
# Rule 2 (root-aware rows): the index-row<->file HARD-FAIL skips rows carrying
#         the trailing [repo] marker — their files live in the repo root, not the
#         staged local dir. Without it, no swap completes once commitLearnings is
#         on.
# Rule 3 (repo-completeness): when CLAUDE_MEMORY_REPO points at a populated repo
#         root (>=1 top-level hot lesson, MEMORY.md excluded, non-recursive) but
#         MEMORY.md carries zero [repo] rows, do_verify HARD-FAILs — the
#         wholesale-[repo]-drop detector (#891). Env unset / non-dir / empty repo
#         root are skips (WARN on non-dir, never a hard fail). A DIFFERENT, additive
#         predicate over the [repo] marker than Rule 2 (Rule 2 excludes them; Rule 3
#         counts them), so both live in the shared do_verify and gate verify + commit.
# Unchanged: the budget hard-fail (>200 lines / >25600 bytes) still fires.
#
# Each case builds a fresh mktemp memory dir (a MEMORY.md + topic files, some in
# archive/) and runs `safe-swap.sh verify <dir>`, asserting exit code + report
# lines. criterion 13.
#
# Temp-break proofs (plan Task 3): each rule is load-bearing. We prove it by
# copying the script, mechanically DISABLING that one rule, and confirming the
# fixture that PASSED with the rule now FAILS without it. (weak-test-assertion:
# a passing assertion alone doesn't prove the feature runs — pair it with the
# negative that only the rule prevents.)
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Exit 0 = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/safe-swap.sh"

PASS=0
FAIL=0
TMPFILES=""

pass() { printf 'ok - %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf 'FAIL - %s\n' "$1" >&2; FAIL=$((FAIL + 1)); }

cleanup() {
  for d in $TMPFILES; do rm -rf "$d"; done
}
trap cleanup EXIT

# mkmem: fresh memory dir with an empty archive/. Echoes its path.
mkmem() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t swaptest)"
  TMPFILES="$TMPFILES $T"
  mkdir -p "$T/archive"
  printf '%s' "$T"
}

# add_row <dir> <slug> [<trailing marker text>] — append an index row to MEMORY.md.
add_row() {
  d="$1"; slug="$2"; marker="${3:-}"
  printf '| [[%s]] | 1 | a summary %s |\n' "$slug" "$marker" >> "$d/MEMORY.md"
}

# --- guard: script present ----------------------------------------------------
if [ ! -f "$SCRIPT" ]; then
  echo "FAIL - safe-swap.sh not found at $SCRIPT" >&2
  exit 1
fi

# Ambient-env sanitation: the Rule-3 repo-completeness check reads CLAUDE_MEMORY_REPO
# (the migration playbook's env preamble exports it — references/migration.md). A
# developer's ambient export must NOT inject the check into the pre-existing cases:
# CASES 4/5/6 build zero-[repo]-row projections and assert success, so an ambient
# populated repo root would red all three. Unset it here; the Rule-3 case sets it
# explicitly per-invocation. (Load-bearing — deleting this line reds CASES 4/5/6
# under any shell that has CLAUDE_MEMORY_REPO exported.)
unset CLAUDE_MEMORY_REPO

# =============================================================================
# CASE 1 — the happy staged corpus: an archived lesson + a [repo] row PASS.
#   - hot local lesson `alpha` with its file present            (normal)
#   - archived local lesson `beta`: row present, file in archive/ (Rule 1: row)
#   - a [[beta]] link inside alpha.md                            (Rule 1: link)
#   - repo-root lesson `gamma` with a [repo] row, NO local file  (Rule 2)
# Expect: VERIFY PASS (exit 0), no FAIL lines.
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "alpha"
add_row "$D" "beta"
add_row "$D" "gamma" "[repo]"
printf '# alpha\nSee also [[beta]] which is archived.\n' > "$D/alpha.md"
printf '# beta (archived)\nCold lesson.\n' > "$D/archive/beta.md"
# NOTE: no gamma.md anywhere locally — it is a repo-root lesson.

OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -q 'VERIFY: PASS'; then
  pass "case1: archived lesson + [repo] row -> VERIFY PASS (exit 0)"
else
  fail "case1: expected PASS/exit0, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
# The archive-aware rules must NOT report beta/gamma as broken.
if printf '%s' "$OUT" | grep -q 'FAIL'; then
  fail "case1: unexpected FAIL line (archive/[repo] rules not applied):"; printf '%s\n' "$OUT" >&2
else
  pass "case1: no FAIL line — beta(archived)+gamma([repo]) both accepted"
fi

# =============================================================================
# CASE 2 — a genuinely missing LOCAL row still HARD-FAILS. (criterion 13)
#   local row `delta`, no delta.md in dir OR archive/, NO [repo] marker.
# Expect: VERIFY FAIL (exit nonzero) + a FAIL line naming delta.
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "delta"

OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q 'index rows point to MISSING files.*delta'; then
  pass "case2: missing local row 'delta' -> HARD FAIL (exit $RC)"
else
  fail "case2: expected hard-fail naming delta, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# CASE 3 — budget hard-fail UNCHANGED: >200 lines still FAILs even when every
#   row and link resolves. (regression guard for the untouched rule)
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
i=0
while [ "$i" -lt 250 ]; do printf 'filler line %d\n' "$i" >> "$D/MEMORY.md"; i=$((i + 1)); done

OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q 'over the .*line budget'; then
  pass "case3: 250-line MEMORY.md -> budget HARD FAIL (unchanged, exit $RC)"
else
  fail "case3: expected line-budget fail, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# TEMP-BREAK 1 — Rule 2 (root-aware rows) is load-bearing.
#   Disable the [repo]-skip (drop the `grep -v '\[repo\]'` filter) in a copy of
#   the script; re-run CASE 1's corpus. The gamma [repo] row now has no local
#   file -> the copy must HARD-FAIL. If it still passes, the rule is inert.
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "alpha"
add_row "$D" "gamma" "[repo]"
printf '# alpha\nhot.\n' > "$D/alpha.md"

BROKEN="$(mktemp 2>/dev/null || mktemp -t swapbrk)"; TMPFILES="$TMPFILES $BROKEN"
# Remove the [repo] exclusion so [repo] rows fall back into the hard-fail set.
# Literal string-replace via node (no regex metachar escaping; BSD/GNU-identical).
node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");const t=s.replaceAll(" | grep -v \x27\\[repo\\]\x27","");if(t===s){console.error("temp-break1 sed no-op");process.exit(3)}fs.writeFileSync(process.argv[2],t)' "$SCRIPT" "$BROKEN" || fail "temp-break1: literal replace was a no-op (source line changed?)"
OUT="$(bash "$BROKEN" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q 'MISSING files.*gamma'; then
  pass "temp-break1: without [repo]-skip, gamma row HARD-FAILs -> Rule 2 is load-bearing"
else
  fail "temp-break1: disabling [repo]-skip did NOT fail on gamma (rule inert?), rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
# Sanity: the UNMODIFIED script passes this same corpus (proves the fixture is
# green only because of the rule, not by accident).
OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ]; then
  pass "temp-break1: unmodified script passes the same corpus (rule is the difference)"
else
  fail "temp-break1: unmodified script unexpectedly failed clean corpus, rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# TEMP-BREAK 2 — Rule 1 (archive-aware) is load-bearing.
#   Disable the archive branch of resolves_in (drop the `|| [ -f archive ]`)
#   in a copy; re-run a corpus whose only lesson is archived. The archived row
#   AND link now look missing -> the copy must HARD-FAIL (row) and WARN dangling.
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "beta"
printf '# hub\nlinks [[beta]].\n' > "$D/hub.md"
add_row "$D" "hub"
printf '# beta (archived)\ncold.\n' > "$D/archive/beta.md"

BROKEN2="$(mktemp 2>/dev/null || mktemp -t swapbrk2)"; TMPFILES="$TMPFILES $BROKEN2"
# Strip the archive fallback: `[ -f "$1/$2.md" ] || [ -f "$1/archive/$2.md" ]`
# becomes just the local check. Literal replace via node (BSD/GNU-identical).
node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");const t=s.replaceAll(" || [ -f \"$1/archive/$2.md\" ]","");if(t===s){console.error("temp-break2 replace no-op");process.exit(3)}fs.writeFileSync(process.argv[2],t)' "$SCRIPT" "$BROKEN2" || fail "temp-break2: literal replace was a no-op (source line changed?)"
OUT="$(bash "$BROKEN2" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q 'MISSING files.*beta'; then
  pass "temp-break2: without archive fallback, archived row beta HARD-FAILs -> Rule 1 is load-bearing"
else
  fail "temp-break2: disabling archive fallback did NOT fail on beta (rule inert?), rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
# Sanity: unmodified script passes the archived corpus (proves Rule 1 is the diff).
OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -q 'no dangling wikilinks'; then
  pass "temp-break2: unmodified script passes archived corpus, [[beta]] not dangling"
else
  fail "temp-break2: unmodified script failed archived corpus, rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# CASE 4 — commit path end-to-end (regression: do_verify leaked `mem` globally,
#   clobbering commit's swap targets: staging's MEMORY.md got renamed to
#   MEMORY.md.prev.<ts> INSIDE staging, then `mv <staging> <staging>/MEMORY.md`
#   failed EINVAL — commit could never succeed).
#   stage -> edit staging -> commit; assert exit 0, live dir has staged content
#   with intact MEMORY.md, a <memdir>.prev.<ts> dir holds the old content, and
#   no MEMORY.md.prev.* file exists inside the new live dir.
# =============================================================================
WRAP="$(mktemp -d 2>/dev/null || mktemp -d -t swapcommit)"; TMPFILES="$TMPFILES $WRAP"
MEMD="$WRAP/memory"
mkdir -p "$MEMD/archive"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$MEMD/MEMORY.md"
add_row "$MEMD" "alpha"
printf '# alpha\nold content.\n' > "$MEMD/alpha.md"

OUT="$(bash "$SCRIPT" stage "$MEMD" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ]; then
  fail "case4: stage failed, rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
# Edit staging: change alpha's content (the staged content we expect to go live).
printf '# alpha\nNEW staged content.\n' > "$MEMD.staging/alpha.md"

OUT="$(bash "$SCRIPT" commit "$MEMD" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ]; then
  pass "case4: commit exits 0"
else
  fail "case4: commit failed, rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
if [ -f "$MEMD/MEMORY.md" ] && grep -q 'NEW staged content' "$MEMD/alpha.md" 2>/dev/null; then
  pass "case4: live dir has staged content with intact MEMORY.md"
else
  fail "case4: live dir missing MEMORY.md or staged content after commit"
fi
PREVD="$(ls -1d "$MEMD".prev.* 2>/dev/null | head -1 || true)"
if [ -n "$PREVD" ] && [ -d "$PREVD" ] && grep -q 'old content' "$PREVD/alpha.md" 2>/dev/null; then
  pass "case4: <memdir>.prev.<ts> dir holds the old content"
else
  fail "case4: no .prev dir with the old content (got: ${PREVD:-none})"
fi
if ls "$MEMD"/MEMORY.md.prev.* >/dev/null 2>&1; then
  fail "case4: stray MEMORY.md.prev.* inside live dir (mem leak regression)"
else
  pass "case4: no MEMORY.md.prev.* inside the new live dir"
fi

# =============================================================================
# CASE 5 — FREEZE (Task 1.2, criterion 5): a [[link]] whose target lives ONLY in
#   archive/<slug>.md is a legal cold link -> the exact `ok    no dangling
#   wikilinks` line, exit 0. (The archive-aware dangling arm is the SOLE link-
#   removal authority; this pins it against future edits. cold is a link-only
#   target, NOT an index row, so this isolates the dangling-LINK path from the
#   row hard-fail exercised by case1/temp-break2.)
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "hub"
printf '# hub\nlinks a cold lesson [[cold]].\n' > "$D/hub.md"
printf '# cold (archived)\ncold lesson body.\n' > "$D/archive/cold.md"

OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -q 'ok    no dangling wikilinks'; then
  pass "case5: [[cold]] resolving only into archive/ -> 'ok    no dangling wikilinks' (exit 0)"
else
  fail "case5: expected archive-only link accepted as not-dangling, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# CASE 6 — FREEZE (Task 1.2, criterion 5): a [[link]] to a slug in NEITHER hot
#   NOR archive/ IS flagged (`WARN  wikilinks with no target file … ghost`). It
#   is a WARN, not a hard-fail: ghost is a link target only (no index row), so
#   exit stays 0 — this pins the dangling-link WARN independently of the missing-
#   ROW hard-fail (case2).
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "hub"
printf '# hub\nlinks a nonexistent lesson [[ghost]].\n' > "$D/hub.md"
# NOTE: ghost exists nowhere — not hot, not in archive/, and NOT an index row.

OUT="$(bash "$SCRIPT" verify "$D" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -q 'wikilinks with no target file.*ghost'; then
  pass "case6: [[ghost]] in neither hot nor archive/ -> flagged dangling WARN (exit 0, not a row hard-fail)"
else
  fail "case6: expected dangling WARN naming ghost with exit 0, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# TEMP-BREAK 3 — the archive arm of resolves_in() is load-bearing for the
#   dangling-LINK path (delete-and-trace for case5). Strip the `|| [ -f archive ]`
#   fallback in a copy; case5's archive-only [[cold]] link must now be flagged as
#   dangling. If it still reports clean, the freeze is inert. (temp-break2 proves
#   the same arm via the ROW hard-fail; this proves it via the dangling WARN.)
# =============================================================================
D="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$D/MEMORY.md"
add_row "$D" "hub"
printf '# hub\nlinks a cold lesson [[cold]].\n' > "$D/hub.md"
printf '# cold (archived)\ncold lesson body.\n' > "$D/archive/cold.md"

BROKEN3="$(mktemp 2>/dev/null || mktemp -t swapbrk3)"; TMPFILES="$TMPFILES $BROKEN3"
node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");const t=s.replaceAll(" || [ -f \"$1/archive/$2.md\" ]","");if(t===s){console.error("temp-break3 replace no-op");process.exit(3)}fs.writeFileSync(process.argv[2],t)' "$SCRIPT" "$BROKEN3" || fail "temp-break3: literal replace was a no-op (source line changed?)"
OUT="$(bash "$BROKEN3" verify "$D" 2>&1)"; RC=$?
if printf '%s' "$OUT" | grep -q 'wikilinks with no target file.*cold'; then
  pass "temp-break3: without archive fallback, [[cold]] flagged dangling -> archive arm is load-bearing for links"
else
  fail "temp-break3: disabling archive fallback did NOT flag [[cold]] as dangling (freeze inert?), rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# =============================================================================
# CASE 7 — Rule 3 (repo-completeness) — the #891 wholesale-[repo]-drop detector.
#   One shared repo dir (RD, one hot lesson) + a zero-[repo]-row staging (SD, an
#   otherwise-clean local corpus). Arms mapped 1:1 to plan End states 2-7.
# =============================================================================
RD="$(mkmem)"                       # stand-in repo root: one top-level hot lesson
printf '# a repo lesson\nbody.\n' > "$RD/some-repo-lesson.md"
SD="$(mkmem)"                       # staging: clean local corpus, ZERO [repo] rows
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$SD/MEMORY.md"
add_row "$SD" "alpha"
printf '# alpha\nhot.\n' > "$SD/alpha.md"

# --- FAIL arm (End state 2): populated repo root + zero [repo] rows -> hard fail.
#     Three separate assertions: nonzero exit; a FAIL line naming the repo root;
#     the VERIFY: FAIL trailer (the no-premature-death proof — a set -e death
#     before the report tail also exits nonzero, and RC+trailer together catch a
#     FAIL line whose FAILED=1 was forgotten).
OUT="$(CLAUDE_MEMORY_REPO="$RD" bash "$SCRIPT" verify "$SD" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ]; then
  pass "case7-fail: zero-[repo]-row projection vs populated repo root -> nonzero exit ($RC)"
else
  fail "case7-fail: expected nonzero exit, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
if printf '%s' "$OUT" | grep 'FAIL' | grep -qF "$RD"; then
  pass "case7-fail: a FAIL line names the repo root"
else
  fail "case7-fail: no FAIL line naming the repo root $RD:"; printf '%s\n' "$OUT" >&2
fi
if printf '%s' "$OUT" | grep -q 'VERIFY: FAIL'; then
  pass "case7-fail: prints the VERIFY: FAIL trailer (no premature set -e death)"
else
  fail "case7-fail: missing VERIFY: FAIL trailer (died before the report tail?):"; printf '%s\n' "$OUT" >&2
fi

# --- Legacy-invisibility arm (End state 6): same zero-[repo]-row fixture, env
#     UNSET -> exit 0 and NO repo-completeness output line (legacy byte-identical).
#     Run BEFORE the PASS arm mutates SD.
OUT="$(bash "$SCRIPT" verify "$SD" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && ! printf '%s' "$OUT" | grep -qE '\[repo\]|CLAUDE_MEMORY_REPO'; then
  pass "case7-legacy: env unset -> exit 0, zero repo-completeness output (silent skip)"
else
  fail "case7-legacy: env unset should be a silent skip, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# --- PASS arm (End state 3): add one gamma-style [repo] row (CASE 1's fixture
#     pattern) -> exit 0, VERIFY: PASS, no FAIL line.
add_row "$SD" "gamma" "[repo]"
OUT="$(CLAUDE_MEMORY_REPO="$RD" bash "$SCRIPT" verify "$SD" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -q 'VERIFY: PASS' \
   && ! printf '%s' "$OUT" | grep -q 'FAIL'; then
  pass "case7-pass: one [repo] row present -> VERIFY: PASS (exit 0), no FAIL line"
else
  fail "case7-pass: expected PASS/exit0/no-FAIL, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# --- WARN arm (End state 4): CLAUDE_MEMORY_REPO set to a NONEXISTENT path (a
#     child of RD that was never created) -> exit 0 + a WARN naming the path,
#     never a FAIL. SD (now with a valid [repo] row) is otherwise clean.
NOPATH="$RD/no-such-repo-root"
OUT="$(CLAUDE_MEMORY_REPO="$NOPATH" bash "$SCRIPT" verify "$SD" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep 'WARN' | grep -qF "$NOPATH" \
   && ! printf '%s' "$OUT" | grep -q 'FAIL'; then
  pass "case7-warn: nonexistent repo path -> WARN naming it, exit 0, no FAIL"
else
  fail "case7-warn: expected WARN/exit0/no-FAIL for a non-dir repo path, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# --- Empty-repo-root skip arm (End state 5): a repo dir holding ONLY archive/
#     content plus a MEMORY.md (no other top-level *.md) does not arm the check —
#     one fixture exercising non-recursion (archive/ ignored) AND the MEMORY.md
#     exclusion. Uses a fresh zero-[repo]-row staging (SD2) that WOULD fail against
#     a populated root, proving the hot-lesson predicate is load-bearing.
EMPTYREPO="$(mkmem)"
printf '# projection\n' > "$EMPTYREPO/MEMORY.md"
printf '# cold\narchived body.\n' > "$EMPTYREPO/archive/cold.md"
SD2="$(mkmem)"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$SD2/MEMORY.md"
add_row "$SD2" "alpha"
printf '# alpha\nhot.\n' > "$SD2/alpha.md"
OUT="$(CLAUDE_MEMORY_REPO="$EMPTYREPO" bash "$SCRIPT" verify "$SD2" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ] && ! printf '%s' "$OUT" | grep -q 'FAIL'; then
  pass "case7-skip: empty repo root (only MEMORY.md + archive/) -> no fail (hot-lesson predicate load-bearing)"
else
  fail "case7-skip: empty repo root should be a skip, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi

# --- Commit-gate arm (End state 7): the check lives in the SHARED do_verify, so
#     `commit`'s pre-swap re-verify refuses a zero-[repo]-row staging too. Reuse
#     CASE 4's stage/commit wrapper. Reds if the check landed in the `verify`
#     dispatch branch instead of do_verify (commit would then swap through).
CWRAP="$(mktemp -d 2>/dev/null || mktemp -d -t swapcommit7)"; TMPFILES="$TMPFILES $CWRAP"
CMEMD="$CWRAP/memory"
mkdir -p "$CMEMD/archive"
printf '# MEMORY\n\n| slug | phase | summary |\n|--|--|--|\n' > "$CMEMD/MEMORY.md"
add_row "$CMEMD" "alpha"
printf '# alpha\ncontent.\n' > "$CMEMD/alpha.md"
OUT="$(bash "$SCRIPT" stage "$CMEMD" 2>&1)"; RC=$?
[ "$RC" -eq 0 ] || { fail "case7-commit: stage failed, rc=$RC:"; printf '%s\n' "$OUT" >&2; }
OUT="$(CLAUDE_MEMORY_REPO="$RD" bash "$SCRIPT" commit "$CMEMD" 2>&1)"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q 'NOT swapping'; then
  pass "case7-commit: zero-[repo]-row staging + populated repo root -> commit refuses swap (check in shared do_verify)"
else
  fail "case7-commit: expected commit to refuse the swap, got rc=$RC:"; printf '%s\n' "$OUT" >&2
fi
if [ -f "$CMEMD/MEMORY.md" ] && ! ls "$CMEMD".prev.* >/dev/null 2>&1; then
  pass "case7-commit: live dir untouched (no swap, no .prev)"
else
  fail "case7-commit: live dir mutated despite failed verification"
fi

# --- summary ------------------------------------------------------------------
echo ""
echo "$PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "safe-swap.test.sh: FAIL"
  exit 1
fi
echo "safe-swap.test.sh: PASS"
