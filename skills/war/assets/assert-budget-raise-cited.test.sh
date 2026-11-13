#!/usr/bin/env bash
# Tests for assert-budget-raise-cited.sh — the WAR Budget-Raise citation floor.
#
# Plain-bash over throwaway mktemp git repos; one fresh fixture per case, each
# seeding a miniature skills/war/assets/prompt-surface-budgets.test.mjs with a
# FILE_BUDGETS row and a WORKFLOW_LITERAL_BUDGET const, then branching a change.
# cwd-independent: invocations run from an unrelated mktemp cwd via --repo,
# except case 11, which deliberately runs from a fixture-repo subdirectory
# without --repo to pin the `:(top)` pathspec anchor.
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Cases (plan Phase 2 Task 1 fixture rows, exit in parens):
#   1. uncited FILE_BUDGETS raise (1) — a row's hard value goes UP, no trailer
#      -> exit 1, stderr names the uncited-raise route + the trailer form,
#      stdout byte-empty
#   2. uncited WORKFLOW_LITERAL_BUDGET raise (1) — the const's advisory value
#      goes UP, no trailer -> exit 1
#   3. trailerless ratchet-down (0) — a row's hard value goes DOWN, no trailer
#      -> exit 0 (lowering never owes a citation)
#   4. cited raise (0) — same raise as case 1 but the commit body carries
#      `Budget-Raise: ADR-0042 <surface> +<bytes>` -> exit 0
#   5. no ceiling touch (0) — the branch edits only a comment line in the
#      budget file (value lines byte-identical) -> exit 0; and a branch not
#      touching the file at all -> exit 0
#   6. DEFAULT-DENY future-sibling coverage (1): an UNKEYED ceiling value line
#      (neither a quoted-path row nor a `const NAME` decl) changes its value,
#      no trailer -> exit 1 — the floor refuses to guess, covering shapes no
#      floor edit anticipated
#   7. git error (2): unresolvable branch ref -> exit 2 with the die message —
#      NEVER collapsing into the floor's exit-1 route (ADR 0006)
#   8. .. traversal in a ref arg -> non-zero with the guard's distinctive
#      "refusing to use potentially unsafe ref" message (fires before git)
#   9. new constant added (0): a brand-new sibling const lands with initial
#      values, no trailer -> exit 0 (nothing existing was raised)
#  10. inline-comment decoy (1/1/0): a raise whose value line carries a
#      same-line trailing `// was hard: <old>` comment naming the OLD value,
#      no trailer -> exit 1 on BOTH the WORKFLOW_LITERAL_BUDGET const arm and
#      the FILE_BUDGETS row arm (the greedy-extraction bypass must stay
#      closed); and a comment-only tail added to an UNKEYED value line with
#      the code unchanged -> exit 0 (comment-insensitive, no false suspect)
#  11. subdirectory cwd (1): the case-1 raise, invoked WITHOUT --repo from a
#      subdirectory of the fixture repo -> exit 1 — the fast-path pathspec is
#      `:(top)` anchored, so a subdirectory invocation cannot silently exit 0
#  12. merge-base failure (2): a PATH-shim git fails only `merge-base` (a
#      three-dot diff shares the merge-base computation, so unrelated
#      histories die at the diff step and cannot reach this guard) -> exit 2
#      with the `git merge-base failed` die message — NEVER collapsing into
#      the floor's exit-1 route (ADR 0006)
#  13. malformed trailer (1): the case-1 raise with a PARTIAL citation in the
#      commit body (`Budget-Raise:` lines missing the `+<bytes>` delta or the
#      ADR-0042 token) -> exit 1 — pins TRAILER_RE's required form
#  14. numeric-form (1/1/1): a row hard value written `100_000`, `0x13880` or
#      `1e5`, no trailer -> exit 1 — a non-integer token is unkeyed and
#      raise-suspect (#1732); 14d: a blank-separated `2000 + 500` const
#      value, no trailer -> exit 1; 14e: a row advisory value written
#      `1e5`, no trailer -> exit 1 (the check runs on each field)
#  15. rename (1/0/0/1): a renamed row whose hard value exceeds the largest
#      only-in-old hard value, no trailer -> exit 1 (rename-plus-raise); the
#      same rename with a lower value -> exit 0 (rename-plus-lowering, #1734);
#      15c: two only-in-old rows, a renamed value between them -> exit 0
#      (rename-largest-old-value); 15d: a renamed row with hard unchanged and
#      advisory raised 900 -> 950, no trailer -> exit 1 (rename-advisory-raise)
#  16. real-tree BUDGET_FILE parity: the script's BUDGET_FILE literal equals
#      the fixture path and `git ls-files --error-unmatch` finds it at this
#      repo's root (#1733)
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-budget-raise-cited.sh"

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

