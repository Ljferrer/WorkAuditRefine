#!/usr/bin/env bash
# Tests for the WAR auditor read-only-git Bash guard (F03 confinement).
# hooks/validate-auditor-git.sh
#
# This guard is FAIL-CLOSED: for agent_type suffix-anchored to war-auditor
# (case pattern `*war-auditor`) or to war-evidence-auditor (its own arm
# `*war-evidence-auditor`, same deny set — group O), it allows
# ONLY a single git read-subcommand (diff/log/show/merge-base/rev-parse/status/
# ls-files/ls-tree/cat-file/blame, plus read-form branch, plus the one narrow
# grep form `git grep -F -e <token>` — group P) with no shell
# metacharacters outside an admitted quoted value (group Q). Anything else → DENY
# (exit 2). Non-auditor agent types → exit 0 (pass-through).
#
# CRITICAL ASSERTION DESIGN:
#   Deny cases assert a SPECIFIC deny message on stderr, NOT merely exit != 0.
#   A crashed or syntax-errored hook also exits non-zero — checking only exit
#   code gives a false-pass. We grep for the specific WAR deny marker on stderr.
#
# Plain-bash assertion runner. No bats, no package.json.
# Runs under macOS bash 3.2.57 (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/validate-auditor-git.sh"

fails=0
n=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# stderr_of <payload-json> → stderr text (exit code ignored)
stderr_of() { printf '%s' "$1" | bash "$HOOK" 2>&1 >/dev/null || true; }

# rc_of <payload-json> → exit code
rc_of() {
  _rc=0
  printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1 || _rc=$?
  echo "$_rc"
}

# expect_allow <description> <payload-json>
# Asserts: exit 0 (command allowed)
expect_allow() {
  n=$((n + 1))
  _rc="$(rc_of "$2")"
  if [ "$_rc" = "0" ]; then
    printf 'ok %d - %s (exit 0, allowed)\n' "$n" "$1"
  else
    printf 'FAIL %d - %s (expected exit 0, got %s)\n' "$n" "$1" "$_rc"
    fails=$((fails + 1))
  fi
}

# expect_deny <description> <payload-json>
# Asserts: exit 2 AND "WAR:" deny marker on stderr.
# CRITICAL: asserts the specific deny message, not just exit != 0.
# A crashed hook (syntax error, set -e trip) also exits non-zero — false-pass
# if we only check exit code.
expect_deny() {
  n=$((n + 1))
  _rc="$(rc_of "$2")"
  _err="$(stderr_of "$2")"
  _has_war_deny=0
  case "$_err" in
    *WAR:*) _has_war_deny=1 ;;
  esac
  if [ "$_rc" = "2" ] && [ "$_has_war_deny" = "1" ]; then
    printf 'ok %d - %s (exit 2, WAR: deny on stderr)\n' "$n" "$1"
  else
    printf 'FAIL %d - %s (expected exit 2 + WAR: deny, got rc=%s stderr=|%s|)\n' \
      "$n" "$1" "$_rc" "$_err"
    fails=$((fails + 1))
  fi
}

# expect_deny_teach <description> <payload-json> <substr>
# Asserts: exit 2 AND "WAR:" marker AND <substr> present on stderr.
# The extra <substr> check is the 2026-07-22 spec's D6 micro-teach assertion — the deny message
# must name the sanctioned alternative (Read/Grep/Glob, the Grep tool, the
# =-attached branch read-flag form, since the 2026-07-26 spec's D3 the
# one-bare-git-command-per-Bash-call form at the forbidden-char deny, or — since
# #1412 fix 1, classified per residue since #1435 — the chain-operator-rule
# naming + split-the-chain remedy on a chain-only residue, and the
# metacharacter-rule naming + Grep-tool-filters remedy on any other residue, at
# that same deny site). Substr
# matched literally via a quoted case pattern: "$3" is quoted, so even a substr
# carrying glob-special chars (e.g. the parens in "character(s)") matches
# literally, and the payloads themselves are never used as patterns.
expect_deny_teach() {
  n=$((n + 1))
  _rc="$(rc_of "$2")"
  _err="$(stderr_of "$2")"
  _has_war_deny=0
  _has_teach=0
  case "$_err" in
    *WAR:*) _has_war_deny=1 ;;
  esac
  case "$_err" in
    *"$3"*) _has_teach=1 ;;
  esac
  if [ "$_rc" = "2" ] && [ "$_has_war_deny" = "1" ] && [ "$_has_teach" = "1" ]; then
    printf 'ok %d - %s (exit 2, WAR: deny + micro-teach |%s|)\n' "$n" "$1" "$3"
  else
    printf 'FAIL %d - %s (expected exit 2 + WAR: + micro-teach |%s|, got rc=%s stderr=|%s|)\n' \
      "$n" "$1" "$3" "$_rc" "$_err"
    fails=$((fails + 1))
  fi
}

# expect_deny_lacks <description> <payload-json> <substr>
# Asserts: exit 2 AND "WAR:" marker AND <substr> ABSENT from stderr.
# Mirror of expect_deny_teach with the substring arm inverted — the rc=2 +
# WAR: conjunct is kept deliberately so a crashed hook (empty stderr) cannot
# pass vacuously. Used by group M to pin that the residue classifier names
# ONLY the branch that fired: the other branch's rule name must be absent.
expect_deny_lacks() {
  n=$((n + 1))
  _rc="$(rc_of "$2")"
  _err="$(stderr_of "$2")"
  _has_war_deny=0
  _has_substr=0
  case "$_err" in
    *WAR:*) _has_war_deny=1 ;;
  esac
  case "$_err" in
    *"$3"*) _has_substr=1 ;;
  esac
  if [ "$_rc" = "2" ] && [ "$_has_war_deny" = "1" ] && [ "$_has_substr" = "0" ]; then
    printf 'ok %d - %s (exit 2, WAR: deny, lacks |%s|)\n' "$n" "$1" "$3"
  else
    printf 'FAIL %d - %s (expected exit 2 + WAR: + ABSENT |%s|, got rc=%s stderr=|%s|)\n' \
      "$n" "$1" "$3" "$_rc" "$_err"
    fails=$((fails + 1))
  fi
}

# Payload builders
auditor_cmd() { printf '{"agent_type":"war-auditor","tool_input":{"command":"%s"}}' "$1"; }
typed_cmd()   { printf '{"agent_type":"%s","tool_input":{"command":"%s"}}' "$1" "$2"; }

# ---------------------------------------------------------------------------
# CASE GROUP A: ALLOW — auditor git read subcommands
# All must exit 0.
# ---------------------------------------------------------------------------

# A1: git diff (core read)
expect_allow "A1: git diff main...feature → allowed" \
  "$(auditor_cmd "git diff main...feature")"

# A2: git log
expect_allow "A2: git log --name-status → allowed" \
  "$(auditor_cmd "git log --name-status")"

# A3: git show
expect_allow "A3: git show HEAD → allowed" \
  "$(auditor_cmd "git show HEAD")"

# A4: git merge-base
expect_allow "A4: git merge-base main feature → allowed" \
  "$(auditor_cmd "git merge-base main feature")"

# A5: git rev-parse
expect_allow "A5: git rev-parse HEAD → allowed" \
  "$(auditor_cmd "git rev-parse HEAD")"

# A6: git status
expect_allow "A6: git status → allowed" \
  "$(auditor_cmd "git status")"

# A7: git ls-files
expect_allow "A7: git ls-files → allowed" \
  "$(auditor_cmd "git ls-files")"

# A8: git cat-file (with subcommand-local -p: read-only, must be allowed)
expect_allow "A8: git cat-file -p HEAD:file.txt → allowed (subcommand -p is read-only)" \
  "$(auditor_cmd "git cat-file -p HEAD:file.txt")"

# A9: git blame
expect_allow "A9: git blame README.md → allowed" \
  "$(auditor_cmd "git blame README.md")"

# A10: git diff with --name-status (safe flag)
expect_allow "A10: git diff --name-status integration...branch → allowed" \
  "$(auditor_cmd "git diff --name-status integration/audit-fidelity/phase-1...feature-branch")"

# A11: git diff with --stat
expect_allow "A11: git diff --stat HEAD^ → allowed" \
  "$(auditor_cmd "git diff --stat HEAD^")"

# A12: git log with --format=oneline
expect_allow "A12: git log --format=oneline → allowed" \
  "$(auditor_cmd "git log --format=oneline")"

# A13: git show with -p (patch, read-only)
expect_allow "A13: git show -p HEAD → allowed (subcommand -p)" \
  "$(auditor_cmd "git show -p HEAD")"

# A14: git log with -p (patch view, read-only)
expect_allow "A14: git log -p → allowed (subcommand -p)" \
  "$(auditor_cmd "git log -p")"

# A15: git diff with branch notation using /
expect_allow "A15: git diff integration/phase-1...war/task/branch → allowed" \
  "$(auditor_cmd "git diff integration/phase-1...war/task/branch")"

# A16: git show <audit_sha>:<path> — the committed-tree-grounding blob read the auditor
# uses for verify-and-close / already-done no-op claims (spec §8 / ADR 0029). The sha:path
# blob form must be admissible WITHOUT widening the allowlist — show is already read-only,
# and ':' '/' are in the char allowlist. Load-bearing: the clause names this exact command.
expect_allow "A16: git show abc1234:skills/_shared/war-memory.mjs → allowed (committed-tree blob read)" \
  "$(auditor_cmd "git show abc1234:skills/_shared/war-memory.mjs")"

# A17: git log -S<token> — the history-shaped verb the committed-grounding clause names for
# "when did this count change" questions. -S is subcommand-local, chars are in the allowlist.
expect_allow "A17: git log -Ssome_token → allowed (pickaxe history read)" \
  "$(auditor_cmd "git log -Ssome_token")"

