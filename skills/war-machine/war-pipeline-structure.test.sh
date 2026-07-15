#!/usr/bin/env bash
# Structure test for the WAR pipeline skills trio (spec §10 criteria 2, 3, 4, 9, 10).
# Pins the greppable tokens the three new skills + every amended doctrine surface must carry,
# so a future edit can't silently drop the pipeline contract. grep-based, plain-bash, no mktemp
# — bash 3.2-safe. Exit 0 = all present; exit N = N failed assertions.
#
# Repo *.test.sh convention: self-discovered by the gate's `find … -name '*.test.sh'` sweep
# (no gate edits). Lives beside war-machine (the pipeline's hub — criteria 9 & 10 both concern it).
#
# Temp-break proof (per [[weak-test-assertion-passes-without-feature-being-exercised]]): every
# assertion below was shown to FAIL against a reverted surface before this file was committed —
# see the worker result notes. Anchors are construct/token names, not line numbers (which drift,
# [[plan-line-number-refs-stale-use-construct-locator]]).
set -u

# Repo root = two levels up from skills/war-machine/ .
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

SURVEY="$ROOT/skills/survey-corps/SKILL.md"
MACHINE="$ROOT/skills/war-machine/SKILL.md"
AFTERMATH="$ROOT/skills/aftermath/SKILL.md"
WAR_SKILL="$ROOT/skills/war/SKILL.md"
SCAFFOLD="$ROOT/skills/red-team/assets/workflow-scaffold.js"
LENSES="$ROOT/skills/red-team/references/lenses.md"
SCHEMAS="$ROOT/skills/war/references/schemas.md"
DESIGN="$ROOT/skills/war/references/design.md"
TEMPLATE="$ROOT/skills/war/assets/workflow-template.js"
README="$ROOT/README.md"
PLUGIN="$ROOT/.claude-plugin/plugin.json"
CONTEXT="$ROOT/CONTEXT.md"
WAR_HELP="$ROOT/skills/war-help/SKILL.md"
WAR_STRATEGY="$ROOT/skills/war-strategy/SKILL.md"
WAR_CAMPAIGN="$ROOT/skills/war-campaign/SKILL.md"

fails=0

# grep -F fixed-string presence in a file. `--` terminates option parsing so tokens that
# start with `-` (e.g. `--scorched-earth`) are treated as the pattern, not a grep flag.
has() { # file  literal
  if grep -qF -e "$2" -- "$1"; then
    printf 'ok - %s :: %s\n' "$(basename "$1")" "$2"
  else
    printf 'not ok - %s MISSING :: %s\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  fi
}

# grep -iF case-INSENSITIVE fixed-string presence. For PROSE tokens that a benign
# re-casing (sentence case) must not false-negate — the recorded sentence-case class
# ([[prompt-only-clause-grep-guard-must-tolerate-sentence-case]]). Flag/token literals
# that never re-case (e.g. `--git-common-dir`) stay case-sensitive via has().
has_i() { # file  literal
  if grep -qiF -e "$2" -- "$1"; then
    printf 'ok - %s :: %s (case-insensitive)\n' "$(basename "$1")" "$2"
  else
    printf 'not ok - %s MISSING :: %s (case-insensitive)\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  fi
}

# Strip release/changelog PROSE regions (reads stdin -> stdout) so a release blurb or changelog
# entry that *names* a renamed-away token can't re-trip the absence guard
# ([[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]], rename/p2-release):
# drop the README `## Status` section and any `## Changelog` section — from the heading through
# the next heading (a line starting with `#`) or EOF. A *structural* reintroduction (a skill dir
# path, frontmatter `name:`, or slash-command token) lives OUTSIDE these prose sections and still
# trips the scan. bash-3.2 awk-safe: no interval expressions ({n,m}); `##*` = one-or-more `#`.
strip_prose() {
  awk '
    /^##* *Status/       { inp = 1; next }
    /^##* *[Cc]hangelog/ { inp = 1; next }
    inp && /^#/          { inp = 0 }
    inp                  { next }
    { print }
  '
}