BUDGET_REL="skills/war/assets/prompt-surface-budgets.test.mjs"

# write_budget <repo> <row_hard> <row_advisory> <wf_hard> <wf_advisory>:
# write the miniature budget file with one FILE_BUDGETS row and the
# WORKFLOW_LITERAL_BUDGET const, mirroring the real file's line shapes.
write_budget() {
  _wb_repo="$1"; _wb_rh="$2"; _wb_ra="$3"; _wb_wh="$4"; _wb_wa="$5"
  mkdir -p "$_wb_repo/skills/war/assets"
  cat > "$_wb_repo/$BUDGET_REL" <<EOF
// miniature budget fixture — comment mentions hard ×1.25 and advisory ×1.10
const FILE_BUDGETS = {
  // post-shrink derivation comment
  'skills/war/SKILL.md': { hard: $_wb_rh, advisory: $_wb_ra },
};
// post-shrink derivation comment
const WORKFLOW_LITERAL_BUDGET = { hard: $_wb_wh, advisory: $_wb_wa };
EOF
}

# setup_repo: fresh git repo seeded with the baseline budget file; echo path.
# Baseline values: row hard=1000 advisory=900; workflow hard=2000 advisory=1800.
setup_repo() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t warbudget)"
  TMPFILES="$TMPFILES $T"
  git -C "$T" init -q
  git -C "$T" config user.email war@test.local
  git -C "$T" config user.name "WAR Test"
  git -C "$T" config commit.gpgsign false
  write_budget "$T" 1000 900 2000 1800
  git -C "$T" add "$BUDGET_REL"
  git -C "$T" commit -qm "seed budget file"
  printf '%s\n' "$T"
}

# fresh_cwd: unrelated mktemp dir to run from (cwd-independence).
fresh_cwd() {
  C="$(mktemp -d 2>/dev/null || mktemp -d -t warbudgetcwd)"
  TMPFILES="$TMPFILES $C"
  printf '%s\n' "$C"
}

# ---------------------------------------------------------------------------
# Case 1: uncited FILE_BUDGETS raise -> exit 1, stdout empty, stderr names the
# route and the trailer form.
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
BASE1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -qb task/raise-row 2>/dev/null
write_budget "$R1" 1200 900 2000 1800
git -C "$R1" add "$BUDGET_REL"
git -C "$R1" commit -qm "raise SKILL.md hard ceiling (no trailer)"
TASK1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -q - 2>/dev/null

cwd1="$(fresh_cwd)"
rc1=0
out1="$( ( cd "$cwd1" && bash "$SCRIPT" "$BASE1" "$TASK1" --repo "$R1" ) 2>/dev/null )" || rc1=$?
err1="$( ( cd "$cwd1" && bash "$SCRIPT" "$BASE1" "$TASK1" --repo "$R1" ) 2>&1 >/dev/null )" || true

if [ "$rc1" -eq 1 ]; then
  pass "case 1: uncited FILE_BUDGETS raise -> exit 1"
else
  fail "case 1: uncited FILE_BUDGETS raise -> expected exit 1, got $rc1"
fi
if [ -z "$out1" ]; then
  pass "case 1: exit-1 stdout is byte-empty"
else
  fail "case 1: expected empty stdout on exit 1, got: $out1"
fi
if printf '%s' "$err1" | grep -qF 'WITHOUT a Budget-Raise trailer' \
   && printf '%s' "$err1" | grep -qF 'Budget-Raise: ADR-0042 <surface> +<bytes>'; then
  pass "case 1: stderr names the uncited-raise route and the trailer form"
else
  fail "case 1: stderr missing route/trailer-form text; got: $err1"
fi

# ---------------------------------------------------------------------------
# Case 2: uncited WORKFLOW_LITERAL_BUDGET raise (advisory arm) -> exit 1.
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
BASE2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -qb task/raise-wf 2>/dev/null
write_budget "$R2" 1000 900 2000 1900
git -C "$R2" add "$BUDGET_REL"
git -C "$R2" commit -qm "raise workflow advisory ceiling (no trailer)"
TASK2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -q - 2>/dev/null

cwd2="$(fresh_cwd)"
rc2=0
( cd "$cwd2" && bash "$SCRIPT" "$BASE2" "$TASK2" --repo "$R2" ) >/dev/null 2>&1 || rc2=$?
if [ "$rc2" -eq 1 ]; then
  pass "case 2: uncited WORKFLOW_LITERAL_BUDGET raise -> exit 1"
else
  fail "case 2: uncited WORKFLOW_LITERAL_BUDGET raise -> expected exit 1, got $rc2"
fi

