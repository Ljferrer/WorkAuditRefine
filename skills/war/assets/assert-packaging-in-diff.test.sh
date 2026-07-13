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
# Continuation join, parse-once inversion, and --advise-vacuous (this plan):
#   12. backslash-continued enumerated COPY, uncovered sibling -> exit 1 (RED
#       vs pre-change: base can't parse the continuation).
#   13. backslash-continued COPY covering the added sibling -> exit 0 (RED vs
#       pre-change: base flags the un-parsed coverage).
#   14. mid-continuation `#` comment dropped -> parity with case 12.
#   15. dangling final-line `\` -> no hang, tokens preserved (exit 0).
#   16. runtime parse_dockerfile invocation count == #Dockerfiles (2), never
#       F×D -> the delete-the-inversion lock (a static call-site count can't
#       catch a revert).
#   17. multi-F×multi-D flagged-pair SET (sorted) + pair-count equality.
#   18. --advise-vacuous + no-Dockerfile -> exit 0 + stderr advisory.
#   19. --advise-vacuous + Modified-only diff -> exit 0 + stderr advisory.
#   20. --advise-vacuous + flagged run -> exit 1, pair on stdout, NO advisory.
#   21. --advise-vacuous + entirely empty diff -> exit 0, stderr byte-empty.
#   22. no flag -> stderr silent on BOTH vacuous shapes (default byte-identical).
# (18/19 advisory lines are prose-locked to contain `ratified scope` + `ADR 0017`.)
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

# run_floor <repo> <base> <branch> [extra-args...] -> sets RC and OUT (stdout);
# stderr -> ERR. Extra args (e.g. --advise-vacuous) are forwarded after --repo.
# Always run from an UNRELATED clean cwd (memory: relative-path-test-needs-clean-cwd).
run_floor() {
  rf_repo="$1"; rf_base="$2"; rf_branch="$3"; shift 3
  cwd="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $cwd"
  RC=0
  OUT="$( ( cd "$cwd" && bash "$SCRIPT" "$rf_base" "$rf_branch" --repo "$rf_repo" "$@" ) 2>/tmp/pkg_err_$$ )" || RC=$?
  ERR="$(cat /tmp/pkg_err_$$ 2>/dev/null)"; rm -f /tmp/pkg_err_$$
}

