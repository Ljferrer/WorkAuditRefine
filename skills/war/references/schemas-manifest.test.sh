#!/usr/bin/env bash
# Doc-scan test for the .war-provision.json manifest contract in schemas.md.
# Asserts:
#   (A) the deferred-to-#51 note is GONE
#   (B) the "not yet emitted by any scout tier" wording is GONE
#   (C) a manifest-contract block naming .war-provision.json is present
#   (D) source: "manifest" is documented
#   (E) authority phrasing "above CI" and "below explicit" are present
#
# Anchored on unique phrases (prune-assertion-substring-token-drift memory):
#   full distinctive phrases, not bare tokens.
#
# Exit 0 = all checks pass; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCHEMA="$HERE/schemas.md"

fails=0
n=0

check_absent() {
  n=$((n + 1))
  if grep -qF "$2" "$SCHEMA" 2>/dev/null; then
    printf 'FAIL %d - %s (phrase still present: [%s])\n' "$n" "$1" "$2"
    fails=$((fails + 1))
  else
    printf 'ok %d - %s (phrase absent)\n' "$n" "$1"
  fi
}

check_present() {
  n=$((n + 1))
  if grep -qF "$2" "$SCHEMA" 2>/dev/null; then
    printf 'ok %d - %s\n' "$n" "$1"
  else
    printf 'FAIL %d - %s (phrase not found: [%s])\n' "$n" "$1" "$2"
    fails=$((fails + 1))
  fi
}

# (A) deferred note must be gone
check_absent 'deferred-to-#51 note removed' 'deferred to [issue #51]'

# (B) "not yet emitted by any scout tier" must be gone
check_absent '"not yet emitted" note removed' 'not yet emitted by any scout tier'

# (C) manifest-contract subsection present with unique anchor
check_present 'manifest-contract subsection heading present' '### Provisioning manifest (.war-provision.json)'

# (D) source: "manifest" documented (full distinctive phrase)
check_present 'source: "manifest" documented' 'source: "manifest"'

# (E) authority phrasing: "above CI" present
check_present 'authority tier phrasing "above CI" present' 'above CI'

# (E2) authority phrasing: "below explicit" present (full phrase)
check_present 'authority tier phrasing "below explicit" present' 'below explicit'

# (F) .war-provision.json schema shape documented
check_present 'provision array schema documented' '"provision": string[]'

# (G) source assigned-not-declared rule documented (unique full phrase)
check_present 'source assigned-not-declared rule documented' 'source assigned-not-declared'

# (H) fail-loud contract documented (unique full phrase)
check_present 'fail-loud contract documented' 'fail-loud-on-broken'

# (I) manifest enum member now in the scout-emitted source enum line
check_present '"manifest" in scout-emitted source enum' '"manifest" | "ci"'

if [ "$fails" -gt 0 ]; then
  printf '\n%d of %d checks FAILED\n' "$fails" "$n"
  exit 1
else
  printf '\nAll %d checks passed\n' "$n"
fi
