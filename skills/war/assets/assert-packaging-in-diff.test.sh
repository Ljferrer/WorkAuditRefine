#!/usr/bin/env bash
# Tests for assert-packaging-in-diff.sh — the WAR packaging-floor guard.
#
# Plain-bash over throwaway mktemp git repos; one fresh fixture per case.
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Every spec §10.1 case, each written so it FAILS WITHOUT the feature
# (delete-it-mentally check — weak-test-assertion lesson):
#   1.  incident repro — added file beside enumerated COPYs, no COPY -> exit 1,
#       the F -> D pair listed on stdout (load-bearing: asserts the pair text).
#   2.  test_loader.py excluded via .dockerignore -> exit 0.
#   3.  wildcard `COPY *.py .` coverage -> exit 0.
#   4.  `COPY . .` whole-dir -> exit 0.
#   5.  `COPY --from=build ...` source ignored -> the added file STILL flags
#       (exit 1) — a stage copy is not a context read.
#   6.  no Dockerfile -> exit 0.
#   7.  bad ref -> exit 2 (never misclassified as "nothing flagged").
#   8.  unparseable .dockerignore line (`!` negation) -> still exit 1.
# Plus contract-parity cases the plan slice names explicitly:
#   9.  A-and-R-only: a pure MODIFICATION beside enumerated COPYs -> exit 0
#       (only A/R target paths flag; M never does).
#   10. rename TARGET into an enumerated-COPY dir -> exit 1 (R path flags).
#   11. .. traversal in base arg -> exit 2 via the guard, message on stderr
#       (load-bearing: distinguishes the guard from a plain bad-ref error).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-packaging-in-diff.sh"

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

# setup_repo: fresh git repo with a seed commit; echo its path.
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

# run_floor <repo> <base> <branch> -> sets RC and OUT (stdout); stderr -> ERR.
# Always run from an UNRELATED clean cwd (memory: relative-path-test-needs-clean-cwd).
run_floor() {
  rf_repo="$1"; rf_base="$2"; rf_branch="$3"
  cwd="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $cwd"
  RC=0
  OUT="$( ( cd "$cwd" && bash "$SCRIPT" "$rf_base" "$rf_branch" --repo "$rf_repo" ) 2>/tmp/pkg_err_$$ )" || RC=$?
  ERR="$(cat /tmp/pkg_err_$$ 2>/dev/null)"; rm -f /tmp/pkg_err_$$
}

# ---------------------------------------------------------------------------
# Case 1: incident repro — the field bug, exactly.
# base has Dockerfile that COPYs loader.py INDIVIDUALLY (enumerated style).
# branch ADDS case_metadata.py beside it, with NO new COPY -> flag, exit 1,
# and the "case_metadata.py -> app/Dockerfile" pair on stdout.
# WITHOUT the feature: nothing computes the miss -> exit 0, pair absent.
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
mkdir -p "$R1/app"
printf 'loader\n' > "$R1/app/loader.py"
cat > "$R1/app/Dockerfile" <<'DF'
FROM python:3.12
WORKDIR /app
COPY loader.py /app/loader.py
CMD ["python", "loader.py"]
DF
git -C "$R1" add app/loader.py app/Dockerfile
git -C "$R1" commit -qm "loader + enumerated Dockerfile"
BASE1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -qb task/add-metadata 2>/dev/null
printf 'meta\n' > "$R1/app/case_metadata.py"
git -C "$R1" add app/case_metadata.py
git -C "$R1" commit -qm "add case_metadata.py (no COPY — the incident)"
TASK1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -q - 2>/dev/null

run_floor "$R1" "$BASE1" "$TASK1"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "app/case_metadata.py -> app/Dockerfile"; then
  pass "case 1: incident repro -> exit 1 + pair 'app/case_metadata.py -> app/Dockerfile' on stdout"
elif [ "$RC" -ne 1 ]; then
  fail "case 1: incident repro -> expected exit 1, got $RC (feature missing: miss not computed)"
else
  fail "case 1: incident repro -> exit 1 but pair absent on stdout (got: $OUT)"
fi

# ---------------------------------------------------------------------------
# Case 2: .dockerignore clearance -> exit 0.
# Same enumerated Dockerfile; branch adds test_loader.py AND a .dockerignore
# line excluding it. Docker itself honors .dockerignore, so the floor passes.
# WITHOUT the .dockerignore step: the file would flag -> exit 1 != 0.
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
mkdir -p "$R2/app"
printf 'loader\n' > "$R2/app/loader.py"
cat > "$R2/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
DF
git -C "$R2" add app/loader.py app/Dockerfile
git -C "$R2" commit -qm "loader + enumerated Dockerfile"
BASE2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -qb task/add-test 2>/dev/null
printf 'test\n' > "$R2/app/test_loader.py"
printf 'test_loader.py\n' > "$R2/app/.dockerignore"
git -C "$R2" add app/test_loader.py app/.dockerignore
git -C "$R2" commit -qm "add test_loader.py + dockerignore it"
TASK2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -q - 2>/dev/null