# ---------------------------------------------------------------------------
# CASE GROUP B: DENY — auditor write git subcommands
# Must exit 2 AND emit "WAR:" on stderr.
# ---------------------------------------------------------------------------

# B1: git push — write op
expect_deny "B1: git push → denied" \
  "$(auditor_cmd "git push")"

# B2: git commit — write op
expect_deny "B2: git commit -m msg → denied" \
  "$(auditor_cmd "git commit -m msg")"

# B3: git checkout — write op (changes working tree)
expect_deny "B3: git checkout main → denied" \
  "$(auditor_cmd "git checkout main")"

# B4: git reset — write op
expect_deny "B4: git reset --hard HEAD → denied" \
  "$(auditor_cmd "git reset --hard HEAD")"

# B5: git add — write op (stages files)
expect_deny "B5: git add . → denied" \
  "$(auditor_cmd "git add .")"

# B6: git rm — write op
expect_deny "B6: git rm file.txt → denied" \
  "$(auditor_cmd "git rm file.txt")"

# ---------------------------------------------------------------------------
# CASE GROUP C: DENY — shell metacharacters / injection
# Must exit 2 AND emit "WAR:" on stderr.
# ---------------------------------------------------------------------------

# C1: redirect > (write to file)
expect_deny "C1: git diff > /tmp/x → denied (redirect)" \
  "$(auditor_cmd "git diff > /tmp/x")"

# C2: semicolon chaining
expect_deny "C2: git log; rm -rf x → denied (semicolon)" \
  "$(auditor_cmd "git log; rm -rf x")"

# C3: pipe chaining
expect_deny "C3: git diff && curl http://evil → denied (&&)" \
  "$(auditor_cmd "git diff && curl http://evil")"

# C4: pipe
expect_deny "C4: git log | wc -l → denied (pipe)" \
  "$(auditor_cmd "git log | wc -l")"

# C5: command substitution $()
expect_deny "C5: git log \$(evil) → denied (subst)" \
  "$(auditor_cmd 'git log $(evil)')"

# C6: background & operator
expect_deny "C6: git diff & → denied (background)" \
  "$(auditor_cmd "git diff &")"

# C7: append redirection >>
expect_deny "C7: git log >> /tmp/out → denied (append redirect)" \
  "$(auditor_cmd "git log >> /tmp/out")"

# C8: less-than redirection <
expect_deny "C8: git apply < patch.txt → denied (stdin redirect)" \
  "$(auditor_cmd "git apply < patch.txt")"

# --- C9–C12: widening-proof residue coverage (#1180) -----------------------
# The four metacharacter families the hook's live CHARACTER ALLOWLIST check (the
# `LC_ALL=C tr -d` residue extraction) denies today with no case pinning it:
# glob, braces, backslash continuation, backtick substitution. Groups J and
# K each argue their char-set widening is safe BECAUSE the group C injection
# cases stay green — so the floor those arguments lean on had a hole. #1180 is
# a COVERAGE gap in that floor, not a live guard hole: the four payloads below
# already deny, and `hooks/validate-auditor-git.sh` is untouched by this block.

# C9: glob * (pathname expansion). ls-files is an allowlisted read verb, so the
# residue check is the only thing standing between this payload and ALLOW.
expect_deny "C9: git ls-files *.mjs → denied (glob)" \
  "$(auditor_cmd "git ls-files *.mjs")"

# C10: braces via the HEAD@{1} reflog form — the exact shape BOTH teach surfaces
# name as denied (`agents/war-auditor.md`'s guard-contract bullet and the
# dispatched `auditPrompt()` contract string in workflow-template.js: "Avoid @{}
# reflog (unquoted braces are denied) — use git log -g instead"). @ IS in the char set;
# { and } are not, and log is an allowlisted verb — so again the residue check
# is the whole gate.
expect_deny "C10: git log HEAD@{1} → denied (braces / reflog form)" \
  "$(auditor_cmd "git log HEAD@{1}")"

# C11: backslash line continuation.
# CRITICAL: build with `jq -nc --arg`, NOT auditor_cmd — H5's rationale exactly.
# auditor_cmd's printf '{..."command":"%s"...}' would emit a raw backslash right
# before the closing quote, i.e. INVALID JSON; the guard's jq read of
# .agent_type then returns empty (there is no JSON-parse deny — get() swallows
# the jq failure) and the non-auditor `*) exit 0` pass-through fires. A
# pass-through exit 0 with empty stderr makes expect_deny — which requires
# exit 2 AND a `WAR:` stderr marker — FAIL at authoring time: the corrupted
# case fails loud, it never lands vacuous. jq --arg takes the bytes verbatim so
# the case asserts against the payload actually written. Memory:
# printf-json-escaping-vacuous-test-case (scope-bounded: the vacuity claim
# holds only for exit-0-asserting allow cases, which the bail-out satisfies).
# The trailing backslash is the payload's ONLY out-of-allowlist byte, and there
# is deliberately NO embedded newline: a newline is itself outside the allowlist
# and would keep this case red through a backslash-only widening, faking the
# mutation proof.
expect_deny "C11: git diff HEAD \\ (trailing continuation) → denied (backslash)" \
  "$(jq -nc --arg c 'git diff HEAD \' \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')"

# C12: backtick command substitution. Same `jq -nc --arg` encoding as C11, for
# H5's reason — keep the payload out of every escaping path between here and the
# hook. A backtick byte is JSON-valid, so auditor_cmd's printf would not corrupt
# the JSON; the CALL SITE would. Every auditor_cmd call in this file but C5
# passes its payload double-quoted (C5 single-quotes its $() payload for exactly
# this reason), and an unescaped backtick in a double-quoted call site is
# command substitution in the test's own shell — the case would then assert
# against a payload nobody wrote. jq --arg takes the bytes verbatim and removes
# the question, keeping C12 uniform with C11 and H5.
# The single-out-of-allowlist-byte discipline binds C12 as tightly as C11: the
# backtick is the payload's ONLY out-of-allowlist byte, with no quotes or parens
# borrowed from H5's neighbouring $() payload; a second residue byte would keep
# this case red through a backtick-only widening and fake the proof the same way.
expect_deny "C12: git log \`whoami\` → denied (backtick substitution)" \
  "$(jq -nc --arg c 'git log `whoami`' \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')"

# ---------------------------------------------------------------------------
# CASE GROUP D: DENY — non-git commands
# Must exit 2 AND emit "WAR:" on stderr.
# ---------------------------------------------------------------------------

# D1: rm -rf / — destructive non-git
expect_deny "D1: rm -rf / → denied (non-git)" \
  "$(auditor_cmd "rm -rf /")"

# D2: python -c
expect_deny "D2: python -c code → denied (non-git)" \
  "$(auditor_cmd "python -c import os")"

# D3: ls (valid, but not a git command)
expect_deny "D3: ls /tmp → denied (non-git)" \
  "$(auditor_cmd "ls /tmp")"

# D4: cat (valid, but not a git command)
expect_deny "D4: cat /etc/passwd → denied (non-git)" \
  "$(auditor_cmd "cat /etc/passwd")"

# D5: curl (network access)
expect_deny "D5: curl http://example.com → denied (non-git)" \
  "$(auditor_cmd "curl http://example.com")"

# D6: echo (not git)
expect_deny "D6: echo hello → denied (non-git)" \
  "$(auditor_cmd "echo hello")"

# ---------------------------------------------------------------------------
# CASE GROUP E: DENY — global git flags that must be blocked
# Must exit 2 AND emit "WAR:" on stderr.
# ---------------------------------------------------------------------------

# E1: git -c (global config override — security risk)
expect_deny "E1: git -c core.pager=cat log → denied (global -c)" \
  "$(auditor_cmd "git -c core.pager=cat log")"

# E2: git --output (global output redirection)
expect_deny "E2: git --output=/tmp/out diff → denied (--output)" \
  "$(auditor_cmd "git --output=/tmp/out diff")"

# E3: git -o (short form --output)
expect_deny "E3: git -o /tmp/out diff → denied (-o)" \
  "$(auditor_cmd "git -o /tmp/out diff")"

# E4: global --paginate (leading git flag, not subcommand -p)
expect_deny "E4: git --paginate log → denied (global --paginate)" \
  "$(auditor_cmd "git --paginate log")"

# E5: global --no-pager
expect_deny "E5: git --no-pager log → denied (global --no-pager)" \
  "$(auditor_cmd "git --no-pager log")"

# E6: global -p (leading pager flag, before subcommand — not the same as
#     subcommand-local -p inside cat-file/show/log which IS allowed above)
expect_deny "E6: git -p log → denied (global leading -p)" \
  "$(auditor_cmd "git -p log")"

# E7: --pager= (global pager config)
expect_deny "E7: git --pager=cat log → denied (global --pager=)" \
  "$(auditor_cmd "git --pager=cat log")"

# E8: git diff --output=FILE (subcommand-position --output=, write primitive)
# Open Decision #1: this is the NAMED bypass — subcommand-local --output bypasses
# the hook's leading-position global-flag block because $rest starts with "diff".
# The post-subcommand scan must catch it.
expect_deny "E8: git diff --output=/tmp/x → denied (subcommand-position --output=)" \
  "$(auditor_cmd "git diff --output=/tmp/x")"

# E9: git log --output=FILE (same bypass on a different allowed subcommand)
expect_deny "E9: git log --output=/tmp/x → denied (subcommand-position --output=)" \
  "$(auditor_cmd "git log --output=/tmp/x")"

# E10: git diff --output FILE (space-separated form — no equals sign)
expect_deny "E10: git diff --output /tmp/x → denied (subcommand-position --output space-form)" \
  "$(auditor_cmd "git diff --output /tmp/x")"