# ---------------------------------------------------------------------------
# Case 3: trailerless ratchet-down -> exit 0 (lowering never owes a citation).
# BOTH constants lowered to prove neither arm misfires on a decrease.
# ---------------------------------------------------------------------------
R3="$(setup_repo)"
BASE3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -qb task/ratchet-down 2>/dev/null
write_budget "$R3" 800 700 1500 1400
git -C "$R3" add "$BUDGET_REL"
git -C "$R3" commit -qm "ratchet ceilings down (no trailer needed)"
TASK3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -q - 2>/dev/null

cwd3="$(fresh_cwd)"
rc3=0
( cd "$cwd3" && bash "$SCRIPT" "$BASE3" "$TASK3" --repo "$R3" ) >/dev/null 2>&1 || rc3=$?
if [ "$rc3" -eq 0 ]; then
  pass "case 3: trailerless ratchet-down -> exit 0"
else
  fail "case 3: trailerless ratchet-down -> expected exit 0, got $rc3"
fi

# ---------------------------------------------------------------------------
# Case 4: cited raise -> exit 0. Same raise shape as case 1, but the commit
# body carries the well-formed trailer.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
BASE4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -qb task/cited-raise 2>/dev/null
write_budget "$R4" 1200 900 2000 1800
git -C "$R4" add "$BUDGET_REL"
git -C "$R4" commit -qm "raise SKILL.md hard ceiling

Budget-Raise: ADR-0042 skills/war/SKILL.md +200"
TASK4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -q - 2>/dev/null

cwd4="$(fresh_cwd)"
rc4=0
( cd "$cwd4" && bash "$SCRIPT" "$BASE4" "$TASK4" --repo "$R4" ) >/dev/null 2>&1 || rc4=$?
if [ "$rc4" -eq 0 ]; then
  pass "case 4: cited raise (Budget-Raise trailer in range) -> exit 0"
else
  fail "case 4: cited raise -> expected exit 0, got $rc4"
fi

# ---------------------------------------------------------------------------
# Case 5: no ceiling touch -> exit 0.
#   5a. comment-only edit inside the budget file (value lines byte-identical)
#   5b. branch that never touches the budget file at all
# ---------------------------------------------------------------------------
R5="$(setup_repo)"
BASE5="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" checkout -qb task/comment-only 2>/dev/null
printf '// trailing comment: hard ×1.25 arithmetic notes, no value change\n' >> "$R5/$BUDGET_REL"
git -C "$R5" add "$BUDGET_REL"
git -C "$R5" commit -qm "comment-only budget-file edit"
TASK5a="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" checkout -q - 2>/dev/null

cwd5="$(fresh_cwd)"
rc5a=0
( cd "$cwd5" && bash "$SCRIPT" "$BASE5" "$TASK5a" --repo "$R5" ) >/dev/null 2>&1 || rc5a=$?
if [ "$rc5a" -eq 0 ]; then
  pass "case 5a: comment-only budget-file edit -> exit 0"
else
  fail "case 5a: comment-only budget-file edit -> expected exit 0, got $rc5a"
fi

git -C "$R5" checkout -qb task/unrelated "$BASE5" 2>/dev/null
printf 'src\n' > "$R5/impl.js"
git -C "$R5" add impl.js
git -C "$R5" commit -qm "unrelated change"
TASK5b="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" checkout -q - 2>/dev/null

rc5b=0
( cd "$cwd5" && bash "$SCRIPT" "$BASE5" "$TASK5b" --repo "$R5" ) >/dev/null 2>&1 || rc5b=$?
if [ "$rc5b" -eq 0 ]; then
  pass "case 5b: budget file untouched -> exit 0"
else
  fail "case 5b: budget file untouched -> expected exit 0, got $rc5b"
fi

# ---------------------------------------------------------------------------
# Case 6: DEFAULT-DENY — an UNKEYED ceiling value line changes -> exit 1.
# The seeded line matches neither key shape ('path' row / const decl), so the
# floor cannot pair old/new values; any change to it must be treated as a
# raise-suspect requiring the trailer. This is the future-sibling coverage:
# a shape no floor edit anticipated still cannot move silently.
# ---------------------------------------------------------------------------
R6="$(setup_repo)"
printf 'let FUTURE_SHAPE = { hard: 500, advisory: 400 };\n' >> "$R6/$BUDGET_REL"
git -C "$R6" add "$BUDGET_REL"
git -C "$R6" commit -qm "seed unkeyed ceiling line"
BASE6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -qb task/unkeyed-change 2>/dev/null
sed 's/let FUTURE_SHAPE = { hard: 500, advisory: 400 };/let FUTURE_SHAPE = { hard: 600, advisory: 400 };/' \
  "$R6/$BUDGET_REL" > "$R6/$BUDGET_REL.tmp" && mv "$R6/$BUDGET_REL.tmp" "$R6/$BUDGET_REL"