run_floor "$R2" "$BASE2" "$TASK2"
if [ "$RC" -eq 0 ]; then
  pass "case 2: .dockerignore clearance (test_loader.py) -> exit 0"
else
  fail "case 2: .dockerignore clearance -> expected exit 0, got $RC (out: $OUT) — .dockerignore step not honored"
fi

# ---------------------------------------------------------------------------
# Case 3: wildcard COPY *.py . coverage -> exit 0.
# Dockerfile COPYs *.py (glob) — a NEW .py in the same dir is covered.
# BUT it must ALSO have >=1 enumerated (literal-file) COPY so step 1 fires;
# otherwise the file passes at step 1 vacuously and the case is not load-bearing
# for step-2 coverage. So: `COPY loader.py .` (enumerated) + `COPY *.py .` (glob).
# WITHOUT step-2 glob coverage: the new .py flags -> exit 1 != 0.
# ---------------------------------------------------------------------------
R3="$(setup_repo)"
mkdir -p "$R3/svc"
printf 'loader\n' > "$R3/svc/loader.py"
cat > "$R3/svc/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
COPY *.py ./
DF
git -C "$R3" add svc/loader.py svc/Dockerfile
git -C "$R3" commit -qm "enumerated + wildcard COPY"
BASE3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -qb task/add-py 2>/dev/null
printf 'meta\n' > "$R3/svc/case_metadata.py"
git -C "$R3" add svc/case_metadata.py
git -C "$R3" commit -qm "add .py covered by *.py glob"
TASK3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -q - 2>/dev/null

run_floor "$R3" "$BASE3" "$TASK3"
if [ "$RC" -eq 0 ]; then
  pass "case 3: wildcard 'COPY *.py .' covers new .py -> exit 0"
else
  fail "case 3: wildcard coverage -> expected exit 0, got $RC (out: $OUT) — glob coverage not applied"
fi

# ---------------------------------------------------------------------------
# Case 4: COPY . . whole-dir -> exit 0.
# A Dockerfile that COPYs the whole context is self-maintaining. To be load-
# bearing for step 2 (not vacuous at step 1), it ALSO has an enumerated COPY.
# WITHOUT dir-copy coverage: the new file flags -> exit 1 != 0.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
mkdir -p "$R4/whole"
printf 'loader\n' > "$R4/whole/loader.py"
cat > "$R4/whole/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
COPY . .
DF
git -C "$R4" add whole/loader.py whole/Dockerfile
git -C "$R4" commit -qm "enumerated + whole-dir COPY"
BASE4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -qb task/add-whole 2>/dev/null
printf 'meta\n' > "$R4/whole/case_metadata.py"
git -C "$R4" add whole/case_metadata.py
git -C "$R4" commit -qm "add file covered by COPY . ."
TASK4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -q - 2>/dev/null

run_floor "$R4" "$BASE4" "$TASK4"
if [ "$RC" -eq 0 ]; then
  pass "case 4: whole-dir 'COPY . .' covers new file -> exit 0"
else
  fail "case 4: whole-dir coverage -> expected exit 0, got $RC (out: $OUT) — COPY . . not treated as covering"
fi

# ---------------------------------------------------------------------------
# Case 5: COPY --from=build source ignored -> STILL flags (exit 1).
# A multi-stage Dockerfile whose ONLY line naming the new file's dir is a
# `COPY --from=build ...` (a stage copy, not a context read). The enumerated
# `COPY loader.py` makes step 1 fire. The --from line must be IGNORED, so the
# new file is NOT covered -> flag, exit 1.
# WITHOUT --from ignoring: the --from source would (wrongly) cover the file ->
# exit 0 != 1. (Load-bearing: a naive parser that counts --from sources passes.)
# ---------------------------------------------------------------------------
R5="$(setup_repo)"
mkdir -p "$R5/ms"
printf 'loader\n' > "$R5/ms/loader.py"
# `COPY --from=build . .` is a whole-dir copy FROM A STAGE — must be ignored
# (stage copy, not a context read). If the parser wrongly counted it, its `. .`
# form would (wrongly) cover EVERY context file incl. case_metadata.py -> exit 0.
# The enumerated `COPY loader.py` makes step 1 fire.
cat > "$R5/ms/Dockerfile" <<'DF'
FROM python:3.12 AS build
WORKDIR /src
COPY loader.py loader.py
RUN echo build

