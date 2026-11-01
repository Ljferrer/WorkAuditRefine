#!/usr/bin/env bash
# Guard-authoring meta-guards (Task 1.2, plan
# 2026-07-08-guard-floor-and-scope-hook-coverage-completeness; ADR 0031).
#
# Standing lints over this repo's guard scripts/tests: negation-block,
# search-root, suffix-anchored arm, unanchored memory glob and pipefail
# early-exit grep. Each enforces an authoring CONVENTION whose per-incident
# violation is already recorded in docs/learnings/ — the class, not the
# instance, is what's guarded.
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
#   (5) pipefail early-exit grep lint — a script that sets pipefail must not
#       pipe into a quiet grep. The grep exits at its first match, the writer
#       dies of SIGPIPE, the pipeline returns 141, and a found value reads as
#       not found (#1840, #2007). Drain with awk or match with case. PASS
#       reference: branch_holder_path in provision-worktrees.sh.
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
  # One awk pass per file (was one grep subprocess per line). Same rules, in order: skip comment
  # lines; keep only a recursive grep or a find; a .claude mention complies; keep only a repo-root
  # search root; an allow tag suppresses the hit onto stderr. The root tests sit on lines with no
  # find or recursive grep, so this function never trips its own full-tree pass.
  SR_FILE="$1" awk '
    {
      line = $0
      t = line
      sub(/^[[:space:]]+/, "", t)
      if (substr(t, 1, 1) == "#") next
      if (!(line ~ /grep +-[A-Za-z]*[rR]/ || index(line, "find ") > 0)) next
      if (index(line, ".claude") > 0) next
      root = 0
      if (index(line, " . ") > 0) root = 1
      if (length(line) >= 2 && substr(line, length(line) - 1) == " .") root = 1
      if (index(line, " ./") > 0) root = 1
      if (index(line, "$PWD") > 0 || index(line, "${PWD}") > 0) root = 1
      if (index(line, "$REPO_ROOT") > 0 || index(line, "$REPO ") > 0 || index(line, "$ROOT ") > 0) root = 1
      if (index(line, "show-toplevel") > 0) root = 1
      if (!root) next
      if (index(line, "guard-conventions: allow") > 0) {
        printf "SUPPRESSED %s:%d: %s\n", ENVIRON["SR_FILE"], NR, t > "/dev/stderr"
        next
      }
      printf "%s:%d: repo-root recursive scan without .claude exclusion\n", ENVIRON["SR_FILE"], NR
    }
  ' "$1"
}

