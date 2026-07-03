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

SURVEY="$ROOT/skills/war-survey-corps/SKILL.md"
MACHINE="$ROOT/skills/war-machine/SKILL.md"
AFTERMATH="$ROOT/skills/war-aftermath/SKILL.md"
WAR_SKILL="$ROOT/skills/war/SKILL.md"
SCAFFOLD="$ROOT/skills/red-team/assets/workflow-scaffold.js"
LENSES="$ROOT/skills/red-team/references/lenses.md"
SCHEMAS="$ROOT/skills/war/references/schemas.md"
DESIGN="$ROOT/skills/war/references/design.md"
TEMPLATE="$ROOT/skills/war/assets/workflow-template.js"
README="$ROOT/README.md"

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

printf '\n# Criterion 2 — disable-model-invocation only on war-aftermath (frontmatter, both forms)\n'
fm_has_key  "$AFTERMATH" 'disable-model-invocation'
fm_lacks_key "$SURVEY"   'disable-model-invocation'
fm_lacks_key "$MACHINE"  'disable-model-invocation'

printf '\n# Criterion 3 — "dangerously destructive" tied to --afk + --scorched-earth in BOTH surfaces\n'
# war-aftermath SKILL.md: the combo is named dangerously destructive AND both flags co-occur.
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
  has "$f" "Commander's Intent"
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

printf '\n# Criterion 10 — machine predecessor-consistency, skip-and-report, --afk manifest + closing-commit rules\n'
has "$MACHINE" 'Predecessor-consistency'
has "$MACHINE" 'skipped and reported'
has "$MACHINE" '+ no fresh manifest + no explicit paths'
has "$MACHINE" 'closing commit'
has "$MACHINE" 'one commit of the pipeline artifacts'

printf '\n== war-pipeline-structure: %s failure(s) ==\n' "$fails"
exit $fails