FROM python:3.12
WORKDIR /app
COPY loader.py loader.py
COPY --from=build . .
DF
git -C "$R5" add ms/loader.py ms/Dockerfile
git -C "$R5" commit -qm "multi-stage with --from copy"
BASE5="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" checkout -qb task/add-ms 2>/dev/null
printf 'meta\n' > "$R5/ms/case_metadata.py"
git -C "$R5" add ms/case_metadata.py
git -C "$R5" commit -qm "add file only 'covered' by a --from stage copy"
TASK5="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" checkout -q - 2>/dev/null

run_floor "$R5" "$BASE5" "$TASK5"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "ms/case_metadata.py -> ms/Dockerfile"; then
  pass "case 5: COPY --from source ignored -> file still flags (exit 1)"
elif [ "$RC" -eq 0 ]; then
  fail "case 5: COPY --from -> expected exit 1, got 0 — --from source wrongly counted as coverage"
else
  fail "case 5: COPY --from -> expected exit 1 with pair, got RC=$RC out=$OUT"
fi

# ---------------------------------------------------------------------------
# Case 6: no Dockerfile -> exit 0.
# branch adds a source file; the repo has NO Dockerfile at all.
# ---------------------------------------------------------------------------
R6="$(setup_repo)"
BASE6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -qb task/no-dockerfile 2>/dev/null
printf 'src\n' > "$R6/impl.py"
git -C "$R6" add impl.py
git -C "$R6" commit -qm "add impl, no Dockerfile anywhere"
TASK6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -q - 2>/dev/null

run_floor "$R6" "$BASE6" "$TASK6"
if [ "$RC" -eq 0 ]; then
  pass "case 6: no Dockerfile -> exit 0 (trivial no-op)"
else
  fail "case 6: no Dockerfile -> expected exit 0, got $RC (out: $OUT)"
fi

# ---------------------------------------------------------------------------
# Case 7: bad ref -> exit 2 (git error, NEVER misclassified as "nothing flagged").
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
BASE7="$(git -C "$R7" rev-parse HEAD)"
run_floor "$R7" "$BASE7" "no-such-branch-xyz"
if [ "$RC" -eq 2 ]; then
  pass "case 7: bad ref -> exit 2 (git error, not a clean pass)"
else
  fail "case 7: bad ref -> expected exit 2, got $RC (misclassified git error)"
fi

# ---------------------------------------------------------------------------
# Case 8: unparseable .dockerignore line (`!` negation) -> STILL exit 1 (D10).
# Enumerated Dockerfile; branch adds case_metadata.py; the .dockerignore has
# ONLY a `!` negation (unsupported) — per D10 that is NOT excluding, so the
# file still flags. WITHOUT D10 fail-closed: a parser that treats the `!` line
# as excluding (or that swallows the file) -> exit 0 != 1.
# ---------------------------------------------------------------------------
R8="$(setup_repo)"
mkdir -p "$R8/app"
printf 'loader\n' > "$R8/app/loader.py"
cat > "$R8/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
DF
git -C "$R8" add app/loader.py app/Dockerfile
git -C "$R8" commit -qm "enumerated Dockerfile"
BASE8="$(git -C "$R8" rev-parse HEAD)"
git -C "$R8" checkout -qb task/bad-ignore 2>/dev/null
printf 'meta\n' > "$R8/app/case_metadata.py"
# `!case_metadata.py` is a negation (un-ignore) — unsupported -> NOT excluding.
printf '!case_metadata.py\n' > "$R8/app/.dockerignore"
git -C "$R8" add app/case_metadata.py app/.dockerignore
git -C "$R8" commit -qm "add file + unparseable (!) dockerignore line"
TASK8="$(git -C "$R8" rev-parse HEAD)"
git -C "$R8" checkout -q - 2>/dev/null

run_floor "$R8" "$BASE8" "$TASK8"
if [ "$RC" -eq 1 ]; then
  pass "case 8: unparseable '!' .dockerignore line -> NOT excluding, still exit 1 (D10 fail-closed)"
else
  fail "case 8: unparseable ignore line -> expected exit 1, got $RC (out: $OUT) — D10 fail-closed violated"
fi

