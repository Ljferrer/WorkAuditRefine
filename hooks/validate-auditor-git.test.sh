#!/usr/bin/env bash
# Tests for the WAR auditor read-only-git Bash guard (F03 confinement).
# hooks/validate-auditor-git.sh
#
# This guard is FAIL-CLOSED: for agent_type suffix-anchored to war-auditor
# (case pattern `*war-auditor`), it allows
# ONLY a single git read-subcommand (diff/log/show/merge-base/rev-parse/status/
# ls-files/cat-file/blame) with no shell metacharacters. Anything else → DENY
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
# the global-flag block above (lines 94-110) because $rest starts with "diff".
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

# G6: git grep — NOT in the read allowlist and stays denied. The committed-grounding clause
# (spec §8 / ADR 0029) deliberately does NOT widen the allowlist to add a grep verb: blob
# reads go through `git show`, history through `git log -S/-G`. This case is the mechanical
# record of that non-widening — flipping it to expect_allow would signal a widened allowlist.
expect_deny "G6: git grep token → denied (grep verb NOT admitted; allowlist unwidened)" \
  "$(auditor_cmd "git grep token")"

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
# emit INVALID JSON, the guard's jq read of .agent_type returns empty, the
# non-auditor `*) exit 0` pass-through fires, and the deny is VACUOUS
# (memory printf-json-escaping-vacuous-test-case).
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
# The "Only gate war-auditor agents" arm is suffix-anchored (`*war-auditor`),
# capturing the dispatched `work-audit-refine:war-auditor` but NOT a longer
# `...war-auditor-helper` decoration. I1/I2 are a delete-the-feature pair:
# revert the anchor to a substring arm and I1 flips to deny (over-capture)
# while I2 stays deny — so I1 is the case that proves the narrowing.
# ---------------------------------------------------------------------------

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
# Summary
# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-auditor-git.test.sh: PASS"