# ---------------------------------------------------------------------------
# CASE GROUP F: NON-AUDITOR agent types → exit 0 (pass-through)
# Non-auditor agents are NOT subject to this guard.
# ---------------------------------------------------------------------------

# F1: war-worker
expect_allow "F1: war-worker git push → exit 0 (not auditor)" \
  "$(typed_cmd "war-worker" "git push")"

# F2: war-refiner
expect_allow "F2: war-refiner git commit → exit 0 (not auditor)" \
  "$(typed_cmd "war-refiner" "git commit -m test")"

# F3: war-servitor
expect_allow "F3: war-servitor rm -rf → exit 0 (not auditor)" \
  "$(typed_cmd "war-servitor" "rm -rf /")"

# F4: main session (no agent_type)
expect_allow "F4: no agent_type → exit 0 (pass-through)" \
  "$(printf '{"tool_input":{"command":"git push"}}')"

# F5: unknown agent type
expect_allow "F5: unknown agent_type → exit 0 (pass-through)" \
  "$(typed_cmd "some-other-agent" "git push")"

# F6: empty agent_type
expect_allow "F6: empty agent_type → exit 0 (pass-through)" \
  "$(typed_cmd "" "git push")"

# ---------------------------------------------------------------------------
# CASE GROUP G: edge cases
# ---------------------------------------------------------------------------

# G1: git with no subcommand → deny (not a known read subcommand)
expect_deny "G1: bare 'git' command → denied (no subcommand)" \
  "$(auditor_cmd "git")"

# G2: empty command
expect_deny "G2: empty command → denied" \
  "$(printf '{"agent_type":"war-auditor","tool_input":{"command":""}}')"

# G3: git switch (write op, different verb than checkout — catches equivalence gap)
expect_deny "G3: git switch main → denied (write op)" \
  "$(auditor_cmd "git switch main")"

# G4: git stash (write op)
expect_deny "G4: git stash → denied (write op)" \
  "$(auditor_cmd "git stash")"

# G5: git fetch (network write-adjacent)
expect_deny "G5: git fetch → denied (not in read allowlist)" \
  "$(auditor_cmd "git fetch")"

# G6: git grep — admitted in ONE narrow form only: `-F` (or `--fixed-strings`) plus exactly one
# `-e <token>`. This row was the mechanical record of three grep-verb rejections (ADR 0029's
# rejected-and-deferred option, the 2026-07-22 spec's D3, the 2026-07-26 spec's D2). The
# 2026-10-22 ruling (plan 2026-10-20-rea-artifact-evidence D21, ADR 0029's Amendment
# 2026-10-22) reverses the "still no" for this fixed-string form only: on Claude Code 2.1.304
# no auditor seat had the Grep tool, so the sanctioned sweep channel did not exist at dispatch.
# The `-O` execution hole the 2026-07-26 ratification named stays closed by per-flag policing
# (group P), and the audit tree fingerprint hook is the compensating control. Flipping this row
# back to expect_deny, or widening it past `-F -e <token>`, contradicts that amendment.
# ADR 0029's Amendment 2026-10-30 lets the <token> be one quoted value (group Q).
expect_allow "G6: git grep -F -e token allowed (the one admitted grep form; ADR 0029 Amendment 2026-10-22)" \
  "$(auditor_cmd "git grep -F -e token")"

# ---------------------------------------------------------------------------
# CASE GROUP P: the narrow `git grep -F -e <token>` grammar (D21, ADR 0029
# Amendment 2026-10-22). The guard parses the grep tokens itself: `-F` (or
# `--fixed-strings`) is required, exactly one `-e <token>` is required, the
# optional read flags are `-n -i -l -w -c` (bare or in a short cluster parsed
# letter by letter), at most one bare revision, and an optional `-- <pathspec>...`
# (a glob byte passes only inside a quoted value, group Q). Every other flag denies by
# default: `-O`/`--open-files-in-pager` (runs a pager command) in any spelling
# or cluster, `-f`/`--file`, `--no-index`, `--recurse-submodules`, and the
# regex selectors `-E -G -P --extended-regexp --basic-regexp --perl-regexp`.
# P1-P9 carry the plan's exact labels. Deny rows pin the grep-grammar deny
# message substring so a crash cannot pass as a deny.
# ---------------------------------------------------------------------------
expect_allow "P1: git grep -F -e token allowed" \
  "$(auditor_cmd "git grep -F -e token")"

expect_deny_teach "P2: git grep without -F denied" \
  "$(auditor_cmd "git grep -e token")" "git grep admits one form only"

expect_deny_teach "P3: git grep -O denied" \
  "$(auditor_cmd "git grep -F -e token -O")" "-O runs a pager command"

expect_deny_teach "P4: git grep -nO cluster denied" \
  "$(auditor_cmd "git grep -nO -F -e token")" "-O runs a pager command"

expect_deny_teach "P5: git grep --open-files-in-pager denied" \
  "$(auditor_cmd "git grep -F -e token --open-files-in-pager=less")" "git grep admits one form only"

expect_deny_teach "P6: git grep -E denied" \
  "$(auditor_cmd "git grep -E -F -e token")" "git grep admits one form only"

# P7/P22 carry a full `-F -e token` so ONLY the -f/--file rule can deny: a
# payload without -e would still deny at the closing exactly-one-`-e` check,
# so the row could not see a regression that admits -f. Each pins the
# rule-specific substring, not the shared opening fragment.
expect_deny_teach "P7: git grep -f denied" \
  "$(auditor_cmd "git grep -F -e token -f /etc/passwd")" "carries -f"

expect_deny_teach "P8: git grep --no-index denied" \
  "$(auditor_cmd "git grep -F -e token --no-index")" "git grep admits one form only"

# P9: an unquoted pattern with a glob byte denies at the residue rule, BEFORE the
# grep grammar runs, and the metacharacter rule names the narrow form as the
# fallback. Group Q owns the quoted -e value this row used to deny. Built with
# jq -nc (C11's rationale).
expect_deny_teach "P9: git grep -F with an unquoted glob byte denied" \
  "$(jq -nc --arg c "git grep -F -e a*b" \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')" \
  "git grep -F -e <token>"

# P10-P15: the admitted grammar's optional parts, each allowed on its own.
expect_allow "P10: git grep --fixed-strings -e token → allowed (long -F spelling)" \
  "$(auditor_cmd "git grep --fixed-strings -e token")"

expect_allow "P11: git grep -nF -e token → allowed (short cluster parsed letter by letter)" \
  "$(auditor_cmd "git grep -nF -e token")"

expect_allow "P12: git grep -F -n -i -l -w -c -e token → allowed (every optional read flag)" \
  "$(auditor_cmd "git grep -F -n -i -l -w -c -e token")"

expect_allow "P13: git grep -F -e token HEAD~1 → allowed (one revision)" \
  "$(auditor_cmd "git grep -F -e token HEAD~1")"

expect_allow "P14: git grep -F -e token -- hooks/ skills/war → allowed (-- pathspec)" \
  "$(auditor_cmd "git grep -F -e token -- hooks/ skills/war")"

expect_allow "P15: work-audit-refine:war-evidence-auditor git grep -F -e token → allowed (evidence seat, same grammar)" \
  "$(typed_cmd "work-audit-refine:war-evidence-auditor" "git grep -F -e token")"

# P16-P27: default-deny by token shape for the rest of the grep option space.
expect_deny_teach "P16: git grep -F token → denied (pattern must ride -e)" \
  "$(auditor_cmd "git grep -F token")" "git grep admits one form only"

expect_deny_teach "P17: git grep -F -e a -e b → denied (exactly one -e)" \
  "$(auditor_cmd "git grep -F -e a -e b")" "git grep admits one form only"

expect_deny_teach "P18: git grep -F -e → denied (dangling -e)" \
  "$(auditor_cmd "git grep -F -e")" "git grep admits one form only"

expect_deny_teach "P19: git grep -Ovim -F -e token → denied (-O with attached pager, cluster spelling)" \
  "$(auditor_cmd "git grep -Ovim -F -e token")" "-O runs a pager command"

expect_deny_teach "P20: git grep -F -e token --open-files-in-pager → denied (bare long spelling)" \
  "$(auditor_cmd "git grep -F -e token --open-files-in-pager")" "git grep admits one form only"

expect_deny_teach "P21: git grep -F -e token --recurse-submodules → denied" \
  "$(auditor_cmd "git grep -F -e token --recurse-submodules")" "git grep admits one form only"

expect_deny_teach "P22: git grep -F -e token --file=pats → denied (long -f spelling)" \
  "$(auditor_cmd "git grep -F -e token --file=pats")" "'--file=pats' is not part of that form"

expect_deny_teach "P23: git grep -F -e token HEAD HEAD~1 → denied (at most one revision)" \
  "$(auditor_cmd "git grep -F -e token HEAD HEAD~1")" "git grep admits one form only"

expect_deny_teach "P24: git grep -nFe token → denied (-e never rides a cluster)" \
  "$(auditor_cmd "git grep -nFe token")" "git grep admits one form only"

expect_deny_teach "P25: git grep -F -P -e token → denied (--perl-regexp short spelling)" \
  "$(auditor_cmd "git grep -F -P -e token")" "git grep admits one form only"

expect_deny_teach "P26: git grep -F -e token --extended-regexp → denied (long regex selector)" \
  "$(auditor_cmd "git grep -F -e token --extended-regexp")" "git grep admits one form only"

expect_deny_teach "P27: git grep -F -e token -o → denied (-o stays out of the grammar)" \
  "$(auditor_cmd "git grep -F -e token -o")" "git grep admits one form only"

