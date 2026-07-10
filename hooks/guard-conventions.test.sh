#!/usr/bin/env bash
# Guard-authoring meta-guards (Task 1.2, plan
# 2026-07-08-guard-floor-and-scope-hook-coverage-completeness; ADR 0031).
#
# Two standing lints over this repo's guard scripts/tests. Each enforces an
# authoring CONVENTION whose per-incident violation is already recorded in
# docs/learnings/ — the class, not the instance, is what's guarded.
#
#   (1) negation-block lint — a frontmatter *negation* check (e.g. "tools must
#       NOT grant Bash") must extract the whole YAML block, never a bare
#       `^<key>:` header line. Grepping only the header line misses block-style
#       list continuations (`- Bash`) and silently passes a forbidden grant
#       (frontmatter-tools-negation-check-single-line-only). PASS references:
#       the block-walk `awk` extractor in validate-worktree-scope.test.sh and
#       `extract_provenance` in validate-servitor-provenance.sh. Positive
#       capability grants (a line-scoped Read/Grep check) are exempt — a
#       line-scoped MISS on a positive grant fails safe; the lint targets
#       negation only.
#
#   (2) search-root lint — a guard-test `find`/`grep -r` must anchor to the
#       narrowest subtree or exclude `.claude/`; a bare repo-root scan sweeps
#       ~100 stale duplicate suites under .claude/worktrees/ and mis-asserts
#       (absence-guard-search-root-must-anchor-to-subtree). PASS references:
#       provision-worktrees.test.sh (`$SKILLS_ROOT` anchor) and
#       refinery-surface.test.sh (named files). A deliberate exception carries
#       an inline `# guard-conventions: allow <reason>` tag; the lint prints
#       suppressed hits to stderr for the record.
#
# Constraints: macOS bash 3.2.57-compatible (no globstar, no associative
# arrays, no ${,,}), cwd-independent (all paths resolved from $0). The
# synthetic RED fixtures are assembled with printf — never a heredoc — so the
# offending lines exist only in the generated temp files, never as scannable
# lines in THIS file (which the full-tree passes below re-scan).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"

fails=0
n=0

pass() { n=$((n + 1)); printf 'ok %d - %s\n' "$n" "$1"; }
fail() { n=$((n + 1)); fails=$((fails + 1)); printf 'FAIL %d - %s\n' "$n" "$1"; }

# ---------------------------------------------------------------------------
# Lint 1: negation-block
#
# A "header-only var" is one assigned from a single-line `grep '^<key>:'`
# frontmatter-header extraction with NO block walk (`awk`) on the same line.
# A hit is a NEGATION grep (`! ... grep` or `grep -...v`) that references such
# a var — the recorded defect shape.
#
# ponytail: per-line assignment detection; every real block extractor in this
# repo is single-line `awk`. Add a windowed scan if a future extractor splits
# the `awk` onto a line below its `VAR="$(` opener.
# ---------------------------------------------------------------------------
negation_block_scan() {
  _f="$1"
  # Header-only vars: assignment line, contains grep, contains a `^letters:`
  # header anchor, does NOT contain awk (a block walk).
  _hdr="$(grep -E "^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*=.*grep.*\^[A-Za-z_]+:" "$_f" 2>/dev/null \
    | grep -v "awk" \
    | sed -E 's/^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=.*/\1/' \
    | sort -u)"
  [ -z "$_hdr" ] && return 0
  # Negation-grep lines that reference a header-only var.
  grep -nE '! .*grep|grep -[A-Za-z]*v' "$_f" 2>/dev/null | while IFS= read -r _nl; do
    _num="${_nl%%:*}"
    for _v in $_hdr; do
      case "$_nl" in
        *'$'"$_v"|*'$'"$_v"[!A-Za-z0-9_]*|*'${'"$_v"'}'*)
          printf '%s:%s: negation grep on header-only var $%s (missing block walk)\n' "$_f" "$_num" "$_v" ;;
      esac
    done
  done
}

