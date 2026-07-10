#!/usr/bin/env bash
# gh-preflight.sh — WAR gh-account preflight (spec §1, ADR 0026).
#
# Asserts that the active `gh` account equals the run's expected account
# (the Lead passes `overrides.ghUser`) BEFORE every gh write batch, so an
# account flip on a multi-account machine can never silently drop an issue
# file / label edit / close / PR against the wrong identity.
#
# Usage: gh-preflight.sh <expected-account>
#   <expected-account>  the login the run must write as (overrides.ghUser).
#                       Empty-string arg ("") ⇒ NO-OP: exit 0 immediately, gh
#                       never invoked (C1 — the knob ships null, so an
#                       unconfigured run pays nothing and leaks no personal
#                       handle). Zero args (omitted entirely) is a usage error
#                       ⇒ exit 2; callers must pass a QUOTED possibly-empty arg.
#
# Active-account read is via `gh api user --jq .login` — AUTHORITATIVE, not the
# version-fragile `gh auth status` "Active account" text parse. A read that
# fails or comes back empty is a TOOLING error (exit 2), never a silent 0
# (spec §8): we must never conclude "account matches" from an unreadable state.
#
# On drift: `gh auth switch --hostname github.com --user <expected>`, then
# re-verify via `gh api user --jq .login`. Verified ⇒ 0. Still mismatched ⇒
# FAIL LOUD (exit 3) printing BOTH the wanted and the actual login.
#
# Exit codes (load-bearing contract; mirrors the assert-*.sh floor family):
#   0 — verified: no-op (empty arg), already-active match, or switched+verified
#   2 — tooling error: gh read/switch failed or returned empty (NOT a mismatch
#       verdict; caller must not treat as "account is fine")
#   3 — unrecoverable mismatch: switch did not take; active login != expected
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# cwd-independent; `die` idiom of the floor family (validate-auditor-git.sh /
# assert-no-submodule-mutation.sh).
set -euo pipefail

PROG="gh-preflight"
die() { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# ---------------------------------------------------------------------------
# Argument parsing.
# ---------------------------------------------------------------------------
[ $# -ge 1 ] || die "usage: $PROG <expected-account>" 2
expected="$1"

# No-op path (C1): empty/unset expected account ⇒ exit 0 without touching gh.
[ -n "$expected" ] || exit 0

# active_login: echo the authoritative active gh login, or exit 2 on any
# read failure / empty response (never a silent match).
active_login() {
  _login="$(gh api user --jq .login 2>/dev/null)" \
    || die "gh api user failed — cannot read active gh account (network/auth?)" 2
  [ -n "$_login" ] \
    || die "gh api user returned an empty login — cannot verify active account" 2
  printf '%s' "$_login"
}

# ---------------------------------------------------------------------------
# Read the active account; short-circuit on an already-correct match.
# ---------------------------------------------------------------------------
actual="$(active_login)"
[ "$actual" = "$expected" ] && exit 0

# ---------------------------------------------------------------------------
# Drift: switch to the expected account, then RE-VERIFY (never trust the
# switch's own exit — the login is what matters).
# ---------------------------------------------------------------------------
gh auth switch --hostname github.com --user "$expected" 2>/dev/null \
  || die "gh auth switch to '$expected' failed" 2

actual="$(active_login)"
[ "$actual" = "$expected" ] && exit 0

die "gh account mismatch: wanted '$expected' but active login is '$actual' after switch" 3