# P28/P29: the unlisted-verb deny and the not-a-git deny name the narrow
# fallback beside the Grep tool (D21: deny messages that pointed only at the
# Grep tool also name git grep -F -e <token>; the metacharacter deny is P9).
expect_deny_teach "P28: git fetch → denied + unlisted-verb teach names the git grep -F -e <token> fallback" \
  "$(auditor_cmd "git fetch")" "git grep -F -e <token>"

expect_deny_teach "P29: grep -n tok path → denied + not-a-git teach names the git grep -F -e <token> fallback" \
  "$(auditor_cmd "grep -n tok path")" "git grep -F -e <token>"

# ---------------------------------------------------------------------------
# CASE GROUP H: read-only global -C <path>
# The guard peels a leading `-C <path>` and re-enters the read-only subcommand
# allowlist unchanged, so the gate-audit pin `git -C <path> rev-parse HEAD`
# becomes runnable — WITHOUT widening the verb allowlist (a write verb after
# -C still denies) and WITHOUT relaxing the char allowlist (the bracket/$()
# form stays denied). Read verbs only; `git fetch` stays out of scope (#310).
# ---------------------------------------------------------------------------

# H1: git -C <path> rev-parse HEAD → allow (the pin command)
expect_allow "H1: git -C /abs/path/_refinery rev-parse HEAD → allowed" \
  "$(auditor_cmd "git -C /abs/path/_refinery rev-parse HEAD")"

# H2: git -C <path> show HEAD:file.txt → allow (the other read verb the auditor uses)
expect_allow "H2: git -C /abs/path show HEAD:file.txt → allowed" \
  "$(auditor_cmd "git -C /abs/path show HEAD:file.txt")"

# H2b: git -C <path> cat-file -e <oid> → allow. The no-fetch pin-validity lens
# (#310) relies on this read verb through the -C peel for its optional,
# non-blocking existence confirmation. There was NO -C cat-file allow-case
# before; without it the reworded lens would name a command whose runnability
# is unproven. cat-file is in the read-only subcommand allowlist, so the peeled
# `cat-file -e <oid>` re-enters and is allowed.
expect_allow "H2b: git -C /abs/sub cat-file -e <oid> → allowed (pin-validity optional confirm)" \
  "$(auditor_cmd "git -C /abs/sub cat-file -e abc123")"

# H3a: git -C <path> fetch → deny. Pins that `fetch` STAYS denied even through
# the spec-4 -C peel (#310): dropping fetch from the lens is "remove the call,"
# NOT "allow the verb." fetch is a network read outside the read-only allowlist,
# so after the -C peel the subcommand extractor's `*)` default-deny fires.
# Load-bearing regression pin — Step 3 proves it by temp-allowing fetch → RED.
expect_deny "H3a: git -C /abs/sub fetch → denied (-C does not admit fetch; #310)" \
  "$(auditor_cmd "git -C /abs/sub fetch")"

# H3: git -C <path> commit → deny (verb allowlist NOT widened by -C)
expect_deny "H3: git -C /abs/path commit -m x → denied (-C does not widen the verb allowlist)" \
  "$(auditor_cmd "git -C /abs/path commit -m x")"

# H4: bare git -C (no path/subcommand) → deny
expect_deny "H4: git -C → denied (global -C with no path/subcommand)" \
  "$(auditor_cmd "git -C")"

# H5: literal bracket/$() form → deny (char allowlist still forbids [ ] $ ( ) ").
# Proves the Phase-2 reword does NOT relax injection defense (C5 parity).
# CRITICAL: build with `jq -nc --arg`, NOT auditor_cmd — the bracket form
# contains double-quotes; auditor_cmd's printf '{..."command":"%s"...}' would
# emit INVALID JSON, the guard's jq read of .agent_type returns empty, and the
# non-auditor `*) exit 0` pass-through fires — a pass-through exit 0 with empty
# stderr, on which expect_deny (exit 2 + `WAR:` stderr marker required) fails
# loud at authoring time rather than landing vacuous (memory
# printf-json-escaping-vacuous-test-case, scope-bounded to exit-0-asserting
# allow cases).
expect_deny "H5: [ \"\$(git -C <path> rev-parse HEAD)\" = \"<sha>\" ] → denied (C5 subst parity)" \
  "$(jq -nc --arg c '[ "$(git -C /abs/path rev-parse HEAD)" = "abc123" ]' \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')"

# H6: git -C -C rev-parse HEAD → allow (double -C peels harmlessly: first `-C `
# dropped, second `-C` consumed as the <path> token → rest = `rev-parse HEAD`).
# Load-bearing red-first like H1/H2: pre-peel `rest` begins `-C ` → subcommand
# extractor's `*)` default deny → exit 2, so expect_allow FAILs.
expect_allow "H6: git -C -C rev-parse HEAD → allowed (first -C peeled; rest = rev-parse HEAD)" \
  "$(auditor_cmd "git -C -C rev-parse HEAD")"

# ---------------------------------------------------------------------------
# CASE GROUP I: suffix-anchored agent-type arm (#810)
# The "Only gate war-auditor and war-evidence-auditor agents" block's auditor arm is suffix-anchored (`*war-auditor`),
# capturing the dispatched `work-audit-refine:war-auditor` but NOT a longer
# `...war-auditor-helper` decoration. I1/I2 are a delete-the-feature pair:
# revert the anchor to a substring arm and I1 flips to deny (over-capture)
# while I2 stays deny — so I1 is the case that proves the narrowing.
# ---------------------------------------------------------------------------

expect_allow "I0a: war-helper runs a read-only git read" \
  "$(typed_cmd "work-audit-refine:war-helper" "git -C /tmp/x rev-parse --verify task^0")"
expect_deny "I0b: war-helper git push is denied" \
  "$(typed_cmd "work-audit-refine:war-helper" "git push")"
expect_deny "I0c: war-helper cannot run command substitution" \
  "$(typed_cmd "work-audit-refine:war-helper" 'git diff $(git merge-base a b)..b')"

# I1: trailing-junk agent type → arm no longer captures → falls through to the
# pass-through `*) exit 0`, so a write command that WOULD be denied when gated
# (git push, cf. B1) is allowed un-gated.
expect_allow "I1: work-audit-refine:war-auditor-helper git push → exit 0 (arm no longer captures)" \
  "$(typed_cmd "work-audit-refine:war-auditor-helper" "git push")"

# I2: exact dispatched shape (namespaced, nothing trailing) → still captured →
# git push still verb-gated → denied. Guards against deny-side under-capture
# (fail-open inversion) on the live default string.
expect_deny "I2: work-audit-refine:war-auditor git push → denied (exact dispatched shape still gated)" \
  "$(typed_cmd "work-audit-refine:war-auditor" "git push")"

# ---------------------------------------------------------------------------
# CASE GROUP J: widened read grammar (#980 / #982)
# Proves exactly ~ and % were added to the char set, ls-tree is admitted, and
# read-form branch admits its read shapes while EVERY write shape denies by
# token-shape default-deny (no write flag is enumerated). The C/E/H5 injection
# cases above stay unmodified and green — that is the widening proof: only ~/%
# joined the char set, nothing in the metacharacter/global-flag defense moved.
# SCOPE: the "only ~/%" delta above is THIS group's history (#980 / #982), not a
# standing claim about the live char set — 2026-07-26 D1 later added + (group K).
# ---------------------------------------------------------------------------

# J1: git diff HEAD~1 — the ~ char (most idiomatic revision form) now allowed
expect_allow "J1: git diff HEAD~1 → allowed (~ admitted to char set)" \
  "$(auditor_cmd "git diff HEAD~1")"

# J2: git log --pretty=format:%H — the % char now allowed
expect_allow "J2: git log --pretty=format:%H → allowed (% admitted to char set)" \
  "$(auditor_cmd "git log --pretty=format:%H")"

# J3: git ls-tree -r HEAD — new pure-read verb
expect_allow "J3: git ls-tree -r HEAD → allowed (ls-tree read verb)" \
  "$(auditor_cmd "git ls-tree -r HEAD")"

# J4: git ls-tree HEAD skills/ — ls-tree with a pathspec
expect_allow "J4: git ls-tree HEAD skills/ → allowed (ls-tree pathspec)" \
  "$(auditor_cmd "git ls-tree HEAD skills/")"

# J5: git branch (bare) — lists, allow
expect_allow "J5: git branch → allowed (bare branch lists)" \
  "$(auditor_cmd "git branch")"

# J6: git branch -a -v — separated enumerated read short flags
expect_allow "J6: git branch -a -v → allowed (enumerated read flags)" \
  "$(auditor_cmd "git branch -a -v")"

# J7: git branch --contains=abc123 — =-attached read flag
expect_allow "J7: git branch --contains=abc123 → allowed (=-attached read flag)" \
  "$(auditor_cmd "git branch --contains=abc123")"

# J8: git branch --show-current — read flag
expect_allow "J8: git branch --show-current → allowed (read flag)" \
  "$(auditor_cmd "git branch --show-current")"

# J9: git branch -d x → deny (delete write flag, not enumerated)
expect_deny "J9: git branch -d x → denied (delete write flag)" \
  "$(auditor_cmd "git branch -d x")"

# J10: git branch -D x → deny (force-delete write flag)
expect_deny "J10: git branch -D x → denied (force-delete write flag)" \
  "$(auditor_cmd "git branch -D x")"

# J11: git branch -m a b → deny (rename write flag)
expect_deny "J11: git branch -m a b → denied (rename write flag)" \
  "$(auditor_cmd "git branch -m a b")"

# J12: git branch newname → deny (flagless creation — bare non-flag token)
expect_deny "J12: git branch newname → denied (flagless creation)" \
  "$(auditor_cmd "git branch newname")"