# ---------------------------------------------------------------------------
# Lint 3: suffix-anchored agent-type arms
#   (End state 3, plan 2026-07-12-confinement-scope-hooks; #810).
#
# A hit is a trailing-star agent-type case arm of the form `*war-<role>*`
# (substring match) in a NON-TEST hook. The dispatched agent_type is
# `work-audit-refine:war-<role>`, so a suffix anchor (`*war-<role>`) captures it
# while rejecting a `war-<role>-helper` decoration; a trailing `*` re-captures
# the decoration and, on a deny-side arm (auditor/servitor), fail-opens a
# read-only agent by inversion. Test files are exempt — they legitimately name
# the retired trailing-star shape in delete-the-feature comments.
# ---------------------------------------------------------------------------
war_arm_scan() {
  _f="$1"
  grep -nE '\*war-[a-z-]*\*' "$_f" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Lint 4: unanchored local-memory glob
#   (End state 4, same plan; #810).
#
# The servitor WRITE-SCOPE arm is `$HOME`-anchored, so the unanchored
# `.claude/projects/<project>/memory/` shape glob must survive in EXACTLY TWO
# sanctioned places: (a) validate-worktree-scope.sh's HOME-unset/empty fallback
# branch, and (b) validate-servitor-provenance.sh's content-gate classifier
# (left unanchored on purpose — for a content gate broader capture means MORE
# provenance enforcement, fail-safe). A hit in any other hooks/*.sh regresses
# the anchor. The glob literal is assembled from parts (each '*' via a variable)
# so the offending sequence never appears as a scannable line in THIS file,
# which the full-tree pass below re-scans.
# ---------------------------------------------------------------------------
memglob_scan() {
  _f="$1"
  _st='*'
  _pat="${_st}/.claude/projects/${_st}/memory/${_st}"
  grep -nF "$_pat" "$_f" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Lint 5: pipefail early-exit grep
#   (D9, plan 2026-09-06-shell-floors-guards-and-provisioning; #2007).
#
# A hit is a non-comment line in a script that names pipefail on a non-comment
# line, where a pipe feeds a grep that holds a quiet flag: `-q` in any short
# cluster, `--quiet` or `--silent`, before or after other arguments. `||` is
# not a pipe. A line that ends in `|` feeds the next non-comment line. A line
# carrying `# guard-conventions: allow` is suppressed (printed to stderr).
# ---------------------------------------------------------------------------
pipefail_grep_scan() {
  PG_FILE="$1" awk '
    function code_line() {
      t = $0
      sub(/^[[:space:]]+/, "", t)
      return substr(t, 1, 1) != "#"
    }
    FNR == NR {
      if (code_line() && index($0, "pipefail") > 0) armed = 1
      next
    }
    !armed { exit }
    {
      if (!code_line()) next
      s = (fed ? "| " : "") $0
      fed = ($0 ~ /(^|[^|])\|&?[[:space:]]*\\?[[:space:]]*$/)
      if (s !~ /(^|[^|])\|&?[[:space:]]*(command[[:space:]]+|[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*grep[[:space:]]([^|;&]*[[:space:]])?(-[A-Za-z0-9]*q[A-Za-z0-9]*|--quiet|--silent)([[:space:]]|$)/) next
      if (index($0, "guard-conventions: allow") > 0) {
        printf "SUPPRESSED %s:%d: %s\n", ENVIRON["PG_FILE"], FNR, t > "/dev/stderr"
        next
      }
      printf "%s:%d: early-exit grep pipeline under pipefail (drain with awk or match with case)\n", ENVIRON["PG_FILE"], FNR
    }
  ' "$1" "$1"
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

# RED arm fixture: a trailing-star agent-type arm. The two '*' are passed via %s
# so the offending `*war-...*` sequence exists only in this temp file, never on a
# scannable line in THIS file.
ARM_RED="$TMP/arm-red.sh"
printf '#!/usr/bin/env bash\n' > "$ARM_RED"
printf 'case "$atype" in\n' >> "$ARM_RED"
printf '  %swar-servitor%s) ;;\n' '*' '*' >> "$ARM_RED"
printf 'esac\n' >> "$ARM_RED"

# RED memglob fixture: the unanchored memory shape glob. Each '*' is passed via
# %s so the full glob sequence exists only in this temp file, never on a
# scannable line in THIS file (which the full-tree memglob pass re-scans).
MEM_RED="$TMP/mem-red.sh"
printf '#!/usr/bin/env bash\n' > "$MEM_RED"
printf '  %s/.claude/projects/%s/memory/%s) exit 0 ;;\n' '*' '*' '*' >> "$MEM_RED"

# RED pipefail fixtures: one script per pipeline spelling, assembled with
# printf. Lint 5 exempts test files, so the body literals below never hit here.
PG_DIR="$TMP/pg"
mkdir -p "$PG_DIR"
pg_script() { # pg_script <name> <set-line> <body-line> -> path of a new script
  _p="$PG_DIR/$1.sh"
  printf '#!/usr/bin/env bash\n%s\n%s\n' "$2" "$3" > "$_p"
  printf '%s' "$_p"
}
PG_SET='set -euo pipefail'
PG_LIVE='x | grep -Fxq -- y'

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
# Assertions — suffix-anchored arm lint (Lint 3)
# ---------------------------------------------------------------------------
if [ -n "$(war_arm_scan "$ARM_RED")" ]; then
  pass "arm lint FIRES on a trailing-star agent-type arm (RED fixture)"
else
  fail "arm lint missed a trailing-star agent-type arm"
fi

# PASS reference: a real suffix-anchored hook arm is clean.
if [ -z "$(war_arm_scan "$REPO/hooks/validate-auditor-git.sh")" ]; then
  pass "arm lint PASSES the suffix-anchored validate-auditor-git.sh arm"
else
  fail "arm lint false-fired on the suffix-anchored validate-auditor-git.sh arm"
fi

# ---------------------------------------------------------------------------
# Assertions — unanchored memory-glob lint (Lint 4)
# ---------------------------------------------------------------------------
if [ -n "$(memglob_scan "$MEM_RED")" ]; then
  pass "memglob lint FIRES on the unanchored memory shape glob (RED fixture)"
else
  fail "memglob lint missed the unanchored memory shape glob"
fi

# PASS reference: a hook carrying no memory glob is clean.
if [ -z "$(memglob_scan "$REPO/hooks/validate-auditor-git.sh")" ]; then
  pass "memglob lint PASSES a hook with no memory glob"
else
  fail "memglob lint false-fired on a hook with no memory glob"
fi

# The two sanctioned survivors DO carry the glob (proves the scanner matches
# real code, not just the fixture — delete-the-feature: a scanner that never
# matches would pass the full-tree assertion vacuously).
if [ -n "$(memglob_scan "$REPO/hooks/validate-worktree-scope.sh")" ]; then
  pass "memglob lint SEES the glob in survivor validate-worktree-scope.sh (HOME-unset fallback)"
else
  fail "memglob lint did not see the survivor glob in validate-worktree-scope.sh"
fi
if [ -n "$(memglob_scan "$REPO/hooks/validate-servitor-provenance.sh")" ]; then
  pass "memglob lint SEES the glob in survivor validate-servitor-provenance.sh (classifier)"
else
  fail "memglob lint did not see the survivor glob in validate-servitor-provenance.sh"
fi

# ---------------------------------------------------------------------------
# Full-tree enforcement — Lint 3: zero trailing-star agent-type arms across
# NON-TEST hooks/*.sh (End state 3). Test files are excluded by design.
# ---------------------------------------------------------------------------
arm_hits=""
for _s in "$REPO"/hooks/*.sh; do
  case "$_s" in *.test.sh) continue ;; esac
  _h="$(war_arm_scan "$_s")"
  [ -n "$_h" ] && arm_hits="$arm_hits$_s: $_h"$'\n'
done
if [ -z "$arm_hits" ]; then
  pass "arm lint clean: no trailing-star agent-type arm in any non-test hooks/*.sh"
else
  fail "arm lint found trailing-star agent-type arms:"$'\n'"$arm_hits"
fi

# ---------------------------------------------------------------------------
# Full-tree enforcement — Lint 4: the unanchored memory glob appears in NO
# hooks/*.sh other than the two sanctioned survivors (End state 4). The glob
# is a servitor write-scope allow gate; a regression re-widens the allow.
# ---------------------------------------------------------------------------
mem_hits=""
for _s in "$REPO"/hooks/*.sh; do
  case "$_s" in
    */validate-worktree-scope.sh|*/validate-servitor-provenance.sh) continue ;;
  esac
  _h="$(memglob_scan "$_s")"
  [ -n "$_h" ] && mem_hits="$mem_hits$_s: $_h"$'\n'
done
if [ -z "$mem_hits" ]; then
  pass "memglob lint clean: unanchored glob only in the two sanctioned survivors"
else
  fail "memglob lint found the unanchored glob outside the survivors:"$'\n'"$mem_hits"
fi

# ---------------------------------------------------------------------------
# Assertions — pipefail early-exit grep lint (Lint 5)
# ---------------------------------------------------------------------------
expect_pg() { # expect_pg <want> <title> <name> <set-line> <body-line>
  _got="$(pipefail_grep_scan "$(pg_script "$3" "$4" "$5")" 2>/dev/null | grep -c .)"
  if [ "$_got" = "$1" ]; then
    pass "pipefail lint: $2"
  else
    fail "pipefail lint: $2 (expected $1 hit(s), got $_got)"
  fi
}

expect_pg 1 "FIRES on one live pipeline (RED fixture)" red "$PG_SET" "$PG_LIVE"
expect_pg 1 "FIRES on a bare -q" bare "$PG_SET" 'x | grep -q y'
expect_pg 1 "FIRES on a leading q cluster" cluster "$PG_SET" 'x | grep -qi y'
expect_pg 1 "FIRES on a split flag" split "$PG_SET" 'x | grep -E -q y'
expect_pg 1 "FIRES on a flag after the pattern" after "$PG_SET" 'x | grep y -q'
expect_pg 1 "FIRES on --quiet" quiet "$PG_SET" 'x | grep --quiet y'
expect_pg 1 "FIRES on --silent" silent "$PG_SET" 'x | grep --silent y'
expect_pg 1 "FIRES with no space after the pipe" tight "$PG_SET" 'x |grep -q y'
expect_pg 1 "FIRES on a stderr pipe" amp "$PG_SET" 'x |& grep -q y'
expect_pg 1 "FIRES past an env prefix" env "$PG_SET" 'x | LC_ALL=C grep -q y'
expect_pg 1 "FIRES past command" cmd "$PG_SET" 'x | command grep -q y'
expect_pg 1 "FIRES under set -o pipefail" seto 'set -o pipefail' "$PG_LIVE"
expect_pg 0 "PASSES a comment-line pipeline (grill negative)" comment "$PG_SET" "# $PG_LIVE"
expect_pg 0 "PASSES a set -u script (A3)" setu 'set -u' "$PG_LIVE"
expect_pg 0 "PASSES a script that names pipefail only in a comment" namecomment '# not pipefail' "$PG_LIVE"
expect_pg 0 "PASSES || grep, which is not a pipe" oror "$PG_SET" 'x || grep -q y'
expect_pg 0 "PASSES a file-argument grep" filearg "$PG_SET" 'grep -Fxq -- y "$f"'
expect_pg 0 "PASSES a grep with no quiet flag" noisy "$PG_SET" 'x | grep -c y'
expect_pg 0 "PASSES a quiet flag past the pipeline" nextcmd "$PG_SET" 'x | grep y; z -q'

# A pipe at the end of a line feeds the next code line, past a comment.
_pg_cont="$(pg_script cont "$PG_SET" 'x |')"
printf '  # a comment line\n  grep -q y\n' >> "$_pg_cont"
if [ "$(pipefail_grep_scan "$_pg_cont" 2>/dev/null | grep -c .)" = "1" ]; then
  pass "pipefail lint: FIRES across a trailing pipe"
else
  fail "pipefail lint: missed a pipeline across a trailing pipe"
fi
_pg_cont_or="$(pg_script contor "$PG_SET" 'x ||')"
printf '  grep -q y\n' >> "$_pg_cont_or"
if [ -z "$(pipefail_grep_scan "$_pg_cont_or" 2>/dev/null)" ]; then
  pass "pipefail lint: PASSES a trailing || before a grep"
else
  fail "pipefail lint: false-fired on a trailing ||"
fi

# Allow-tag suppresses the hit (stdout empty; the suppressed line goes to stderr).
_pg_allow="$(pg_script allow "$PG_SET" "$PG_LIVE # guard-conventions: allow demo")"
_allow_out="$(pipefail_grep_scan "$_pg_allow" 2>/dev/null)"
_allow_err="$(pipefail_grep_scan "$_pg_allow" 2>&1 >/dev/null)"
if [ -z "$_allow_out" ]; then
  pass "pipefail lint: SUPPRESSES an allow-tagged pipeline"
else
  fail "pipefail lint: hit an allow-tagged pipeline on stdout"
fi
case "$_allow_err" in
  *SUPPRESSED*) pass "pipefail lint: records the suppressed hit on stderr" ;;
  *) fail "pipefail lint: did not record the suppressed hit on stderr" ;;
esac

# A hit names the file and the line.
case "$(pipefail_grep_scan "$PG_DIR/red.sh" 2>/dev/null)" in
  "$PG_DIR/red.sh:3: early-exit grep pipeline under pipefail"*) pass "pipefail lint: a hit names the file and line" ;;
  *) fail "pipefail lint: a hit lost its file or line" ;;