git -C "$R6" add "$BUDGET_REL"
git -C "$R6" commit -qm "change unkeyed ceiling line (no trailer)"
TASK6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -q - 2>/dev/null

cwd6="$(fresh_cwd)"
rc6=0
( cd "$cwd6" && bash "$SCRIPT" "$BASE6" "$TASK6" --repo "$R6" ) >/dev/null 2>&1 || rc6=$?
if [ "$rc6" -eq 1 ]; then
  pass "case 6: unkeyed ceiling value-line change (default-deny) -> exit 1"
else
  fail "case 6: unkeyed ceiling value-line change -> expected exit 1 (default-deny), got $rc6"
fi

# ---------------------------------------------------------------------------
# Case 7: git error -> exit 2, NEVER the floor's exit-1 route (ADR 0006).
# An unresolvable branch ref must die with the exit-2 message; asserting the
# exact code distinguishes it from a collapse into "uncited raise".
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
BASE7="$(git -C "$R7" rev-parse HEAD)"

cwd7="$(fresh_cwd)"
rc7=0
err7="$( ( cd "$cwd7" && bash "$SCRIPT" "$BASE7" "no-such-branch" --repo "$R7" ) 2>&1 >/dev/null )" || rc7=$?
if [ "$rc7" -eq 2 ] && printf '%s' "$err7" | grep -qF 'git diff failed'; then
  pass "case 7: unresolvable ref -> exit 2 with die message (never collapses into exit 1)"
else
  fail "case 7: unresolvable ref -> expected exit 2 + 'git diff failed', got exit $rc7 (stderr: $err7)"
fi

# ---------------------------------------------------------------------------
# Case 8: .. traversal in a ref arg -> non-zero, guard message on stderr,
# fired BEFORE any git operation (mirrors the sibling floors' guard).
# ---------------------------------------------------------------------------
cwd8="$(fresh_cwd)"
rc8=0
err8="$( ( cd "$cwd8" && bash "$SCRIPT" "../$BASE7" "$BASE7" --repo "$R7" ) 2>&1 >/dev/null )" || rc8=$?
if [ "$rc8" -ne 0 ] && printf '%s' "$err8" | grep -qF 'refusing to use potentially unsafe ref'; then
  pass "case 8: .. traversal in ref arg -> guard fires (non-zero + guard message)"
else
  fail "case 8: .. traversal in ref arg -> expected guard rejection, got exit $rc8 (stderr: $err8)"
fi

# BRANCH arm of the same guard: the traversal token in the second positional
# must fire the identical rejection (the base arm alone does not prove it).
rc8b=0
err8b="$( ( cd "$cwd8" && bash "$SCRIPT" "$BASE7" "../$BASE7" --repo "$R7" ) 2>&1 >/dev/null )" || rc8b=$?
if [ "$rc8b" -ne 0 ] && printf '%s' "$err8b" | grep -qF 'refusing to use potentially unsafe ref'; then
  pass "case 8b: .. traversal in BRANCH arg -> guard fires (non-zero + guard message)"
else
  fail "case 8b: .. traversal in BRANCH arg -> expected guard rejection, got exit $rc8b (stderr: $err8b)"
fi

# ---------------------------------------------------------------------------
# Case 9: brand-new sibling constant with initial values, no trailer -> exit 0.
# A NEW keyed const introduces a ceiling; nothing existing was raised, so no
# citation is owed (the ratchet starts fresh at the new constant's values).
# ---------------------------------------------------------------------------
R9="$(setup_repo)"
BASE9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -qb task/new-const 2>/dev/null
printf '// post-shrink derivation comment\nconst NEW_SIBLING_BUDGET = { hard: 3000, advisory: 2800 };\n' >> "$R9/$BUDGET_REL"
git -C "$R9" add "$BUDGET_REL"
git -C "$R9" commit -qm "add new sibling budget constant"
TASK9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -q - 2>/dev/null

cwd9="$(fresh_cwd)"
rc9=0
( cd "$cwd9" && bash "$SCRIPT" "$BASE9" "$TASK9" --repo "$R9" ) >/dev/null 2>&1 || rc9=$?
if [ "$rc9" -eq 0 ]; then
  pass "case 9: new sibling constant added (nothing raised) -> exit 0"
else
  fail "case 9: new sibling constant added -> expected exit 0, got $rc9"
fi