# J13: git branch -f x HEAD → deny (force write flag)
expect_deny "J13: git branch -f x HEAD → denied (force write flag)" \
  "$(auditor_cmd "git branch -f x HEAD")"

# J14: git branch --set-upstream-to=origin/x → deny (=-form but a WRITE flag,
# not in the enumerated read set — default-deny by token shape)
expect_deny "J14: git branch --set-upstream-to=origin/x → denied (upstream write flag)" \
  "$(auditor_cmd "git branch --set-upstream-to=origin/x")"

# J15: git branch -av → deny. The combined short cluster is NOT an enumerated
# token, so the per-token loop denies it even though separated `-a -v` (J6)
# allows — equivalence-class discipline: only the exact enumerated tokens pass.
expect_deny "J15: git branch -av → denied (combined short cluster not enumerated; cf. J6)" \
  "$(auditor_cmd "git branch -av")"

# J16: git branch --contains abc123 (SPACE form) → deny, AND the deny
# micro-teaches the =-attached read-flag form on stderr (D6). The space form is
# the first friction a seat hits; the message names the sanctioned = form.
expect_deny_teach "J16: git branch --contains abc123 (space form) → denied + =-form micro-teach" \
  "$(auditor_cmd "git branch --contains abc123")" "=-attached"

# J17: non-git command → deny micro-teaches the Read/Grep/Glob file-access tools (D6).
expect_deny_teach "J17: cat file.txt → denied + Read/Grep/Glob micro-teach" \
  "$(auditor_cmd "cat file.txt")" "Read/Grep/Glob"

# J18: unlisted git verb → deny micro-teaches the Grep tool for repo-wide search (D6).
expect_deny_teach "J18: git tag v1 → denied + Grep-tool micro-teach" \
  "$(auditor_cmd "git tag v1")" "Grep tool"

# ---------------------------------------------------------------------------
# CASE GROUP K: + admitted to the char set + forbidden-char micro-teach (#1138 / #1025)
# A LATER widening than group J's (#980 / #982) ~ and % pair: the 2026-07-26 D1
# adds exactly one more char, +, so the range-length line forms -L <start>,+<n>
# and -L /re/,+<n> stop tripping the forbidden-char deny before their already-
# allowlisted verb (blame / log) is ever consulted. Nothing else moves: K4 pins
# that a +-carrying command still dies on ; composition, and the C/E/H5
# injection cases above stay unmodified and green — the same widening proof
# group J used. K5/K6/K7/K8 pin the D3 micro-teach on the forbidden-char deny.
# ---------------------------------------------------------------------------

# K1: git blame -L <start>,+<n> — the numeric range-length form (the #1138 denial family)
expect_allow "K1: git blame -L 10,+5 hooks/validate-auditor-git.sh → allowed (+ admitted to char set)" \
  "$(auditor_cmd "git blame -L 10,+5 hooks/validate-auditor-git.sh")"

# K2: git blame -L /re/,+<n> — the regex-anchored range-length form
expect_allow "K2: git blame -L /deny/,+10 hooks/validate-auditor-git.sh → allowed (regex -L form)" \
  "$(auditor_cmd "git blame -L /deny/,+10 hooks/validate-auditor-git.sh")"

# K3: git log -L <start>,+<n>:<file> — the log-side range form. Required, not optional:
# the log/blame case arms carry no per-flag policing and -L matches no post-subcommand
# deny pattern, so the char set is the whole gate here.
expect_allow "K3: git log -L 5,+3:hooks/validate-auditor-git.sh → allowed (log -L range form)" \
  "$(auditor_cmd "git log -L 5,+3:hooks/validate-auditor-git.sh")"

# K4: composition deny with a + payload → the widening must NOT weaken chain denial.
# ; is still outside the char set, so the forbidden-char deny fires before the
# allowlisted blame verb is ever consulted (C2 parity, now with a + in the command).
expect_deny "K4: git blame -L 1,+5; rm -rf . → denied (semicolon composition still denied)" \
  "$(auditor_cmd "git blame -L 1,+5; rm -rf .")"

# K5/K6/K7/K8: the D3 forbidden-char micro-teach, asserted four times on one payload —
# one per contract element, so no element can be trimmed away silently.
# SITE-PINNED BY ROUTING, not merely by substring: the char checks (the #1828 newline
# pre-check, then the residue allowlist) are the first checks after the empty-command
# guard, and this payload carries no newline, so "git diff HEAD && git log" can only
# exit at the forbidden-char deny site — a future teach-vocabulary overlap at another
# deny site cannot make any of these assertions pass vacuously.
# K5 pins the prefix tail "forbidden character(s):" plus the 20-char residue echo at
# the front (the leading "command contains" fragment rides along, unpinned by itself).
expect_deny_teach "K5: git diff HEAD && git log → denied + byte-preserved prefix and residue echo" \
  "$(auditor_cmd "git diff HEAD && git log")" "forbidden character(s): &&"

# K6 pins the teach span itself. This substring is BYTE-FROZEN — polishing the prose
# around it is in bounds; editing the span reds this case, by design.
expect_deny_teach "K6: git diff HEAD && git log → denied + one-bare-git-command micro-teach" \
  "$(auditor_cmd "git diff HEAD && git log")" "one bare git command per Bash call"

# K7 pins the third teach element — the Read/Grep/Glob clause — at THIS deny site.
# Without it the message could be trimmed to end after "per Bash call" and K5/K6 stay
# green (J17's Read/Grep/Glob assertion is anchored on the not-a-git deny, a different route).
expect_deny_teach "K7: git diff HEAD && git log → denied + Read/Grep/Glob teach element" \
  "$(auditor_cmd "git diff HEAD && git log")" "Read/Grep/Glob tools"

# K8 pins the remaining teach element — split-the-chain. Without it the middle clause
# could be dropped from the message and K5/K6/K7 all stay green (the same trimming
# argument K7 records, applied to the one element K7 left unpinned).
expect_deny_teach "K8: git diff HEAD && git log → denied + split-the-chain teach element" \
  "$(auditor_cmd "git diff HEAD && git log")" "split && / ; chains"

# ---------------------------------------------------------------------------
# CASE GROUP L: forbidden-char deny NAMES THE RULE THAT FIRED (#1412 fix 1)
# The 191-denial run behind #1412 was seats typing real searches (git grep
# 'a\|b', --include=*.py), for which the split-the-chain framing K8 pins does
# not describe what was typed. The message names the metacharacter rule —
# glob/alternation/expansion metacharacters are refused outright — with the
# Grep-tool (glob:/type: filters) remedy (since #1435 that clause lives on the
# non-chain residue branch; group M pins the classification). Message text ONLY: the deny
# DECISION is byte-unchanged (exit 2, char check still fires first; the verb set
# later admitted the narrow `git grep -F -e <token>` form, cf. G6 and group P,
# which this payload never reaches), and K5–K8 stay green on their frozen substrings.
# L1/L2 assert on a representative denied search: git grep with an unquoted
# alternation \| — the #1412 shape (Q89 pins the quoted spelling). Routing-pinned like K5–K8: the char checks (the
# #1828 newline pre-check, then the residue allowlist) are the first checks
# after the empty-command guard, and this payload carries no newline, so it can
# only exit at the forbidden-char deny site (never at group P's grep-grammar site —
# the \| denies before the verb is ever parsed). Built with jq -nc --arg (C11's
# rationale: \| is an invalid JSON escape, so auditor_cmd's printf would emit
# unparseable JSON, the guard's jq read of .agent_type would return empty, and
# the non-auditor `*) exit 0` pass-through would exit 0 with empty stderr —
# on which expect_deny_teach, requiring exit 2 + the `WAR:` marker + a message
# substring, fails loud at authoring time a fortiori; the corrupted case never
# lands vacuous).
# ---------------------------------------------------------------------------

# L1: the rule that fired is NAMED on stderr (message-content assert, not just
# exit code — the guard-specificity lesson).
expect_deny_teach "L1: git grep a\\|b → denied + metacharacter rule named" \
  "$(jq -nc --arg c "git grep a\\|b" \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')" \
  "glob/alternation/expansion metacharacters are refused outright"

# L2: the rule clause carries its own remedy — the Grep tool's glob:/type:
# filters instead of shell grep/git grep. Pinned separately: without this pin
# the remedy half could be trimmed and L1 stays green (the same trimming
# argument K7/K8 record, applied to the new clause's two halves).
expect_deny_teach "L2: git grep a\\|b → denied + Grep-tool filters remedy" \
  "$(jq -nc --arg c "git grep a\\|b" \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')" \
  "Grep tool (glob:/type: filters) instead of shell grep/git grep"

# ---------------------------------------------------------------------------
# CASE GROUP M: residue-classified deny — chain-operator vs metacharacter (#1435)
# The forbidden-char deny now classifies the residue BEFORE composing the
# message: a residue of ONLY chain/control operators (& ; |) names the
# chain-operator rule (one bare git command per Bash call, with the #1421(b)
# split-the-chain + Read/Grep/Glob ergonomics retained on that branch — K6/K7/K8
# keep their frozen substrings there); any other residue byte names the
# metacharacter rule (L1/L2's branch). Message-only: allowlist, decision, and
# exit codes byte-unchanged — every group C/E/H5/K case above stays green
# unmodified, and M5 pins the allow path untouched. An embedded newline never
# reaches this classifier: the hook's pre-check on `$cmd` denies it before the
# residue assignment (#1828) — group N owns those rows.
# ---------------------------------------------------------------------------

# M1: chain-operator denial names the chain-operator rule (End state 13). The &&
# payload's residue is chain-only, so it must NOT be attributed to the glob rule.
expect_deny_teach "M1: git diff HEAD && git log → denied + chain-operator rule named" \
  "$(auditor_cmd "git diff HEAD && git log")" \
  "the chain-operator rule fired"