# ---------------------------------------------------------------------------
# Lint 2: search-root
#
# A hit is a non-comment line that runs a recursive `grep -...r` or a `find`
# whose search root is the repo root (`.`, `./`, `$PWD`, a repo-root var, or
# `git rev-parse --show-toplevel`) WITHOUT a `.claude` exclusion. A line
# carrying `# guard-conventions: allow` is suppressed (printed to stderr).
# ---------------------------------------------------------------------------
search_root_scan() {
  _f="$1"
  _num=0
  while IFS= read -r _line || [ -n "$_line" ]; do
    _num=$((_num + 1))
    # Strip leading whitespace; skip comment lines.
    _t="${_line#"${_line%%[![:space:]]*}"}"
    case "$_t" in \#*) continue ;; esac
    # Is this a recursive-grep or find command?
    _scan=0
    printf '%s\n' "$_line" | grep -qE 'grep +-[A-Za-z]*[rR]' && _scan=1
    case "$_line" in *"find "*) _scan=1 ;; esac
    [ "$_scan" -eq 0 ] && continue
    # A .claude exclusion anywhere on the line makes it compliant.
    case "$_line" in *.claude*) continue ;; esac
    # Repo-root search root?
    case "$_line" in
      *" . "*|*" ."|*" ./"*|*'$PWD'*|*'${PWD}'*|*'$REPO_ROOT'*|*'$REPO '*|*'$ROOT '*|*'show-toplevel'*) ;;
      *) continue ;;
    esac
    # An allow-tag suppresses the hit but is recorded on stderr.
    case "$_line" in
      *"guard-conventions: allow"*)
        printf 'SUPPRESSED %s:%s: %s\n' "$_f" "$_num" "$_t" >&2
        continue ;;
    esac
    printf '%s:%s: repo-root recursive scan without .claude exclusion\n' "$_f" "$_num"
  done < "$_f"
}

# ---------------------------------------------------------------------------
# Fixtures (mktemp — never heredoc; see file header).
# ---------------------------------------------------------------------------
TMP="$(mktemp -d 2>/dev/null || mktemp -d -t guardconv)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

# RED negation fixture: header-only extraction + negation grep on it.
NEG_RED="$TMP/neg-red.sh"
printf '#!/usr/bin/env bash\n' > "$NEG_RED"
printf 'frontmatter="$(cat "$1")"\n' >> "$NEG_RED"
printf 'tline="$(printf %s | grep '\''^tools:'\'')"\n' '%s' >> "$NEG_RED"
printf 'if ! printf %s "$tline" | grep -q Bash; then echo BAD; fi\n' '%s' >> "$NEG_RED"

# RED search-root fixtures: recursive scan rooted at `.` (root arg via %s so the
# literal offending command never appears on a scannable line in THIS file).
SR_RED="$TMP/sr-red.sh"
printf '#!/usr/bin/env bash\n' > "$SR_RED"
printf 'grep -rn WAR_TOKEN %s 2>/dev/null\n' "." >> "$SR_RED"

SR_FIND_RED="$TMP/sr-find-red.sh"
printf '#!/usr/bin/env bash\n' > "$SR_FIND_RED"
printf 'find %s -name %s\n' "." "'*.test.sh'" >> "$SR_FIND_RED"

# Allow-tagged fixture: same shape, suppressed by the tag.
SR_ALLOW="$TMP/sr-allow.sh"
printf '#!/usr/bin/env bash\n' > "$SR_ALLOW"
printf 'grep -rn WAR_TOKEN %s 2>/dev/null # guard-conventions: allow demo\n' "." >> "$SR_ALLOW"

# .claude-excluded fixture: repo-root scan is fine once .claude is excluded.
SR_OK="$TMP/sr-ok.sh"
printf '#!/usr/bin/env bash\n' > "$SR_OK"
printf 'grep -rn WAR_TOKEN %s --exclude-dir=.claude 2>/dev/null\n' "." >> "$SR_OK"

# ---------------------------------------------------------------------------
# Assertions — negation-block lint
# ---------------------------------------------------------------------------
if [ -n "$(negation_block_scan "$NEG_RED")" ]; then
  pass "negation lint FIRES on bare ^tools: header negation (RED fixture)"
else
  fail "negation lint missed the bare ^tools: header negation"
fi