# trace_parse_count <repo> <base> <branch> -> sets TRACE_N to the number of
# RUNTIME parse_dockerfile invocations (counted from bash -x xtrace). This locks
# the Dockerfile-outer/added-file-inner inversion: each Dockerfile must parse
# EXACTLY ONCE (total == #Dockerfiles), never once per (F,D) pair. A static
# call-site count can NOT catch a revert — the base already has one call site and
# the inversion only moves it — so the lock must count actual runtime calls.
trace_parse_count() {
  tp_repo="$1"; tp_base="$2"; tp_branch="$3"
  cwd="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $cwd"
  ( cd "$cwd" && bash -x "$SCRIPT" "$tp_base" "$tp_branch" --repo "$tp_repo" ) >/dev/null 2>"$cwd/xtrace.log" || true
  # xtrace emits `+ parse_dockerfile <path>` per invocation; the arg always ends
  # in a Dockerfile basename, which excludes the `parse_dockerfile() {` definition.
  TRACE_N="$(grep -cE 'parse_dockerfile ([^ ]*/)?Dockerfile' "$cwd/xtrace.log" 2>/dev/null || true)"
  [ -n "$TRACE_N" ] || TRACE_N=0
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
# Case 12: backslash-continuation, UNCOVERED sibling -> exit 1 + pair.
# The enumerated COPY spans four physical lines joined by trailing `\`. It
# enumerates loader.py/helper.py (into app/), but NOT the added case_metadata.py.
# RED vs the pre-change script (base-ref evidence in the worker done-report):
# the base tokenizer reads the broken physical lines, finds NO parseable source,
# and passes vacuously (exit 0); the continuation join is what lets step 1 fire.
# ---------------------------------------------------------------------------
R12="$(setup_repo)"
mkdir -p "$R12/app"
printf 'loader\n' > "$R12/app/loader.py"
printf 'helper\n' > "$R12/app/helper.py"
cat > "$R12/app/Dockerfile" <<'DF'
FROM python:3.12
WORKDIR /app
COPY \
    loader.py \
    helper.py \
    /app/
DF
git -C "$R12" add app/loader.py app/helper.py app/Dockerfile
git -C "$R12" commit -qm "enumerated COPY across a backslash continuation"
BASE12="$(git -C "$R12" rev-parse HEAD)"
git -C "$R12" checkout -qb task/cont-uncovered 2>/dev/null
printf 'meta\n' > "$R12/app/case_metadata.py"
git -C "$R12" add app/case_metadata.py
git -C "$R12" commit -qm "add uncovered sibling beside the continued COPY"
TASK12="$(git -C "$R12" rev-parse HEAD)"
git -C "$R12" checkout -q - 2>/dev/null

run_floor "$R12" "$BASE12" "$TASK12"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "app/case_metadata.py -> app/Dockerfile"; then
  pass "case 12: continuation join, uncovered sibling -> exit 1 + pair (RED vs pre-change)"
elif [ "$RC" -ne 1 ]; then
  fail "case 12: continuation uncovered -> expected exit 1, got $RC (join missing: continued COPY not parsed)"
else
  fail "case 12: continuation uncovered -> exit 1 but pair absent (out: $OUT)"
fi

# ---------------------------------------------------------------------------
# Case 13: backslash-continuation, COVERED sibling -> exit 0.
# A single-line enumerated `COPY loader.py` makes step 1 fire in BOTH scripts,
# then a CONTINUATION-spanning `COPY \ case_metadata.py \ /app/` provides the
# coverage. RED vs the pre-change script: base fires step 1 (via loader.py) but
# can't parse the continued coverage line -> flags (exit 1); the join covers it.
# ---------------------------------------------------------------------------
R13="$(setup_repo)"
mkdir -p "$R13/app"
printf 'loader\n' > "$R13/app/loader.py"
cat > "$R13/app/Dockerfile" <<'DF'
FROM python:3.12
WORKDIR /app
COPY loader.py /app/loader.py
COPY \
    case_metadata.py \
    /app/
DF
git -C "$R13" add app/loader.py app/Dockerfile
git -C "$R13" commit -qm "enumerated single-line + continued coverage COPY"
BASE13="$(git -C "$R13" rev-parse HEAD)"
git -C "$R13" checkout -qb task/cont-covered 2>/dev/null
printf 'meta\n' > "$R13/app/case_metadata.py"
git -C "$R13" add app/case_metadata.py
git -C "$R13" commit -qm "add sibling covered by the continued COPY"
TASK13="$(git -C "$R13" rev-parse HEAD)"
git -C "$R13" checkout -q - 2>/dev/null

run_floor "$R13" "$BASE13" "$TASK13"
if [ "$RC" -eq 0 ]; then
  pass "case 13: continuation join, covered sibling -> exit 0 (RED vs pre-change)"
else
  fail "case 13: continuation covered -> expected exit 0, got $RC (out: $OUT) — continued coverage not parsed"
fi

# ---------------------------------------------------------------------------
# Case 14: mid-continuation `#` comment parity. Same shape as case 12 but with a
# full-line comment BETWEEN two continued sources. Docker strips comments before
# joining continuations, so the parse (and thus the flag outcome) must be
# IDENTICAL to the comment-free case 12: exit 1, same pair. WITHOUT comment-
# dropping the comment splices into the logical line and corrupts the parse.
# ---------------------------------------------------------------------------
R14="$(setup_repo)"
mkdir -p "$R14/app"
printf 'loader\n' > "$R14/app/loader.py"
printf 'helper\n' > "$R14/app/helper.py"
cat > "$R14/app/Dockerfile" <<'DF'
FROM python:3.12
WORKDIR /app
COPY \
    loader.py \
# the sibling helper, pulled in explicitly
    helper.py \
    /app/
DF
git -C "$R14" add app/loader.py app/helper.py app/Dockerfile
git -C "$R14" commit -qm "continued COPY with a mid-continuation comment"
BASE14="$(git -C "$R14" rev-parse HEAD)"
git -C "$R14" checkout -qb task/cont-comment 2>/dev/null
printf 'meta\n' > "$R14/app/case_metadata.py"
git -C "$R14" add app/case_metadata.py
git -C "$R14" commit -qm "add uncovered sibling (comment must not change the parse)"
TASK14="$(git -C "$R14" rev-parse HEAD)"
git -C "$R14" checkout -q - 2>/dev/null

run_floor "$R14" "$BASE14" "$TASK14"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "app/case_metadata.py -> app/Dockerfile"; then
  pass "case 14: mid-continuation comment dropped -> parity with case 12 (exit 1 + same pair)"
else
  fail "case 14: mid-continuation comment -> expected exit 1 + pair like case 12, got RC=$RC out=$OUT"
fi

# ---------------------------------------------------------------------------
# Case 15: dangling final-line `\` -> no hang, no dropped tokens.
# The Dockerfile's LAST physical line ends in `\` (a dangling continuation). The
# join must terminate the logical line at EOF, PRESERVING that line's tokens so
# `COPY case_metadata.py /app/` still registers case_metadata.py as covered
# (exit 0). WITHOUT the EOF-emit those tokens are dropped -> the file flags
# (exit 1); so exit 0 here is the delete-the-EOF-terminator lock.
# ---------------------------------------------------------------------------
R15="$(setup_repo)"
printf 'loader\n' > "$R15/loader.py"
# Note: heredoc adds a trailing newline; the last CONTENT line ends in `\`.
cat > "$R15/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py /app/loader.py
COPY case_metadata.py /app/ \
DF
git -C "$R15" add loader.py Dockerfile
git -C "$R15" commit -qm "Dockerfile whose last line dangles on a backslash"
BASE15="$(git -C "$R15" rev-parse HEAD)"
git -C "$R15" checkout -qb task/dangling 2>/dev/null
printf 'meta\n' > "$R15/case_metadata.py"
git -C "$R15" add case_metadata.py
git -C "$R15" commit -qm "add file covered by the dangling-line COPY"
TASK15="$(git -C "$R15" rev-parse HEAD)"
git -C "$R15" checkout -q - 2>/dev/null

run_floor "$R15" "$BASE15" "$TASK15"
if [ "$RC" -eq 0 ]; then
  pass "case 15: dangling final-line backslash -> no hang, tokens preserved (exit 0)"
else
  fail "case 15: dangling backslash -> expected exit 0, got $RC (out: $OUT) — EOF-emit dropped the final tokens"
fi

# ---------------------------------------------------------------------------
# Case 16 + 17: multi-F x multi-D fixture. Two Dockerfiles (root + app/), three
# added files. Case 16 TRACES the runtime parse_dockerfile invocation count and
# asserts it equals the Dockerfile COUNT (2), never F×D — the delete-the-
# inversion lock (a revert to added-file-outer/parse-per-pair pushes the count
# to 5 here). Case 17 asserts the flagged-pair SET (sorted) plus pair-count,
# so a dropped pair cannot hide inside a reorder introduced by the inversion.
# ---------------------------------------------------------------------------
R16="$(setup_repo)"
printf 'root\n' > "$R16/root.py"
mkdir -p "$R16/app"
printf 'loader\n' > "$R16/app/loader.py"
cat > "$R16/Dockerfile" <<'DF'
FROM python:3.12
COPY root.py /root.py
DF
cat > "$R16/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py /app/loader.py
DF
git -C "$R16" add root.py app/loader.py Dockerfile app/Dockerfile
git -C "$R16" commit -qm "two Dockerfiles, each enumerated"
BASE16="$(git -C "$R16" rev-parse HEAD)"
git -C "$R16" checkout -qb task/multi 2>/dev/null
printf 'a\n' > "$R16/added_root.py"
printf 'b\n' > "$R16/app/added_app.py"
printf 'c\n' > "$R16/app/more.py"
git -C "$R16" add added_root.py app/added_app.py app/more.py
git -C "$R16" commit -qm "add three uncovered siblings across both contexts"
TASK16="$(git -C "$R16" rev-parse HEAD)"
git -C "$R16" checkout -q - 2>/dev/null

trace_parse_count "$R16" "$BASE16" "$TASK16"
if [ "$TRACE_N" -eq 2 ]; then
  pass "case 16: parse_dockerfile invoked once per Dockerfile (== 2), never F×D (runtime-trace inversion lock)"
else
  fail "case 16: expected 2 runtime parse_dockerfile invocations (== #Dockerfiles), got $TRACE_N (inversion reverted -> per-pair re-parse)"
fi

run_floor "$R16" "$BASE16" "$TASK16"
# Expected flagged SET (the pre-change set is identical — the inversion is
# set-preserving; compared sorted, never as a hand-written ordered block).
EXPECTED16="$(printf '%s\n' \
  "added_root.py -> Dockerfile" \
  "app/added_app.py -> app/Dockerfile" \
  "app/more.py -> app/Dockerfile" | sort)"
ACTUAL16="$(printf '%s' "$OUT" | grep -F ' -> ' | sort)"
ACTUAL16_N="$(printf '%s' "$OUT" | grep -cF ' -> ')"
if [ "$RC" -eq 1 ] && [ "$ACTUAL16" = "$EXPECTED16" ] && [ "$ACTUAL16_N" -eq 3 ]; then
  pass "case 17: multi-F×multi-D flagged-pair SET equal (sorted) + pair-count 3 (order-independent)"
else
  fail "case 17: multi-F×multi-D set/count mismatch -> RC=$RC count=$ACTUAL16_N
--- expected ---
$EXPECTED16
--- actual ---
$ACTUAL16"
fi

# ---------------------------------------------------------------------------
# Case 18: --advise-vacuous + no-Dockerfile -> exit 0 + ONE stderr advisory
# naming the no-Dockerfile shape and citing the ratified scope + ADR 0017.
# Reuses case 6's shape (added file, no Dockerfile anywhere).
# ---------------------------------------------------------------------------
R18="$(setup_repo)"
BASE18="$(git -C "$R18" rev-parse HEAD)"
git -C "$R18" checkout -qb task/advise-nodf 2>/dev/null
printf 'src\n' > "$R18/impl.py"
git -C "$R18" add impl.py
git -C "$R18" commit -qm "add impl, no Dockerfile"
TASK18="$(git -C "$R18" rev-parse HEAD)"
git -C "$R18" checkout -q - 2>/dev/null

run_floor "$R18" "$BASE18" "$TASK18" --advise-vacuous
if [ "$RC" -eq 0 ] \
   && printf '%s' "$ERR" | grep -qi 'no Dockerfile' \
   && printf '%s' "$ERR" | grep -qF 'ratified scope' \
   && printf '%s' "$ERR" | grep -qF 'ADR 0017'; then
  pass "case 18: --advise-vacuous + no-Dockerfile -> exit 0 + advisory (ratified scope, ADR 0017)"
else
  fail "case 18: --advise-vacuous no-Dockerfile -> RC=$RC, advisory/prose wrong (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 19: --advise-vacuous + Modified-only diff (non-empty diff_out, zero
# A/R/C) -> exit 0 + advisory naming the A/R/C-empty shape + prose lock.
# ---------------------------------------------------------------------------
R19="$(setup_repo)"
printf 'v1\n' > "$R19/a.py"
git -C "$R19" add a.py
git -C "$R19" commit -qm "seed a.py"
BASE19="$(git -C "$R19" rev-parse HEAD)"
git -C "$R19" checkout -qb task/advise-mod 2>/dev/null
printf 'v2\n' > "$R19/a.py"
git -C "$R19" add a.py
git -C "$R19" commit -qm "modify a.py only (M, no A/R/C)"
TASK19="$(git -C "$R19" rev-parse HEAD)"
git -C "$R19" checkout -q - 2>/dev/null

run_floor "$R19" "$BASE19" "$TASK19" --advise-vacuous
if [ "$RC" -eq 0 ] \
   && printf '%s' "$ERR" | grep -qiF 'no Added/Renamed/Copied' \
   && printf '%s' "$ERR" | grep -qF 'ratified scope' \
   && printf '%s' "$ERR" | grep -qF 'ADR 0017'; then
  pass "case 19: --advise-vacuous + Modified-only -> exit 0 + advisory (ratified scope, ADR 0017)"
else
  fail "case 19: --advise-vacuous Modified-only -> RC=$RC, advisory/prose wrong (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 20: --advise-vacuous on a FLAGGED run -> exit 1, unchanged stdout pairs,
# NO advisory (the flag surfaces only the two structural no-ops, never a flag).
# Reuses case 1's incident shape.
# ---------------------------------------------------------------------------
R20="$(setup_repo)"
mkdir -p "$R20/app"
printf 'loader\n' > "$R20/app/loader.py"
cat > "$R20/app/Dockerfile" <<'DF'
FROM python:3.12
COPY loader.py /app/loader.py
DF
git -C "$R20" add app/loader.py app/Dockerfile
git -C "$R20" commit -qm "enumerated Dockerfile"
BASE20="$(git -C "$R20" rev-parse HEAD)"
git -C "$R20" checkout -qb task/advise-flag 2>/dev/null
printf 'meta\n' > "$R20/app/case_metadata.py"
git -C "$R20" add app/case_metadata.py
git -C "$R20" commit -qm "add uncovered sibling (flags)"
TASK20="$(git -C "$R20" rev-parse HEAD)"
git -C "$R20" checkout -q - 2>/dev/null

run_floor "$R20" "$BASE20" "$TASK20" --advise-vacuous
if [ "$RC" -eq 1 ] \
   && printf '%s' "$OUT" | grep -qF "app/case_metadata.py -> app/Dockerfile" \
   && ! printf '%s' "$ERR" | grep -qi 'advisory'; then
  pass "case 20: --advise-vacuous + flagged run -> exit 1, pair on stdout, no advisory"
else
  fail "case 20: --advise-vacuous flagged -> RC=$RC out=$OUT err=$ERR (expected exit 1, pair, no advisory)"
fi

# ---------------------------------------------------------------------------
# Case 21: --advise-vacuous + entirely EMPTY diff -> exit 0, stderr BYTE-EMPTY.
# The empty-diff no-op must stay silent even with the flag (diff_out empty
# distinguishes it from a Modified-only diff). base==branch => empty diff.
# ---------------------------------------------------------------------------
R21="$(setup_repo)"
BASE21="$(git -C "$R21" rev-parse HEAD)"

run_floor "$R21" "$BASE21" "$BASE21" --advise-vacuous
if [ "$RC" -eq 0 ] && [ -z "$ERR" ]; then
  pass "case 21: --advise-vacuous + empty diff -> exit 0, stderr byte-empty (silent no-op)"
else
  fail "case 21: --advise-vacuous empty diff -> RC=$RC, expected silent (err: [$ERR])"
fi

# ---------------------------------------------------------------------------
# Case 22: WITHOUT the flag, both vacuous shapes stay stderr-SILENT (byte-
# identical to pre-change behavior). Reuses case 18 (no-Dockerfile) and case 19
# (Modified-only) inputs, run with NO --advise-vacuous.
# ---------------------------------------------------------------------------
run_floor "$R18" "$BASE18" "$TASK18"
NODF_SILENT=0
[ "$RC" -eq 0 ] && [ -z "$ERR" ] && NODF_SILENT=1
run_floor "$R19" "$BASE19" "$TASK19"
MOD_SILENT=0
[ "$RC" -eq 0 ] && [ -z "$ERR" ] && MOD_SILENT=1
if [ "$NODF_SILENT" -eq 1 ] && [ "$MOD_SILENT" -eq 1 ]; then
  pass "case 22: no --advise-vacuous -> stderr silent on BOTH vacuous shapes (default byte-identical)"
else
  fail "case 22: no-flag silence -> no-Dockerfile silent=$NODF_SILENT, Modified-only silent=$MOD_SILENT (expected both 1)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-packaging-in-diff: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