# grep -F fixed-string ABSENCE in a file (inverse of has()), scanning the file with release/
# changelog prose stripped (strip_prose) so a blurb describing the rename never re-trips it. Used
# by the rename criterion to prove old skill-name tokens are gone from an EXPLICITLY ENUMERATED
# file list — never a repo-root recursive grep ([[absence-guard-search-root-must-anchor-to-subtree]]).
# This test file is deliberately NOT in that list: its own assertion args legitimately name the
# old tokens.
lacks() { # file  literal
  if strip_prose < "$1" | grep -qF -e "$2"; then
    printf 'not ok - %s UNEXPECTEDLY has :: %s\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  else
    printf 'ok - %s lacks :: %s (correct)\n' "$(basename "$1")" "$2"
  fi
}

# grep -E regex presence in a file.
has_re() { # file  regex
  if grep -qE -e "$2" -- "$1"; then
    printf 'ok - %s :: /%s/\n' "$(basename "$1")" "$2"
  else
    printf 'not ok - %s MISSING :: /%s/\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  fi
}

# Emit the frontmatter block (between the first pair of --- fences) of a SKILL.md.
frontmatter() { # file
  awk 'NR==1 && $0=="---"{inb=1;next} inb && $0=="---"{exit} inb{print}' "$1"
}

# Assert a frontmatter KEY is present in the file's frontmatter block.
fm_has_key() { # file  key
  if frontmatter "$1" | grep -qE "^$2[[:space:]]*:"; then
    printf 'ok - %s frontmatter has %s\n' "$(basename "$1")" "$2"
  else
    printf 'not ok - %s frontmatter MISSING key %s\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  fi
}

# Assert a frontmatter KEY is ABSENT from the file's frontmatter block. Catches BOTH the
# single-line `key: value` form AND a YAML-block form where the key sits on its own line with
# the value below ([[frontmatter-tools-negation-check-single-line-only]]) — we match the key at
# line start regardless of what follows the colon.
fm_lacks_key() { # file  key
  if frontmatter "$1" | grep -qE "^$2[[:space:]]*:"; then
    printf 'not ok - %s frontmatter UNEXPECTEDLY has key %s\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  else
    printf 'ok - %s frontmatter lacks %s (correct)\n' "$(basename "$1")" "$2"
  fi
}

printf '\n# Criterion 2 — disable-model-invocation only on aftermath (frontmatter, both forms)\n'
fm_has_key  "$AFTERMATH" 'disable-model-invocation'
fm_lacks_key "$SURVEY"   'disable-model-invocation'
fm_lacks_key "$MACHINE"  'disable-model-invocation'

printf '\n# Criterion 3 — "dangerously destructive" tied to --afk + --scorched-earth in BOTH surfaces\n'
# aftermath SKILL.md: the combo is named dangerously destructive AND both flags co-occur.
has "$AFTERMATH" 'dangerously destructive'
has "$AFTERMATH" '--afk --scorched-earth'
# README: same combo + phrase (criterion 3's README half).
has "$README" 'dangerously destructive'
has "$README" '--afk --scorched-earth'

printf '\n# Criterion 4 — all five heading surfaces name BOTH intent headings\n'
# Each surface must reference the AI-Commander's Intent heading (the amendment) AND the base
# Commander's Intent heading — both present proves the "either heading" contract on that surface.
for f in "$WAR_SKILL" "$LENSES" "$SCHEMAS" "$DESIGN"; do
  has "$f" "AI-Commander's Intent"
  has "$f" "## Commander's Intent"
done
# workflow-scaffold.js: BOTH branches of the intent-vs-plan probe must name both headings. The
# positive branch fires on "either", the negative fires only on "NEITHER" — assert both tokens.
has "$SCAFFOLD" "AI-Commander's Intent"
has "$SCAFFOLD" 'either a "## Commander'\''s Intent" or an "## AI-Commander'\''s Intent"'
has "$SCAFFOLD" 'NEITHER a "## Commander'\''s Intent" nor an "## AI-Commander'\''s Intent"'
# workflow-template.js: comments name both headings and no longer assert the single-heading
# contract. Presence of the AI heading in the comment proves the old single-heading assertion
# was amended (the comment consumes args.intent; no functional change).
has "$TEMPLATE" "AI-Commander's Intent"

printf '\n# Criterion 9 — survey + machine state the manifest path AND the --git-common-dir anchor\n'
for f in "$SURVEY" "$MACHINE"; do
  has "$f" '.claude/aot/YYYY-MM-DD-survey.json'
  has "$f" '--git-common-dir'
  has "$f" 'main checkout'
done
# Machine additionally states selection precedence + consumed-stamp semantics.
has_re "$MACHINE" 'Input selection precedence'
has "$MACHINE" 'consumed: null'
has_re "$MACHINE" 'consumed-stamp semantics'