# M2: pipe composition is a chain-operator denial too — | alone (no quotes, no
# backslash) is composition, not a search shape (contrast L1's a\|b).
expect_deny_teach "M2: git log | wc -l → denied + chain-operator rule named" \
  "$(auditor_cmd "git log | wc -l")" \
  "the chain-operator rule fired"

# M3: glob denial names the metacharacter rule, not the chain-operator rule —
# the * residue carries no chain byte, so the chain framing would misdescribe it
# (the #1435 over-attribution, direction reversed).
expect_deny_teach "M3: git ls-files *.mjs → denied + metacharacter rule named" \
  "$(auditor_cmd "git ls-files *.mjs")" \
  "the metacharacter rule fired"

# M4: mixed residue (backslash + |, the #1412 search shape L1/L2 assert, unquoted
# since group Q masks the quoted value, Q89 pins that spelling) classifies METACHARACTER — the non-chain bytes prove a search/expansion
# shape, so the chain-operator rule must not fire. jq -nc --arg per C11/L1's
# escaping rationale.
expect_deny_teach "M4: git grep a\\|b (mixed residue) → denied + metacharacter (not chain-operator) rule" \
  "$(jq -nc --arg c "git grep a\\|b" \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')" \
  "the metacharacter rule fired"

# M1b/M2b: the chain branch must NOT also emit the metacharacter clause — the
# absence half of End state 13 ('names the chain-operator rule class, NOT the
# glob rule'). Without these, an edit emitting BOTH clauses on the chain branch
# (the exact #1412 over-attribution shape) keeps M1/M2 green.
expect_deny_lacks "M1b: git diff HEAD && git log → metacharacter rule NOT named" \
  "$(auditor_cmd "git diff HEAD && git log")" \
  "the metacharacter rule fired"
expect_deny_lacks "M2b: git log | wc -l → metacharacter rule NOT named" \
  "$(auditor_cmd "git log | wc -l")" \
  "the metacharacter rule fired"

# M3b/M4b: the metacharacter branch must NOT also name the chain-operator rule
# — same absence pin, direction reversed.
expect_deny_lacks "M3b: git ls-files *.mjs → chain-operator rule NOT named" \
  "$(auditor_cmd "git ls-files *.mjs")" \
  "the chain-operator rule fired"
expect_deny_lacks "M4b: git grep a\\|b (mixed residue) → chain-operator rule NOT named" \
  "$(jq -nc --arg c "git grep a\\|b" \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')" \
  "the chain-operator rule fired"

# M5: allow path untouched by the classification — a clean read command never
# reaches the residue classifier's deny branches (chain-operator or otherwise).
expect_allow "M5: git diff main...feature → still allowed (chain-operator classification leaves the allow path untouched)" \
  "$(auditor_cmd "git diff main...feature")"

# M6: OVERSIZED forbidden-char payload still exits exactly 2 (fail-closed).
# A pipeline-assignment residue echo (residue | tr | head -c 20) under
# set -euo pipefail would SIGPIPE tr (141) once the residue exceeds the pipe
# buffer (~16KB macOS / 64KB Linux), and a non-2 PreToolUse exit is
# NON-BLOCKING — the denied command would proceed. expect_deny asserts rc=2
# exactly (not merely non-zero), so a 141 crash reds this case, by design.
# 70,000 '*' bytes clear both platforms' pipe capacities.
_oversized_pad="$(printf '%*s' 70000 '' | LC_ALL=C tr ' ' '*')"
expect_deny "M6: >64KB all-forbidden-char payload → still exit 2 (no SIGPIPE fail-open)" \
  "$(jq -nc --arg c "git log $_oversized_pad" \
     '{agent_type:"war-auditor",tool_input:{command:$c}}')"
unset _oversized_pad

# ---------------------------------------------------------------------------
# CASE GROUP N: newline-deny — the embedded-newline pre-check (#1828, #1830)
# A newline is outside the char allowlist, but the $(...) at the residue
# assignment strips trailing newlines, so a payload whose ONLY out-of-allowlist
# byte is a newline used to reach the verb parser with an EMPTY residue and
# pass: `git diff HEAD<newline>echo pwned` exited 0 (a read-only sandbox
# escape). The hook now matches `$cmd` itself for a newline BEFORE the residue
# assignment and denies with the chain-operator arm's text. Payloads use the
# JSON-escaped `\n` shape: auditor_cmd's printf '%s' passes the two bytes
# through verbatim, and the hook's jq read decodes them to a real newline, so
# each case asserts against the bytes the hook actually parses.
# ---------------------------------------------------------------------------

# N1: newline-joined WRITE git command — `log HEAD` satisfies the `log\ *` verb
# arm, so the allowlist never sees `push` (allowed at base, exit 0). The space
# after `log` is load-bearing: `git log` + newline + `git push` was already
# denied at base by the first-word parse, so it would prove nothing. (A BARE
# trailing newline is not a row here: the hook's own `cmd="$(get …)"` read
# strips it before the pre-check can see it, so `git diff HEAD` + newline runs
# as one bare read command — no bypass.)
expect_deny_teach "N1 newline-deny: git log HEAD + newline + git push → denied + chain-operator rule named" \
  "$(auditor_cmd 'git log HEAD\ngit push')" \
  "the chain-operator rule fired"

# N2: mid-command newline followed by allowlisted bytes — still a newline-only
# residue, still stripped to empty without the pre-check.
expect_deny_teach "N2 newline-deny: git diff HEAD + newline + -- path → denied + chain-operator rule named" \
  "$(auditor_cmd 'git diff HEAD\n-- path')" \
  "the chain-operator rule fired"

# N3: the #1828 bypass itself — newline-joined second command.
expect_deny_teach "N3 newline-deny: git diff HEAD + newline + echo pwned → denied + chain-operator rule named" \
  "$(auditor_cmd 'git diff HEAD\necho pwned')" \
  "the chain-operator rule fired"

# N3b: the pre-check routes to the chain-operator arm ONLY — the metacharacter
# clause must be absent (same absence pin as M1b/M2b).
expect_deny_lacks "N3b newline-deny: git diff HEAD + newline + echo pwned → metacharacter rule NOT named" \
  "$(auditor_cmd 'git diff HEAD\necho pwned')" \
  "the metacharacter rule fired"

# N4/N5/N6: the pre-check's deny text is a hand copy of the classifier's
# chain-operator literal (the slice keeps the classifier byte-unchanged, so no
# shared variable). N1-N3 pin only the rule name, and K6/K7/K8 pin the teach
# elements on the classifier copy only, so a trimmed pre-check copy would go
# unnoticed. These three rows pin each teach element on the pre-check copy.
expect_deny_teach "N4 newline-deny: git diff HEAD + newline + echo pwned → denied + one-bare-git-command teach" \
  "$(auditor_cmd 'git diff HEAD\necho pwned')" \
  "one bare git command per Bash call"

expect_deny_teach "N5 newline-deny: git diff HEAD + newline + echo pwned → denied + split-the-chain teach element" \
  "$(auditor_cmd 'git diff HEAD\necho pwned')" \
  "split && / ; chains"

expect_deny_teach "N6 newline-deny: git diff HEAD + newline + echo pwned → denied + Read/Grep/Glob teach element" \
  "$(auditor_cmd 'git diff HEAD\necho pwned')" \
  "Read/Grep/Glob tools"

# ---------------------------------------------------------------------------
# CASE GROUP O: the evidence seat arm (plan 2026-10-20-rea-artifact-evidence
# Task 2.2, D3). `*war-evidence-auditor` is its own suffix-anchored arm with
# the same deny set as `*war-auditor`: the `*war-auditor` pattern does not
# capture `<ns>:war-evidence-auditor`, so before the arm the seat fell to the
# pass-through `*) exit 0` (delete-the-feature: remove the arm and O1-O3 flip
# to exit 0). O1 carries the plan's exact label. The seat's MCP tools are gated
# by validate-evidence-auditor-mcp.sh, not here.
# ---------------------------------------------------------------------------

# O1: non-git command → denied (exact plan label).
expect_deny "war-evidence-auditor non-git command denied" \
  "$(typed_cmd "war-evidence-auditor" "cat /etc/passwd")"

# O2: exact dispatched shape (namespaced) → still captured → non-git denied.
# Deny-side under-capture guard on the live default string.
expect_deny "exact-shape :war-evidence-auditor non-git command denied (deny-side under-capture guard)" \
  "$(typed_cmd "work-audit-refine:war-evidence-auditor" "ls /tmp")"

# O3: a write verb is gated for the seat exactly as for war-auditor (B1 parity).
expect_deny "O3: work-audit-refine:war-evidence-auditor git push → denied (same verb gate as war-auditor)" \
  "$(typed_cmd "work-audit-refine:war-evidence-auditor" "git push")"

# O4: the read verb the card names for the manifest read is admitted.
expect_allow "O4: work-audit-refine:war-evidence-auditor git show abc1234:docs/plans/evidence/x.manifest.json → allowed" \
  "$(typed_cmd "work-audit-refine:war-evidence-auditor" "git show abc1234:docs/plans/evidence/x.manifest.json")"

# O5: trailing-junk decoration → the suffix-anchored arm no longer captures →
# pass-through (I1 parity).
expect_allow "O5: work-audit-refine:war-evidence-auditor-helper cat x → exit 0 (arm no longer captures)" \
  "$(typed_cmd "work-audit-refine:war-evidence-auditor-helper" "cat x")"