# PASS reference: the block-walk awk extractor (validate-worktree-scope.test.sh
# negation-checks $tools_block, the awk-extracted block — not $tools_line).
if [ -z "$(negation_block_scan "$REPO/hooks/validate-worktree-scope.test.sh")" ]; then
  pass "negation lint PASSES the block-walk extractor reference"
else
  fail "negation lint false-fired on the block-walk extractor reference"
fi

# PASS reference: extract_provenance (block walk, no header-only negation).
if [ -z "$(negation_block_scan "$REPO/hooks/validate-servitor-provenance.sh")" ]; then
  pass "negation lint PASSES extract_provenance reference"
else
  fail "negation lint false-fired on extract_provenance reference"
fi

# ---------------------------------------------------------------------------
# Assertions — search-root lint
# ---------------------------------------------------------------------------
if [ -n "$(search_root_scan "$SR_RED" 2>/dev/null)" ]; then
  pass "search-root lint FIRES on repo-root grep -r (RED fixture)"
else
  fail "search-root lint missed the repo-root grep -r"
fi

if [ -n "$(search_root_scan "$SR_FIND_RED" 2>/dev/null)" ]; then
  pass "search-root lint FIRES on repo-root find (RED fixture)"
else
  fail "search-root lint missed the repo-root find"
fi

# Allow-tag suppresses the hit (stdout empty; the suppressed line goes to stderr).
_allow_out="$(search_root_scan "$SR_ALLOW" 2>/dev/null)"
_allow_err="$(search_root_scan "$SR_ALLOW" 2>&1 >/dev/null)"
if [ -z "$_allow_out" ]; then
  pass "search-root lint SUPPRESSES an allow-tagged repo-root scan"
else
  fail "search-root lint hit an allow-tagged scan on stdout"
fi
case "$_allow_err" in
  *SUPPRESSED*) pass "search-root lint records the suppressed hit on stderr" ;;
  *) fail "search-root lint did not record the suppressed hit on stderr" ;;
esac

# .claude exclusion makes a repo-root scan compliant.
if [ -z "$(search_root_scan "$SR_OK" 2>/dev/null)" ]; then
  pass "search-root lint PASSES a .claude-excluded repo-root scan"
else
  fail "search-root lint false-fired on a .claude-excluded scan"
fi

# PASS references: subtree-anchored / named-file guard tests.
if [ -z "$(search_root_scan "$REPO/skills/war/assets/provision-worktrees.test.sh" 2>/dev/null)" ]; then
  pass "search-root lint PASSES provision-worktrees.test.sh (SKILLS_ROOT anchor)"
else
  fail "search-root lint false-fired on provision-worktrees.test.sh"
fi
if [ -z "$(search_root_scan "$REPO/skills/war/assets/refinery-surface.test.sh" 2>/dev/null)" ]; then
  pass "search-root lint PASSES refinery-surface.test.sh (named files)"
else
  fail "search-root lint false-fired on refinery-surface.test.sh"
fi

# ---------------------------------------------------------------------------
# Full-tree enforcement — the substantive assertion. Every real guard script
# and guard test must satisfy both conventions right now (criterion 11). Our
# own find is subtree-anchored (compliant) and excludes .claude/.git.
# ---------------------------------------------------------------------------
neg_hits=""
for _s in "$REPO"/hooks/*.sh; do
  _h="$(negation_block_scan "$_s")"
  [ -n "$_h" ] && neg_hits="$neg_hits$_h"$'\n'
done
if [ -z "$neg_hits" ]; then
  pass "negation lint clean across all hooks/ guard scripts"
else
  fail "negation lint found violations across hooks/:"$'\n'"$neg_hits"
fi

sr_hits=""
while IFS= read -r _tf; do
  [ -z "$_tf" ] && continue
  _h="$(search_root_scan "$_tf" 2>/dev/null)"
  [ -n "$_h" ] && sr_hits="$sr_hits$_h"$'\n'
done <<EOF
$(find "$REPO/hooks" "$REPO/skills" -type f -name '*.test.sh' \
    -not -path '*/.claude/*' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort)
EOF
if [ -z "$sr_hits" ]; then
  pass "search-root lint clean across all hooks/ + skills/ guard tests"
else
  fail "search-root lint found violations:"$'\n'"$sr_hits"
fi

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "guard-conventions.test.sh: PASS"