printf '\n# Criterion 9b — war-campaign SKILL anchors campaign state at the main checkout (same --git-common-dir idiom)\n'
# The flag literal is case-STABLE (a flag is never re-cased) -> exact has(). The prose rule
# "main checkout" is case-INSENSITIVE via has_i(): a benign sentence-case re-casing of the
# SKILL prose must not false-negate the drift guard (red-team fix 2026-07-16, the sentence-case
# false-negative class). The adjacent Criterion 9 survey+machine "main checkout" assertions above
# still use the case-sensitive has() and inherit that fragility — out of this plan's footprint,
# noted for a follow-up, not fixed here.
has   "$WAR_CAMPAIGN" '--git-common-dir'
has_i "$WAR_CAMPAIGN" 'main checkout'

printf '\n# Criterion 10 — machine predecessor-consistency, skip-and-report, --afk manifest + closing-commit rules\n'
has "$MACHINE" 'Predecessor-consistency'
has "$MACHINE" 'skipped and reported'
has "$MACHINE" '+ no fresh manifest + no explicit paths'
has "$MACHINE" 'closing commit'
has "$MACHINE" 'one commit of the pipeline artifacts'

printf '\n# Ledger-ingestion contract — machine §3 mandates plan-index-table-first (campaign-ledger reads only the first table)\n'
has "$MACHINE" 'plan-index table MUST be the first table in the document'

printf '\n# Rename — pipeline-edge skills are /survey-corps and /aftermath (paired presence + absence)\n'
# Presence: the new names live where they must. Frontmatter name: on both renamed skills;
# plugin.json skills array carries the new dir paths; README carries both command tokens;
# war-help carries both renamed README anchors.
has "$SURVEY"   'name: survey-corps'
has "$AFTERMATH" 'name: aftermath'
has "$PLUGIN"   './skills/survey-corps'
has "$PLUGIN"   './skills/aftermath'
has "$README"   '`/survey-corps`'
has "$README"   '`/aftermath`'
has "$WAR_HELP" 'turn-issues-into-specs-survey-corps'
has "$WAR_HELP" 'clean-up-aftermath'
# Absence: the OLD tokens are gone from an EXPLICITLY ENUMERATED live-surface list (never a
# repo-root recursive grep — [[absence-guard-search-root-must-anchor-to-subtree]]). This test
# file is intentionally excluded: its own assertion args above legitimately carry the old names.
# lacks() scans each file with strip_prose applied, so a README `## Status`/`## Changelog` blurb
# that *describes* the rename can't re-trip the guard (see prose-exclusion self-check below).
for f in "$README" "$CONTEXT" "$PLUGIN" "$SURVEY" "$AFTERMATH" "$WAR_HELP" "$MACHINE" "$WAR_STRATEGY"; do
  lacks "$f" 'war-survey-corps'
  lacks "$f" 'war-aftermath'
done

printf '\n# Rename prose-exclusion — a release/changelog blurb NAMING a renamed-away token must NOT trip the guard; a STRUCTURAL reintroduction still must (end state 5)\n'
# [[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]] — delete strip_prose's
# Status/Changelog stripping and the first assertion below flips to a failure.
prose_fixture='## Status

**0.14.99** — renamed war-survey-corps to survey-corps and war-aftermath to aftermath.

## Changelog

- war-survey-corps -> survey-corps (skill rename)

## Real content

name: survey-corps'
if printf '%s\n' "$prose_fixture" | strip_prose | grep -qF -e 'war-survey-corps'; then
  printf 'not ok - PROSE mention of war-survey-corps in ## Status/## Changelog tripped the guard\n'
  fails=$((fails + 1))
else
  printf 'ok - PROSE mention of war-survey-corps in ## Status/## Changelog is ignored (correct)\n'
fi

struct_fixture='## Status

**0.14.99** — routine bump.

## Real content

./skills/war-survey-corps'
if printf '%s\n' "$struct_fixture" | strip_prose | grep -qF -e 'war-survey-corps'; then
  printf 'ok - STRUCTURAL war-survey-corps reintroduction outside prose still caught (correct)\n'
else
  printf 'not ok - STRUCTURAL war-survey-corps reintroduction was swallowed by strip_prose\n'
  fails=$((fails + 1))
fi

printf '\n== war-pipeline-structure: %s failure(s) ==\n' "$fails"
exit $fails