# ---------------------------------------------------------------------------
# CASE GROUP Q: quoted values (#1915, #2374) and the flags that run a command.
# The guard swaps each admitted quoted value for one plain word, then every
# rule above reads that masked command, so a quoted value can only sit where a
# plain word could. Q-rows carry one branch each: an allow row per admitted
# position, a deny row per way to reach a flag or the shell through a quote.
# Every payload goes through jq --arg (C11's rationale).
# ---------------------------------------------------------------------------
q_cmd() { jq -nc --arg c "$1" '{agent_type:"war-auditor",tool_input:{command:$c}}'; }

expect_allow "Q1: -S single-quoted value with a space" "$(q_cmd "git log -S'two words' HEAD")"
expect_allow "Q2: -S double-quoted value" "$(q_cmd 'git log --oneline -S"override_effort" abc123')"
expect_allow "Q3: -G single-quoted character class" "$(q_cmd "git diff --name-only -i -G'sonnet[ -]5' a b")"
expect_allow "Q4: -G space form, quoted regex" "$(q_cmd "git log -i -G 'sonnet[-_.]?5' --oneline a..b")"
expect_allow "Q5: -G regex with a backslash stays inert in single quotes" "$(q_cmd "git diff --stat -G'sonnet\\s5' a b")"
expect_allow "Q6: -S value with parens" "$(q_cmd "git diff --stat -S'dict(f.MID)' a..b")"
expect_allow "Q7: blame -L space form, quoted regex" "$(q_cmd "git blame -s -L '/^## Version/,+3' abc -- README.md")"
expect_allow "Q8: blame -L attached quoted regex" "$(q_cmd "git blame -L'/^.\\sStep.*First/,+22' abc -- f")"
expect_allow "Q9: log --format quoted value" "$(q_cmd "git log --format='%H %s' -1")"
expect_allow "Q10: log --pretty quoted value" "$(q_cmd "git log --pretty='%h %s' -1")"
expect_allow "Q11: --pretty=format: quoted value" "$(q_cmd "git log --pretty=format:'%h %s' -1")"
expect_allow "Q12: --pretty=tformat: quoted value" "$(q_cmd "git log --pretty=tformat:'%h %s' -1")"
expect_allow "Q13: --format=format: quoted value" "$(q_cmd "git log --format=format:'%h %s' -1")"
expect_allow "Q14: --format=tformat: quoted value" "$(q_cmd "git log --format=tformat:'%h %s' -1")"
expect_allow "Q15: --grep quoted value" "$(q_cmd "git log --grep='fix(war)' --oneline")"
expect_allow "Q16: pathspec glob after --" "$(q_cmd "git ls-files --full-name -- ':/**/run_merge_convert.py'")"
expect_allow "Q17: bare quoted rev:path with brackets" "$(q_cmd "git show 'abc123:apps/app/decision/[id]/thread.tsx'")"
expect_allow "Q18: bare quoted pathspec with no --" "$(q_cmd 'git ls-files "*logger_helper*"')"
expect_allow "Q19: git grep -F -e quoted text" "$(q_cmd "git grep -F -e 'a b'")"
expect_allow "Q20: git grep -F -e quoted text with revision and quoted pathspec" "$(q_cmd "git grep -n -F -e \"| D13\" abc123 -- 'docs/*.md'")"
expect_allow "Q21: -C quoted path with a space" "$(q_cmd "git -C '/a b/wt' log --oneline -1")"
expect_allow "Q22: non-ASCII bytes inside quotes" "$(q_cmd "git log --format=%H -S'🚨 −1' abc123")"
expect_allow "Q22b: a listed head takes a dash-led value" "$(q_cmd "git log -S'--textconv' HEAD")"
expect_allow "Q23: a quote byte of the other kind inside the value" "$(q_cmd "git log -S'say \"hi\"' HEAD")"
expect_allow "Q24: three quoted values in one command" "$(q_cmd "git log --format='%h %s' -G'a[b]' -- 'x y/*'")"
expect_allow "Q25: evidence seat admits a quoted value" \
  "$(jq -nc --arg c "git log -S'a b'" '{agent_type:"work-audit-refine:war-evidence-auditor",tool_input:{command:$c}}')"
expect_allow "Q26: helper seat admits a quoted value" \
  "$(jq -nc --arg c "git diff --name-only -- 'a b'" '{agent_type:"work-audit-refine:war-helper",tool_input:{command:$c}}')"

# A quote never reaches a flag, a verb or a -C write.
expect_deny "Q30: whole --output token quoted with a space" "$(q_cmd "git log '--output=/tmp/a b'")"
expect_deny "Q31: whole --output token quoted, no space" "$(q_cmd "git log '--output=/tmp/x'")"
expect_deny "Q32: --output value quoted" "$(q_cmd "git log --output='/tmp/a b'")"
expect_deny "Q33: quote inside a flag name" "$(q_cmd "git log --out'put'=/tmp/x")"
expect_deny "Q34: --ext-diff split by a quote" "$(q_cmd "git diff --ext'-diff'")"
expect_deny "Q35: global -c quoted" "$(q_cmd "git '-c core.pager=x' log")"
expect_deny "Q36: attached -c value quoted" "$(q_cmd "git -c'core.pager=x y' log")"
expect_deny "Q37: quoted verb" "$(q_cmd "git 'push'")"
expect_deny "Q38: quoted verb after -C" "$(q_cmd "git -C /x 'push origin'")"
expect_deny "Q39: quoted -C path keeps the write verb denied" "$(q_cmd "git -C '/a b' push")"
expect_deny "Q40: quoted -C path keeps fetch denied" "$(q_cmd "git -C '/a b' fetch")"
expect_deny "Q41: quoted --exec-path" "$(q_cmd "git --exec-path='/a b' log")"
expect_deny "Q42: bare quoted value that starts with a dash" "$(q_cmd "git log '-p x'")"
expect_deny "Q43: -O value quoted (default-deny on a head outside the list)" "$(q_cmd "git diff -O'a b'")"
expect_deny "Q44: --contents value quoted (default-deny)" "$(q_cmd "git blame --contents='a b' f")"
expect_deny_teach "Q45: --since value quoted (default-deny) + the deny names the quote shape" "$(q_cmd "git log --since='2 weeks ago'")" "a quote must open the token or follow -S, -G, -L, --grep=, --format= or --pretty="
expect_deny "Q46: rev:path quoted from the middle" "$(q_cmd "git show HEAD:'a b'")"
# The shell stays denied around and inside a quoted value.
expect_deny_teach "Q50: chain after a quoted value" "$(q_cmd "git log -S'a b' && rm x")" "the chain-operator rule fired"
expect_deny "Q51: semicolon after a quoted value" "$(q_cmd "git log -S'a b'; rm x")"
expect_deny_teach "Q52: pipe after a quoted value" "$(q_cmd "git log -S'a b' | wc -l")" "the chain-operator rule fired"
expect_deny "Q53: redirect after a quoted value" "$(q_cmd "git log -S'a b' > /tmp/x")"
expect_deny "Q54: double-quoted command substitution" "$(q_cmd 'git log -S"$(id)"')"
expect_deny "Q55: double-quoted backtick" "$(q_cmd 'git log -S"`id`"')"
expect_deny "Q56: double-quoted variable" "$(q_cmd 'git log -S"$HOME"')"
expect_deny "Q57: an escaped double quote ends the value early, so the closing-quote rule denies" "$(q_cmd 'git log -S"a\"; rm x; echo \"b"')"
expect_deny "Q57b: double-quoted backslash alone" "$(q_cmd 'git log -S"a\b"')"
expect_deny "Q58: double-quoted bang" "$(q_cmd 'git log -S"a!b"')"
expect_deny "Q59: ANSI-C quote" "$(q_cmd "git log -S\$'a'")"
expect_deny "Q60: adjacent quoted segments" "$(q_cmd "git log -S'a''b'")"
expect_deny "Q61: text after the closing quote" "$(q_cmd "git log -S'a b'c")"
expect_deny "Q62: mixed adjacent quote kinds" "$(q_cmd "git log -S'a'\"b\"")"
expect_deny "Q63: unterminated single quote" "$(q_cmd "git log -S'a b")"
expect_deny "Q64: unterminated double quote" "$(q_cmd 'git log -S"a b')"
expect_deny "Q65: empty quoted value" "$(q_cmd "git log -S''")"
expect_deny "Q66: bare empty quoted value" "$(q_cmd "git show ''")"
expect_deny "Q67: backslash-escaped quote opens no value" "$(q_cmd "git log \\'a ; rm x\\'")"
expect_deny "Q67b: paired backslashes open no value" "$(q_cmd "git log \\'a\$(id)\\'")"
expect_deny "Q67c: a value with the fingerprint hook's space stand-in" "$(q_cmd "$(printf "git log -S'a\037b'")")"
expect_deny "Q67d: a value with the fingerprint hook's tab stand-in" "$(q_cmd "$(printf "git log -S'a\036b'")")"
expect_deny "Q68: newline inside a quoted value" "$(q_cmd "$(printf "git log -S'a\nb'")")"
expect_deny "Q69: nine quoted values exceed the cap" \
  "$(q_cmd "git log -- 'a' 'a' 'a' 'a' 'a' 'a' 'a' 'a' 'a'")"
expect_allow "Q70: eight quoted values sit at the cap" \
  "$(q_cmd "git log -- 'a' 'a' 'a' 'a' 'a' 'a' 'a' 'a'")"