# ---------------------------------------------------------------------------
# Case 10: inline-comment decoy. The extraction sed is greedy/leftmost-longest,
# so before the comment-strip a trailing `// was hard: <old>` note on the value
# line made the NEW side extract the OLD value — a silent exit-0 bypass of the
# floor's primary detection path. These arms pin the strip:
#   10a. WORKFLOW_LITERAL_BUDGET hard raise + `// was hard: <old>` tail,
#        no trailer -> exit 1
#   10b. FILE_BUDGETS row hard raise + `// prev hard: <old>` tail,
#        no trailer -> exit 1
#   10c. UNKEYED value line gains a trailing comment, code unchanged
#        -> exit 0 (comment-insensitive: no false raise-suspect)
# ---------------------------------------------------------------------------
R10="$(setup_repo)"
BASE10="$(git -C "$R10" rev-parse HEAD)"
git -C "$R10" checkout -qb task/comment-decoy-const 2>/dev/null
cat > "$R10/$BUDGET_REL" <<'EOF'
// miniature budget fixture — comment mentions hard ×1.25 and advisory ×1.10
const FILE_BUDGETS = {
  // post-shrink derivation comment
  'skills/war/SKILL.md': { hard: 1000, advisory: 900 },
};
// post-shrink derivation comment
const WORKFLOW_LITERAL_BUDGET = { hard: 2500, advisory: 1800 }; // was hard: 2000
EOF
git -C "$R10" add "$BUDGET_REL"
git -C "$R10" commit -qm "raise workflow hard ceiling with inline decoy comment (no trailer)"
TASK10a="$(git -C "$R10" rev-parse HEAD)"
git -C "$R10" checkout -q - 2>/dev/null

cwd10="$(fresh_cwd)"
rc10a=0
( cd "$cwd10" && bash "$SCRIPT" "$BASE10" "$TASK10a" --repo "$R10" ) >/dev/null 2>&1 || rc10a=$?
if [ "$rc10a" -eq 1 ]; then
  pass "case 10a: const raise with trailing '// was hard: <old>' decoy -> exit 1"
else
  fail "case 10a: const raise with inline decoy comment -> expected exit 1, got $rc10a"
fi

git -C "$R10" checkout -qb task/comment-decoy-row "$BASE10" 2>/dev/null
cat > "$R10/$BUDGET_REL" <<'EOF'
// miniature budget fixture — comment mentions hard ×1.25 and advisory ×1.10
const FILE_BUDGETS = {
  // post-shrink derivation comment
  'skills/war/SKILL.md': { hard: 1300, advisory: 900 }, // prev hard: 1000
};
// post-shrink derivation comment
const WORKFLOW_LITERAL_BUDGET = { hard: 2000, advisory: 1800 };
EOF
git -C "$R10" add "$BUDGET_REL"
git -C "$R10" commit -qm "raise row hard ceiling with inline decoy comment (no trailer)"
TASK10b="$(git -C "$R10" rev-parse HEAD)"
git -C "$R10" checkout -q - 2>/dev/null

rc10b=0
( cd "$cwd10" && bash "$SCRIPT" "$BASE10" "$TASK10b" --repo "$R10" ) >/dev/null 2>&1 || rc10b=$?
if [ "$rc10b" -eq 1 ]; then
  pass "case 10b: row raise with trailing '// prev hard: <old>' decoy -> exit 1"
else
  fail "case 10b: row raise with inline decoy comment -> expected exit 1, got $rc10b"
fi

R10c="$(setup_repo)"
printf 'let FUTURE_SHAPE = { hard: 500, advisory: 400 };\n' >> "$R10c/$BUDGET_REL"
git -C "$R10c" add "$BUDGET_REL"
git -C "$R10c" commit -qm "seed unkeyed ceiling line"
BASE10c="$(git -C "$R10c" rev-parse HEAD)"
git -C "$R10c" checkout -qb task/unkeyed-comment-tail 2>/dev/null
sed 's/let FUTURE_SHAPE = { hard: 500, advisory: 400 };/let FUTURE_SHAPE = { hard: 500, advisory: 400 }; \/\/ note: hard unchanged/' \
  "$R10c/$BUDGET_REL" > "$R10c/$BUDGET_REL.tmp" && mv "$R10c/$BUDGET_REL.tmp" "$R10c/$BUDGET_REL"
git -C "$R10c" add "$BUDGET_REL"
git -C "$R10c" commit -qm "add trailing comment to unkeyed ceiling line (code unchanged)"
TASK10c="$(git -C "$R10c" rev-parse HEAD)"
git -C "$R10c" checkout -q - 2>/dev/null

rc10c=0
( cd "$cwd10" && bash "$SCRIPT" "$BASE10c" "$TASK10c" --repo "$R10c" ) >/dev/null 2>&1 || rc10c=$?
if [ "$rc10c" -eq 0 ]; then
  pass "case 10c: comment-only tail on unkeyed value line -> exit 0"
else
  fail "case 10c: comment-only tail on unkeyed value line -> expected exit 0, got $rc10c"
fi