# ---------------------------------------------------------------------------
# Case 9: A-and-R-only contract — a pure MODIFICATION never flags.
# The enumerated Dockerfile already COPYs loader.py; case_metadata.py already
# EXISTS on base (also enumerated-COPY'd is not needed — it's the MOD target).
# branch only MODIFIES case_metadata.py (status M). M paths must never flag.
# WITHOUT the A/R filter (e.g. flagging all changed paths): case_metadata.py
# would flag -> exit 1 != 0.
# ---------------------------------------------------------------------------
R9="$(setup_repo)"
mkdir -p "$R9/app"
printf 'loader\n' > "$R9/app/loader.py"
printf 'meta v1\n' > "$R9/app/case_metadata.py"
cat > "$R9/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
DF
git -C "$R9" add app/loader.py app/case_metadata.py app/Dockerfile
git -C "$R9" commit -qm "loader + case_metadata (both exist) + enumerated Dockerfile"
BASE9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -qb task/modify-only 2>/dev/null
printf 'meta v2\n' > "$R9/app/case_metadata.py"
git -C "$R9" add app/case_metadata.py
git -C "$R9" commit -qm "MODIFY case_metadata.py (no add, no rename)"
TASK9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -q - 2>/dev/null

run_floor "$R9" "$BASE9" "$TASK9"
if [ "$RC" -eq 0 ]; then
  pass "case 9: pure modification (status M) never flags -> exit 0 (A/R-only contract)"
else
  fail "case 9: modification-only -> expected exit 0, got $RC (out: $OUT) — A/R filter not applied"
fi

# ---------------------------------------------------------------------------
# Case 10: rename TARGET flags. A file renamed INTO an enumerated-COPY dir with
# no COPY covering the new name -> the R target path flags (exit 1).
# WITHOUT R-target handling: a rename would be skipped -> exit 0 != 1.
# git detects the rename when content is identical; use -M (default threshold).
# ---------------------------------------------------------------------------
R10="$(setup_repo)"
mkdir -p "$R10/app"
printf 'loader\n' > "$R10/app/loader.py"
# helper.py exists at repo ROOT (outside app/), gets renamed INTO app/.
printf 'the-quick-brown-fox-jumps-over-the-lazy-dog-content-for-rename\n' > "$R10/helper.py"
cat > "$R10/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
DF
git -C "$R10" add app/loader.py helper.py app/Dockerfile
git -C "$R10" commit -qm "loader + root helper.py + enumerated Dockerfile"
BASE10="$(git -C "$R10" rev-parse HEAD)"
git -C "$R10" checkout -qb task/rename-in 2>/dev/null
git -C "$R10" mv helper.py app/helper.py
git -C "$R10" commit -qm "rename helper.py -> app/helper.py (into the COPY dir)"
TASK10="$(git -C "$R10" rev-parse HEAD)"
git -C "$R10" checkout -q - 2>/dev/null

run_floor "$R10" "$BASE10" "$TASK10"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "app/helper.py -> app/Dockerfile"; then
  pass "case 10: rename target into enumerated-COPY dir -> exit 1 (R path flags)"
elif [ "$RC" -eq 0 ]; then
  fail "case 10: rename target -> expected exit 1, got 0 — R-target path not treated as added"
else
  fail "case 10: rename target -> expected exit 1 with pair, got RC=$RC out=$OUT"
fi

# ---------------------------------------------------------------------------
# Case 11: .. traversal in base arg -> guard fires (exit 2 + distinctive
# message on stderr). LOAD-BEARING: a REAL flaggable add is on the branch, so
# without the guard git would run and either flag (exit 1) or bad-ref (a
# DIFFERENT stderr message). The guard's unique token distinguishes it.
# memory: relative-path-test-needs-clean-cwd (run_floor already cds to clean dir).
# ---------------------------------------------------------------------------
R11="$(setup_repo)"
mkdir -p "$R11/app"
printf 'loader\n' > "$R11/app/loader.py"
cat > "$R11/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py loader.py
DF
git -C "$R11" add app/loader.py app/Dockerfile
git -C "$R11" commit -qm "enumerated Dockerfile"
BASE11="$(git -C "$R11" rev-parse HEAD)"
git -C "$R11" checkout -qb task/dotdot 2>/dev/null
printf 'meta\n' > "$R11/app/case_metadata.py"
git -C "$R11" add app/case_metadata.py
git -C "$R11" commit -qm "add flaggable file (real)"
TASK11="$(git -C "$R11" rev-parse HEAD)"
git -C "$R11" checkout -q - 2>/dev/null

run_floor "$R11" "../$BASE11" "$TASK11"
if [ "$RC" -eq 2 ] && printf '%s' "$ERR" | grep -qF "refusing to use potentially unsafe ref"; then
  pass "case 11: .. traversal in base arg -> guard fires (exit 2 + guard message on stderr)"
elif [ "$RC" -ne 2 ]; then
  fail "case 11: .. traversal -> expected exit 2, got $RC (guard missing/bypassed; err: $ERR)"
else
  fail "case 11: .. traversal -> exit 2 but guard message absent on stderr (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-packaging-in-diff: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