esac

# ---------------------------------------------------------------------------
# Full-tree enforcement — Lint 5: no early-exit grep pipeline in any non-test
# hooks/*.sh or skills/**/*.sh. A find that returns nothing, or that loses the
# script this lint exists for, must not read as a clean tree. The two roots are
# anchored subtrees, and a path filter on .claude would drop them in a worktree.
# ---------------------------------------------------------------------------
pg_files="$(find "$REPO/hooks" "$REPO/skills" -type f -name '*.sh' -not -name '*.test.sh' | sort)" \
  || fail "pipefail lint: find failed"
pg_hits=""
while IFS= read -r _s; do
  [ -z "$_s" ] && continue
  _h="$(pipefail_grep_scan "$_s")"
  [ -n "$_h" ] && pg_hits="$pg_hits$_h"$'\n'
done <<EOF
$pg_files
EOF
case "$pg_files" in
  *"/skills/war/assets/provision-worktrees.sh"*) pass "pipefail lint scan set holds provision-worktrees.sh" ;;
  *) fail "pipefail lint scan set lost provision-worktrees.sh" ;;
esac
if [ -z "$pg_hits" ]; then
  pass "pipefail lint clean: no early-exit grep pipeline in any non-test script"
else
  fail "pipefail lint found early-exit grep pipelines:"$'\n'"$pg_hits"
fi

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "guard-conventions.test.sh: PASS"