# ---------------------------------------------------------------------------
# Case 11: subdirectory cwd -> exit 1. The case-1 raise, invoked WITHOUT
# --repo from a subdirectory of the fixture repo itself. Git resolves a plain
# pathspec against the current directory prefix, so without the `:(top)`
# anchor the fast-path diff would match nothing and the floor would silently
# exit 0 — the exact fail-open class it exists to close. The --repo cases
# never reach this path (git -C always lands at the repo root).
# ---------------------------------------------------------------------------
rc11=0
( cd "$R1/skills/war/assets" && bash "$SCRIPT" "$BASE1" "$TASK1" ) >/dev/null 2>&1 || rc11=$?
if [ "$rc11" -eq 1 ]; then
  pass "case 11: uncited raise judged from a repo subdirectory -> exit 1 (no pathspec bypass)"
else
  fail "case 11: uncited raise from repo subdirectory -> expected exit 1, got $rc11"
fi

# ---------------------------------------------------------------------------
# Case 12: merge-base failure -> exit 2, NEVER the floor's exit-1 route
# (ADR 0006). A three-dot diff computes the same merge-base internally, so an
# unrelated-histories fixture dies at the diff step (case 7's path) and can
# never reach this guard; a PATH shim that fails ONLY `git merge-base` (and
# execs the real git for every other verb) is the one way to exercise it.
# ---------------------------------------------------------------------------
REAL_GIT="$(command -v git)"
shim12="$(fresh_cwd)"
cat > "$shim12/git" <<EOF
#!/usr/bin/env bash
for a in "\$@"; do
  if [ "\$a" = "merge-base" ]; then
    echo "fatal: shimmed merge-base failure" >&2
    exit 1
  fi
done
exec "$REAL_GIT" "\$@"
EOF
chmod +x "$shim12/git"

cwd12="$(fresh_cwd)"
rc12=0
err12="$( ( cd "$cwd12" && PATH="$shim12:$PATH" bash "$SCRIPT" "$BASE1" "$TASK1" --repo "$R1" ) 2>&1 >/dev/null )" || rc12=$?
if [ "$rc12" -eq 2 ] && printf '%s' "$err12" | grep -qF 'git merge-base failed'; then
  pass "case 12: merge-base failure -> exit 2 with die message (never collapses into exit 1)"
else
  fail "case 12: merge-base failure -> expected exit 2 + 'git merge-base failed', got exit $rc12 (stderr: $err12)"
fi

# ---------------------------------------------------------------------------
# Case 13: malformed trailer -> exit 1. Same raise as case 1, but the commit
# body carries only PARTIAL citations — one missing the `+<bytes>` delta, one
# missing the ADR-0042 token entirely. Pins TRAILER_RE's required form: every
# other exit-1 case has NO Budget-Raise line at all and the only exit-0
# citation (case 4) is well-formed, so without this arm the regex could be
# loosened to a bare `^Budget-Raise:` and all asserts would still pass.
# ---------------------------------------------------------------------------
R13="$(setup_repo)"
BASE13="$(git -C "$R13" rev-parse HEAD)"
git -C "$R13" checkout -qb task/malformed-trailer 2>/dev/null
write_budget "$R13" 1200 900 2000 1800
git -C "$R13" add "$BUDGET_REL"
git -C "$R13" commit -qm "raise SKILL.md hard ceiling

Budget-Raise: ADR-0042 skills/war/SKILL.md
Budget-Raise: see ADR 0042"
TASK13="$(git -C "$R13" rev-parse HEAD)"
git -C "$R13" checkout -q - 2>/dev/null

cwd13="$(fresh_cwd)"
rc13=0
( cd "$cwd13" && bash "$SCRIPT" "$BASE13" "$TASK13" --repo "$R13" ) >/dev/null 2>&1 || rc13=$?
if [ "$rc13" -eq 1 ]; then
  pass "case 13: partial Budget-Raise citation (no +<bytes> / no ADR token) -> exit 1"
else
  fail "case 13: partial Budget-Raise citation -> expected exit 1, got $rc13"
fi

# ---------------------------------------------------------------------------
# Case 14: numeric-form default-deny (#1732). A legal JS numeric literal that
# is not a plain `^[0-9]+$` integer, no trailer -> exit 1. A digit-only
# extraction truncated `100_000` to 100, `0x13880` to 0 and `1e5` to 1, so
# each of these raises read as a lowering and exited 0.
# ---------------------------------------------------------------------------
numeric_form_case() {
  _nf_id="$1"; _nf_val="$2"
  _nf_r="$(setup_repo)"
  _nf_base="$(git -C "$_nf_r" rev-parse HEAD)"
  git -C "$_nf_r" checkout -qb task/numeric-form 2>/dev/null
  write_budget "$_nf_r" "$_nf_val" 900 2000 1800
  git -C "$_nf_r" add "$BUDGET_REL"
  git -C "$_nf_r" commit -qm "raise SKILL.md hard ceiling as $_nf_val (no trailer)"
  _nf_task="$(git -C "$_nf_r" rev-parse HEAD)"
  git -C "$_nf_r" checkout -q - 2>/dev/null
  _nf_cwd="$(fresh_cwd)"
  _nf_rc=0
  ( cd "$_nf_cwd" && bash "$SCRIPT" "$_nf_base" "$_nf_task" --repo "$_nf_r" ) >/dev/null 2>&1 || _nf_rc=$?
  if [ "$_nf_rc" -eq 1 ]; then
    pass "case $_nf_id: numeric-form: $_nf_val -> exit 1 (non-integer token is raise-suspect)"
  else
    fail "case $_nf_id: numeric-form: $_nf_val -> expected exit 1, got $_nf_rc"
  fi
}
numeric_form_case 14a 100_000
numeric_form_case 14b 0x13880
numeric_form_case 14c 1e5