# branch and grep keep their narrow grammars with a quoted value in play.
expect_deny "Q71: branch denies a bare quoted name" "$(q_cmd "git branch 'a b'")"
expect_deny "Q72: branch denies a quoted flag value" "$(q_cmd "git branch --contains='a b'")"
expect_deny_teach "Q73: grep still needs -F" "$(q_cmd "git grep -e 'a b'")" "git grep admits one form only"
expect_deny_teach "Q74: grep still takes one -e" "$(q_cmd "git grep -F -e a -e 'b c'")" "git grep admits one form only"
expect_deny "Q75: grep -O value quoted" "$(q_cmd "git grep -O'vim x' -F -e t")"
expect_deny "Q76: grep -O flag quoted" "$(q_cmd "git grep '-O x' -F -e t")"
expect_deny_teach "Q77: grep regex selector stays out with a quoted value" "$(q_cmd "git grep -G'a b' -F -e t")" "git grep admits one form only"
expect_deny_teach "Q78: a second quoted bare grep token is a second revision" \
  "$(q_cmd "git grep -F -e t 'a b' 'c d'")" "git grep admits one form only"

# Flags that run a configured command (security rule of #1915's admission).
for _flagcase in 'git show --filters HEAD' 'git diff --ext-diff HEAD' 'git log --ext-diff -p' 'git show --ext-diff HEAD' \
  'git diff --ext-d' 'git show --textconv HEAD' 'git diff --textconv' 'git log --textconv -p' \
  'git blame --textconv f' 'git cat-file --textconv HEAD:x' 'git cat-file --textcon HEAD:x' \
  'git cat-file --text HEAD:x' 'git cat-file --tex HEAD:x' 'git cat-file --te HEAD:x' 'git cat-file --t HEAD:x' \
  'git cat-file --fi HEAD:x' 'git cat-file --filt HEAD:x' \
  'git cat-file --filters HEAD:x' 'git -C /x cat-file --filters HEAD:x'; do
  expect_deny_teach "Q80: $_flagcase → denied" "$(q_cmd "$_flagcase")" "runs a configured command"
done
expect_allow "Q81: --no-ext-diff stays a read flag" "$(q_cmd "git diff --no-ext-diff HEAD")"
expect_allow "Q82: --no-textconv stays a read flag" "$(q_cmd "git log --no-textconv -p")"
expect_allow "Q83: --text stays a read flag on diff (-a, not a textconv prefix)" "$(q_cmd "git diff --text HEAD")"
expect_allow "Q83b: --text stays a read flag on blame" "$(q_cmd "git blame --text f")"
expect_deny_teach "Q83c: the flag deny names the cat-file replacement" "$(q_cmd "git cat-file --textconv HEAD:x")" "on cat-file use git show <rev>:<path>"
# Accepted residual: `git grep -F -e` cannot search for these flag names. The
# bare spelling trips the flag scan, the quoted one the dash rule. Grep covers it.
expect_deny "Q83d: git grep -F -e --textconv stays denied" "$(q_cmd "git grep -F -e --textconv")"
expect_deny "Q83e: git grep -F -e '--textconv' stays denied" "$(q_cmd "git grep -F -e '--textconv'")"
# The global forms the guard denies by the subcommand default.
for _flagcase in 'git --exec-path' 'git --exec-path=/tmp log' 'git -C /x --exec-path=/y log' 'git -C /x -c a=b log' \
  'git -c a=b log' 'git --config-env=a=b log'; do
  expect_deny "Q84: $_flagcase → denied" "$(q_cmd "$_flagcase")"
done

# Repeated spaces (found in audit round 2). The shell collapses them, so a guard
# that reads a literal `-C <path>` takes the word after a double space for the
# path and the next word for the verb: `git -C  log push` runs push with -C log.
expect_deny "Q85: double space after -C keeps the write verb denied" "$(q_cmd "git -C  log push")"
expect_deny "Q85b: double space after -C keeps fetch denied" "$(q_cmd "git -C  log fetch")"
expect_deny "Q85c: double space after -C keeps global -c denied" "$(q_cmd "git -C  log -c alias.x=x x")"
expect_deny "Q85d: double space after -C with a quoted alias value" "$(q_cmd "git -C  log -c 'alias.x=!id' x")"
expect_deny "Q85e: three spaces after -C" "$(q_cmd "git -C   log push")"
expect_deny "Q85f: double space before the -C path and after it" "$(q_cmd "git -C  /x  push")"
expect_deny "Q85g: double space after a quoted -C path" "$(q_cmd "git -C '/a b'  push")"
expect_deny "Q85h: double space before --output" "$(q_cmd "git log  --output=/tmp/x")"
expect_deny "Q85i: double space around -o" "$(q_cmd "git log  -o  /tmp/x")"
expect_deny "Q85j: double space in a branch write" "$(q_cmd "git branch  -d  x")"
expect_deny_teach "Q85k: -C takes a verb word as its path, so no verb runs" "$(q_cmd "git -C log")" "global -C with no path/subcommand"
expect_deny_teach "Q85l: the same shape with a double space" "$(q_cmd "git -C  cat-file")" "global -C with no path/subcommand"
expect_allow "Q86: a read with a double space stays admitted" "$(q_cmd "git log  --oneline  -1")"
expect_allow "Q86b: a double space inside a quoted value stays data" "$(q_cmd "git log -S'a  b' HEAD")"

# The mask word stays internal: each site that echoes a token prints a placeholder.
expect_deny_lacks "Q87: unlisted-verb deny hides the mask word" "$(q_cmd "git 'push'")" "QUOTEDVALUE"
expect_deny_lacks "Q87b: branch deny hides the mask word" "$(q_cmd "git branch 'a b'")" "QUOTEDVALUE"
expect_deny_lacks "Q87c: grep deny hides the mask word" "$(q_cmd "git grep -F -e t 'a' 'b'")" "QUOTEDVALUE"
expect_deny_teach "Q87d: the placeholder names the quoted value" "$(q_cmd "git 'push'")" "<quoted value>"

# Self-correcting deny text (#1915 direction 1, #2162 option b).
expect_deny_teach "Q89: quoted bare git grep denies at the grep grammar (the #1412 shape)" \
  "$(q_cmd "git grep 'a\\|b'")" "-F (or --fixed-strings) is missing"
expect_deny_teach "Q89b: a refused quote plus a pipe classifies metacharacter" \
  "$(q_cmd "git log --since='a b' | wc -l")" "the metacharacter rule fired"
expect_deny_teach "Q90: metacharacter deny names the quoted form" "$(q_cmd "git log -Ga[b]")" "single-quote the whole value"
expect_deny_teach "Q91: double-quoted expansion deny names single quotes" "$(q_cmd 'git log -S"$x"')" "single-quote the whole value"
expect_deny_teach "Q92: chain deny names git -C for a cd chain" "$(q_cmd "cd /x && git status")" "git -C <path>"
expect_deny_teach "Q93: chain deny names -n for a head pipe" "$(q_cmd "git log | head -5")" "-n <count>"
expect_deny_teach "Q94: non-git grep deny names the Grep tool" "$(q_cmd 'grep -n "a b" f')" "grep: the Grep tool"
expect_deny_teach "Q95: non-git cat deny names Read" "$(q_cmd "cat f")" "cat/sed/head: Read"
expect_deny_teach "Q96: non-git ls deny names Glob" "$(q_cmd "ls /x")" "ls/find: Glob"
expect_deny_teach "Q96b: non-git deny names a tool-result file" "$(q_cmd "wc -l f")" "a tool-result file: Read or Grep"
expect_deny_teach "Q96d: metacharacter deny names the bare dash limit" "$(q_cmd "git log '-p x'")" "a bare value must not start with -"
expect_deny_teach "Q96e: newline deny carries the -n remedy" "$(q_cmd "$(printf 'git log\ngit status')")" "-n <count> on log or show"
expect_deny_teach "Q96c: newline deny carries the same git -C remedy as the chain deny" "$(q_cmd "$(printf 'cd /x\ngit status')")" "git -C <path>"
expect_deny_lacks "Q97: non-git quoted grep is not a metacharacter denial" "$(q_cmd 'grep -n "a b" f')" "the metacharacter rule fired"

# The worked examples on the three contract surfaces run through this guard.
_card="$HERE/../agents/war-auditor.md"; _tmpl="$HERE/../skills/war/assets/workflow-template.js"
for _ex in "git log -S'two words'" "git diff -G'a[b]c'" "git blame -L '/^## re/,+3' <sha> -- <file>" \
  "git log --format='%H %s'" "git show '<sha>:app/[id]/f.tsx'" "git ls-files -- '*.md'" "git grep -F -e 'two words'"; do
  n=$((n + 1))
  if grep -qF -- "$_ex" "$_card" && grep -qF -- "$_ex" "$_tmpl"; then
    printf 'ok %d - Q98 example on card and prompt: %s\n' "$n" "$_ex"
  else
    printf 'FAIL %d - Q98 example missing from card or prompt: %s\n' "$n" "$_ex"; fails=$((fails + 1))
  fi
  _run="${_ex//<sha>/abc123}"; _run="${_run//<file>/f}"
  expect_allow "Q99 example admitted: $_run" "$(q_cmd "$_run")"
done
# The spellings the metacharacter deny text gives as its examples.
for _ex in "-G'a[b]c'" "-S'two words'" "--format='%H %s'" "-L '/re/,+3'" "'sha:app/[id]/f'" "-- '*.md'"; do
  expect_deny_teach "Q99b deny text carries: $_ex" "$(q_cmd "git log -Ga[b]")" "$_ex"
  expect_allow "Q99c deny example admitted: $_ex" "$(q_cmd "git log $_ex")"
done
# One sanity oracle: a real shell passes one quoted value as one argv word.
_args="$(bash -c "printf '%s\n' git log -S'two words'" | wc -l | tr -d ' ')"
n=$((n + 1))
if [ "$_args" = 3 ]; then printf 'ok %d - Q100 oracle: a real shell passes the quoted value as one word\n' "$n"
else printf 'FAIL %d - Q100 oracle: got %s words\n' "$n" "$_args"; fails=$((fails + 1)); fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-auditor-git.test.sh: PASS"