# Case 14d: a blank-separated expression on the WORKFLOW_LITERAL_BUDGET const,
# no trailer -> exit 1. A blank-stopped token read `2000 + 500` as `2000`,
# saw no change and exited 0. Its label stays outside the numeric-form count.
R14d="$(setup_repo)"
BASE14d="$(git -C "$R14d" rev-parse HEAD)"
git -C "$R14d" checkout -qb task/blank-expression 2>/dev/null
write_budget "$R14d" 1000 900 "2000 + 500" 1800
git -C "$R14d" add "$BUDGET_REL"
git -C "$R14d" commit -qm "raise workflow hard ceiling as 2000 + 500 (no trailer)"
TASK14d="$(git -C "$R14d" rev-parse HEAD)"
git -C "$R14d" checkout -q - 2>/dev/null
cwd14d="$(fresh_cwd)"
rc14d=0
( cd "$cwd14d" && bash "$SCRIPT" "$BASE14d" "$TASK14d" --repo "$R14d" ) >/dev/null 2>&1 || rc14d=$?
if [ "$rc14d" -eq 1 ]; then
  pass "case 14d: blank-separated expression: 2000 + 500 -> exit 1 (non-integer token is raise-suspect)"
else
  fail "case 14d: blank-separated expression: 2000 + 500 -> expected exit 1, got $rc14d"
fi

# Case 14e: the non-integer check runs per field, so an advisory value
# written `1e5`, no trailer -> exit 1. Its label stays outside the
# numeric-form count.
R14e="$(setup_repo)"
BASE14e="$(git -C "$R14e" rev-parse HEAD)"
git -C "$R14e" checkout -qb task/advisory-token 2>/dev/null
write_budget "$R14e" 1000 1e5 2000 1800
git -C "$R14e" add "$BUDGET_REL"
git -C "$R14e" commit -qm "raise SKILL.md advisory line as 1e5 (no trailer)"
TASK14e="$(git -C "$R14e" rev-parse HEAD)"
git -C "$R14e" checkout -q - 2>/dev/null
cwd14e="$(fresh_cwd)"
rc14e=0
( cd "$cwd14e" && bash "$SCRIPT" "$BASE14e" "$TASK14e" --repo "$R14e" ) >/dev/null 2>&1 || rc14e=$?
if [ "$rc14e" -eq 1 ]; then
  pass "case 14e: advisory-field token 1e5 -> exit 1 (non-integer advisory is raise-suspect)"
else
  fail "case 14e: advisory-field token 1e5 -> expected exit 1, got $rc14e"
fi

# ---------------------------------------------------------------------------
# Case 15: rename plus raise / rename plus lowering (#1734). The FILE_BUDGETS
# row is renamed, so its key exists on one side only. A new value above the
# largest only-in-old value in the same field is raise-suspect (15a, exit 1).
# A new value below it is a lowering and owes nothing (15b, exit 0 control).
# The optional fifth argument sets the renamed row's advisory (default 900).
# ---------------------------------------------------------------------------
rename_case() {
  _rn_id="$1"; _rn_label="$2"; _rn_hard="$3"; _rn_want="$4"; _rn_adv="${5:-900}"
  _rn_r="$(setup_repo)"
  _rn_base="$(git -C "$_rn_r" rev-parse HEAD)"
  git -C "$_rn_r" checkout -qb task/rename 2>/dev/null
  write_budget "$_rn_r" "$_rn_hard" "$_rn_adv" 2000 1800
  sed "s|'skills/war/SKILL.md'|'skills/war/RENAMED.md'|" \
    "$_rn_r/$BUDGET_REL" > "$_rn_r/$BUDGET_REL.tmp" && mv "$_rn_r/$BUDGET_REL.tmp" "$_rn_r/$BUDGET_REL"
  git -C "$_rn_r" add "$BUDGET_REL"
  git -C "$_rn_r" commit -qm "rename SKILL.md row, hard $_rn_hard (no trailer)"
  _rn_task="$(git -C "$_rn_r" rev-parse HEAD)"
  git -C "$_rn_r" checkout -q - 2>/dev/null
  _rn_cwd="$(fresh_cwd)"
  _rn_rc=0
  ( cd "$_rn_cwd" && bash "$SCRIPT" "$_rn_base" "$_rn_task" --repo "$_rn_r" ) >/dev/null 2>&1 || _rn_rc=$?
  if [ "$_rn_rc" -eq "$_rn_want" ]; then
    pass "case $_rn_id: $_rn_label (hard 1000 -> $_rn_hard) -> exit $_rn_want"
  else
    fail "case $_rn_id: $_rn_label (hard 1000 -> $_rn_hard) -> expected exit $_rn_want, got $_rn_rc"
  fi
}
rename_case 15a rename-plus-raise 1200 1
rename_case 15b rename-plus-lowering 800 0
# Case 15d: the rename compare is per field. Hard stays 1000 and advisory
# rises 900 -> 950 on the renamed row, no trailer -> exit 1. A cross-field
# max key (max 1000 over both fields) or a hard-only check exits 0 here.
rename_case 15d rename-advisory-raise 1000 1 950

# Case 15c: the rename compare reads the LARGEST only-in-old value. Two rows
# (SKILL.md hard 1000, OTHER.md hard 500) are seeded. The branch deletes
# OTHER.md and renames SKILL.md to RENAMED.md at hard 900: above the smallest
# only-in-old value, below the largest -> exit 0, no trailer.
R15c="$(setup_repo)"
cat > "$R15c/$BUDGET_REL" <<'EOF'
// miniature budget fixture — comment mentions hard ×1.25 and advisory ×1.10
const FILE_BUDGETS = {
  // post-shrink derivation comment
  'skills/war/SKILL.md': { hard: 1000, advisory: 900 },
  'skills/war/OTHER.md': { hard: 500, advisory: 400 },
};
// post-shrink derivation comment
const WORKFLOW_LITERAL_BUDGET = { hard: 2000, advisory: 1800 };
EOF
git -C "$R15c" add "$BUDGET_REL"
git -C "$R15c" commit -qm "seed two FILE_BUDGETS rows"
BASE15c="$(git -C "$R15c" rev-parse HEAD)"
git -C "$R15c" checkout -qb task/rename-largest 2>/dev/null
cat > "$R15c/$BUDGET_REL" <<'EOF'
// miniature budget fixture — comment mentions hard ×1.25 and advisory ×1.10
const FILE_BUDGETS = {
  // post-shrink derivation comment
  'skills/war/RENAMED.md': { hard: 900, advisory: 900 },
};
// post-shrink derivation comment
const WORKFLOW_LITERAL_BUDGET = { hard: 2000, advisory: 1800 };
EOF
git -C "$R15c" add "$BUDGET_REL"
git -C "$R15c" commit -qm "drop OTHER.md, rename SKILL.md at hard 900 (no trailer)"
TASK15c="$(git -C "$R15c" rev-parse HEAD)"
git -C "$R15c" checkout -q - 2>/dev/null
cwd15c="$(fresh_cwd)"
rc15c=0
( cd "$cwd15c" && bash "$SCRIPT" "$BASE15c" "$TASK15c" --repo "$R15c" ) >/dev/null 2>&1 || rc15c=$?
if [ "$rc15c" -eq 0 ]; then
  pass "case 15c: rename-largest-old-value (only-in-old 1000 and 500 -> 900) -> exit 0"
else
  fail "case 15c: rename-largest-old-value (only-in-old 1000 and 500 -> 900) -> expected exit 0, got $rc15c"
fi

# ---------------------------------------------------------------------------
# Case 16: real-tree BUDGET_FILE parity (#1733). Every fixture above seeds its
# own budget file at BUDGET_REL, so a drifted BUDGET_FILE literal in the
# script would leave the floor reading a path the real repo never tracks — a
# silent exit 0 on every real raise. Extract the literal from the script and
# require git to track it at this repo's root.
# ---------------------------------------------------------------------------
lit16="$(sed -n 's/^BUDGET_FILE="\([^"]*\)"$/\1/p' "$SCRIPT")"
root16="$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null)" || root16=""
if [ -n "$lit16" ] && [ "$lit16" = "$BUDGET_REL" ] && [ -n "$root16" ] \
   && git -C "$root16" ls-files --error-unmatch -- ":(top)$lit16" >/dev/null 2>&1; then
  pass "real-tree BUDGET_FILE parity: '$lit16' is tracked at the repo root"
else
  fail "real-tree BUDGET_FILE parity: literal '$lit16' (fixture '$BUDGET_REL') is not tracked at repo root '$root16'"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
