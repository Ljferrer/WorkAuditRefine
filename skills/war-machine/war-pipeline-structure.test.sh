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
MACHINE_AFK="$ROOT/skills/war-machine/references/afk-conversion.md"
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
CLAUDE_MD="$ROOT/CLAUDE.md"
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

# grep -iF case-INSENSITIVE fixed-string ABSENCE — the -i twin of lacks(); body mirrors lacks()
# exactly except the -i flag (adjudicated 2026-08-05, interview-and-authoring-contract). For
# RETIRED PROSE a benign re-casing must not resurrect unseen — the recorded asymmetry class
# ([[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]]): a case-sensitive absence pin
# silently passes on a re-cased reintroduction. Inherits strip_prose's `## Status`/`## Changelog`
# drop; comment-leader stripping belongs to the hand-run land-time sweep, never this helper.
lacks_i() { # file  literal
  if strip_prose < "$1" | grep -qiF -e "$2"; then
    printf 'not ok - %s UNEXPECTEDLY has :: %s (case-insensitive)\n' "$(basename "$1")" "$2"
    fails=$((fails + 1))
  else
    printf 'ok - %s lacks :: %s (case-insensitive, correct)\n' "$(basename "$1")" "$2"
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
# Predecessor-consistency + skip-and-report were evicted (ADR 0042) to references/afk-conversion.md;
# guards follow their text (ADR 0025), so these two pins read the references file, not SKILL.md.
has "$MACHINE_AFK" 'Predecessor-consistency'
has "$MACHINE_AFK" 'skipped and reported'
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

printf '\n# Class-1 gate evidence (docs/specs/2026-07-16-aftermath-class1-gate-evidence-design.md) — per-ref gate clause, git-cherry row evidence, unset-upstream recovery\n'
# Named, not numbered: the original pipeline spec owns criteria 2/3/4/9/10 and a bare number here
# would collide with its numbering. Four checks, two shapes and two casings:
#
#   * has() for the command/flag literals ('git cherry', '--unset-upstream'). Command and flag
#     tokens are never benignly re-cased, so the case-SENSITIVE form is correct and stricter.
#   * ROW-SCOPED two-stage pipes for the gate cell, the second case-INSENSITIVE because its token
#     is PROSE (the recorded sentence-case class). Stage 1 MUST anchor on the Class-1 table-row
#     literal '| 1. Stray WAR branches |' and NEVER on 'merge-base --is-ancestor': this SKILL uses
#     unwrapped one-line paragraphs, and the acknowledged-stranded bucket's comparator sentence
#     carries BOTH 'merge-base --is-ancestor' AND the per-ref prose anchor on its own line. Keying
#     stage 1 on the is-ancestor token would make the co-location check pass with a byte-unamended
#     gate cell, and leave the keep-green pin unfalsifiable (the comparator line would satisfy it
#     alone) — both proven, 2026-07-16. The row literal is unique to the gate row.
#   * The keep-green pin is DELIBERATELY not red pre-fix. It locks the PRE-EXISTING bar
#     ('git merge-base --is-ancestor') inside the gate CELL against a silent drop by this or any
#     later amendment (ADR 0027 C3 — the deletion gate stays byte-unchanged). Row-scoped for the
#     same reason: a whole-file pin would survive on the comparator line's copy of the token.
#
# Review floor, deliberately NOT mechanized here: `grep -F 'git branch -d' skills/aftermath/SKILL.md`
# is a WHOLE-FILE review floor only. That verb is named in BOTH the Class-1 gate cell (the per-ref
# clause's local-delete parenthetical) AND the recovery subsection, so the grep stays green with the
# entire subsection reverted and can discriminate nothing about it. `has "$AFTERMATH"
# '--unset-upstream'` is the SOLE mechanical pin for that subsection.
has "$AFTERMATH" 'git cherry'
has "$AFTERMATH" '--unset-upstream'
# Keep-green (not red pre-fix): the pre-existing deletion bar still lives IN the Class-1 gate cell.
if grep -F -e '| 1. Stray WAR branches |' -- "$AFTERMATH" | grep -qF -e 'git merge-base --is-ancestor'; then
  printf 'ok - %s :: Class-1 gate cell keeps git merge-base --is-ancestor (row-scoped, keep-green)\n' "$(basename "$AFTERMATH")"
else
  printf 'not ok - %s Class-1 gate cell DROPPED :: git merge-base --is-ancestor (row-scoped)\n' "$(basename "$AFTERMATH")"
  fails=$((fails + 1))
fi
# Red pre-fix: the per-ref rule lives IN the gate cell — not merely somewhere in the file.
if grep -iF -e '| 1. Stray WAR branches |' -- "$AFTERMATH" | grep -qiF -e 'exact ref being removed'; then
  printf 'ok - %s :: Class-1 gate cell carries the per-ref rule (row-scoped, case-insensitive)\n' "$(basename "$AFTERMATH")"
else
  printf 'not ok - %s Class-1 gate cell MISSING :: exact ref being removed (row-scoped, case-insensitive)\n' "$(basename "$AFTERMATH")"
  fails=$((fails + 1))
fi
# Post-delete residual verification (docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md)
# — pins the new '### Class-1 remote deletes — post-batch residual verification' subsection against a
# silent drop, self-describing (criterion-9b precedent: nothing renumbered, the block banner + its four
# assertions above stay byte-untouched). Two mandated has_i() prose pins on mid-sentence anchors unique
# to the subsection (survivors-vs-hold-set diff rule + clean-verdict rule) — sentence-case class, so
# case-insensitive. Plus one has() pin on the restore colon-refspec (a command literal, case-stable).
# All three verified zero-hit in SKILL + test at the 2026-07-22 base; temp-break-proven (revert the
# subsection -> all three red), runs in the commit-body Red-proof: block. `ls-remote` stays banned as an
# anchor (6× in the SKILL — the whole-file-pin-discriminates-nothing class).
has_i "$AFTERMATH" 'hold set must survive'
has_i "$AFTERMATH" 'before declaring the run clean'
has   "$AFTERMATH" ':refs/heads/'

printf '\n# ADR 0030 grep-as-floor — survey-corps Step 4 carries the manual-survey note (second authoring surface)\n'
# ADR 0030 mandates the grep-as-floor doctrine on BOTH authoring surfaces: war-strategy's copy is
# pinned by war-strategy-structure.test.sh; this pins the survey-corps Step 4 copy (previously
# un-pinned — deleting it passed every test; 2026-08-02 minimalism-audit follow-up, PR #1236).
# Named, not numbered: the original pipeline spec owns the numbered criteria. has_i because the
# anchor is PROSE (the recorded sentence-case class); it occurs exactly once in the SKILL, inside
# the Step 4 note, so the whole-file pin discriminates that note alone.
has_i "$SURVEY" 'manual same-scope title/comment survey'

printf '\n# Guard-split deps-edge doctrine (ADR 0025 amendment, 2026-08-02) — both plan-authoring surfaces carry it\n'
# The rule: a drafted task authoring a drift guard over a fact authored by a DIFFERENT task in the
# same phase must carry a `deps` edge onto that task — sharing a wave is not enough, because every
# task worktree is cut from one frozen phase base. It is stated on both authoring paths: the
# /war-machine drafter directive and /war-strategy §3's authoring rule 7 (which /war-machine consumes
# by reference). Guards follow their text (ADR 0025), so these pins land beside the surfaces they pin
# and in the same task as the text. Named, not numbered: the original pipeline spec owns the numbered
# criteria. has_i, never has: both surfaces open the rule with a bold lead-in, so the name token's
# leading capital is heading position alone — PROSE that a benign sentence-case rewrite must not
# false-negate (this file reserves case-sensitive has() for flag/token literals that never re-case).
# The second anchor is genuinely mid-sentence on both surfaces.
for f in "$MACHINE" "$WAR_STRATEGY"; do
  has_i "$f" 'guard-split deps-edge'
  has_i "$f" 'same wave is insufficient'
done
# Count-word flip: /war-strategy §3's rule count went from 2 to 3 when rule 7 landed, and §4's
# gap-review parenthetical counts the same rules. That is a DEFAULT-FLIP, and §3 rule 6 — which lives
# inside the very subsection being edited — requires the gate to assert the OLD value ABSENT: the
# presence pins above cannot, and the only pre-existing guard over that subsection,
# `check '^### Drift-guard coverage'` in war-strategy-structure.test.sh, is a prefix regex matching the
# retired and current count words identically. Each pattern is assembled at runtime from split
# fragments so this file is never itself a hit for a repo-wide sweep of the retired phrases
# ([[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]]).
retired_count_a='two authoring'
retired_count_b='two drift-guard'
lacks "$WAR_STRATEGY" "$retired_count_a rules"
lacks "$WAR_STRATEGY" "$retired_count_b rules"

printf '\n# Authoring contract (docs/plans/2026-08-04-interview-and-authoring-contract.md, Task 3) — machine merged output + grill charter + AFK per-row provenance + survey-corps claim tagging\n'
# Named, not numbered: the original pipeline spec owns the numbered criteria. has_i for PROSE
# anchors (mid-sentence, the sentence-case class); has() only for token literals that never
# re-case (a file name, the D11 tag form). Every pin below was proven red once against a mutated
# copy (directive deleted / retired sentence restored, re-cased) — deliberately-uncommitted
# harness, evidence in the task's done report (End state 2's SOFT half).
#
# Merged-output directive (D11 + D19): conversion emits the merged shape — Part 1 decision
# digest citing the source spec, Part 2 phases; ledger rows carried forward or retired with a
# stated reason, never silently dropped.
has_i "$MACHINE" 'decision digest distilled from the source spec'
has   "$MACHINE" '(verified: issue #N (<date>))'
has_i "$MACHINE" 'or retired with a stated reason'
# Grill charter: the grill agent runs plan-interview.md's falsifier probes + provenance scan
# against the draft; behavioral claims about the repo are proven by sandbox execution, never by
# analysis alone (the doctrine file names /war-machine's grill agent as its consumer).
has   "$MACHINE" 'plan-interview.md'
has_i "$MACHINE" 'falsifier probes'
has_i "$MACHINE" 'provenance scan'
has_i "$MACHINE" 'in a throwaway sandbox'
# Old-absent, ANY casing (End state 4's mirror pin): the training-memory question-tree grill
# sentence stays retired, and the superseded author-the-war-shaped-plan conversion-doctrine
# quote stays gone. Each old-absent pin is paired both-ways with its new-present twin (the
# quoted /war-strategy §4 doctrine now reads "author the merged plan" — pinned below), so
# deleting the quoting paragraph outright cannot leave the gate silently green. Patterns
# assembled at runtime from split fragments so this file is never itself a hit for a repo-wide
# sweep of the retired phrases
# ([[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]]).
retired_grill_a='question'
retired_grill_b='tree'
lacks_i "$MACHINE" "$retired_grill_a $retired_grill_b"
retired_convert_a='author the war-shaped'
retired_convert_b='plan'
lacks_i "$MACHINE" "$retired_convert_a $retired_convert_b"
has_i "$MACHINE" 'author the merged plan'
# lacks_i -i positive control (both-ways, the prose-exclusion self-check precedent above): a
# RE-CASED fixture must FIRE the case-insensitive composition lacks_i wraps (control green),
# while the plain case-sensitive grep -qF must MISS it — pinning the -i as load-bearing rather
# than decorative. Committed because an uncommitted re-cased red-proof is exactly the half that
# rots unseen ([[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]]). Fixture
# assembled from re-cased fragments for the same sweep-hygiene reason as the patterns above.
recased_grill_a='Question'
recased_grill_b='Tree'
recased_fixture="$recased_grill_a $recased_grill_b"
if printf '%s\n' "$recased_fixture" | strip_prose | grep -qiF -e "$retired_grill_a $retired_grill_b"; then
  printf 'ok - lacks_i -i control: re-cased fixture caught case-insensitively (correct)\n'
else
  printf 'not ok - lacks_i -i control: re-cased fixture NOT caught — the -i composition is broken\n'
  fails=$((fails + 1))
fi
if printf '%s\n' "$recased_fixture" | strip_prose | grep -qF -e "$retired_grill_a $retired_grill_b"; then
  printf 'not ok - lacks_i -i control: plain grep -qF matched the re-cased fixture — control proves nothing about -i\n'
  fails=$((fails + 1))
else
  printf 'ok - lacks_i -i control: plain grep -qF misses the re-cased fixture — -i is load-bearing (correct)\n'
fi
# AFK provenance (D14, ADR 0014): beyond the heading variants, every row/tag the unattended
# conversion authors itself carries a per-row `AI-declared` marker. Two pins: the body-sentence
# anchor extended through the marker token (the load-bearing fact — a rewrite that keeps the
# sentence but renames the marker must go red; the token sits on one physical line), plus the
# directive's bold lead-in line, which is the only single-line occurrence of the pluralized
# phrase (the body's copy wraps 'marker' onto the next line, which line-based grep -F cannot
# match — the [[misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep]] shape).
has_i "$MACHINE_AFK" 'carries a per-row `AI-declared`'
has_i "$MACHINE_AFK" 'per-row `AI-declared` markers'
# Survey-corps claim tagging (End state 10; ADR 0025 guard-split — this pin's fact is authored
# by the survey-corps task, deps-edged onto it): the spec-synthesis step tags every synthesized
# claim per D4/D11.
has_i "$SURVEY" 'tag every synthesized claim'
has   "$SURVEY" '(verified: issue #N (<date>))'

printf '\n# Gospel pins (docs/plans/2026-08-04-interview-and-authoring-contract.md, Task 8; End state 5) — committed both-ways sweep of the five doc surfaces\n'
# Named, not numbered: the original pipeline spec owns the numbered criteria. Adjudicated
# 2026-08-05 (ADR 0017 — the five-surface gospel sweep may not ride a hand-run grep alone):
# every Task-6 retired anchor is pinned OLD-ABSENT via lacks_i() on ALL FIVE End-state-5
# surfaces — README, CLAUDE.md, war-help, CONTEXT.md, war-strategy — and each surface THIS
# suite owns carries a NEW-present twin (war-strategy's both-ways enforcement — its own
# retired-wording set and the merged-template heading — lives in
# war-strategy-structure.test.sh, Task 1). Case-insensitive in BOTH directions: a benign
# re-casing must neither resurrect retired prose unseen
# ([[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]]) nor false-negate a presence pin
# (the sentence-case class). lacks_i() inherits strip_prose, so Task 10's README `## Status`
# blurb describing this very doctrine change can never re-trip the guard
# ([[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]]); comment-leader
# stripping belongs to End state 5's hand-run land-time sweep, not these pins. war-help
# carried nothing to retire (Task 6), so its old-absent pins are keep-green by construction —
# reintroduction guards only. Pin scope is EXACTLY these five doc surfaces: the suite never
# greps its own source, docs/plans/, docs/red-team/, or docs/adr/, which legitimately quote
# the anchors. Patterns assembled at runtime from split fragments so this file is never
# itself a hit for a repo-wide sweep of the retired phrases
# ([[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]]). Deliberate
# NON-anchor per Task 6's table: the spec-stays-non-executable clause (fragments: 'cannot
# execute' + ' one') stays TRUE of input-shape specs — never add it here blindly.
gospel01='spec is not';         gospel01="$gospel01 a plan"
gospel02='spec ≠';              gospel02="$gospel02 plan"
gospel03='required auxiliary';  gospel03="$gospel03 plugin"
gospel04='required-auxiliary';  gospel04="$gospel04-plugin"
gospel05='grill-with-docs` ';   gospel05="${gospel05}authors"
gospel06='never';               gospel06="$gospel06 authors"
gospel07='authored by';         gospel07="$gospel07 interview"
gospel08='converts spec';       gospel08="$gospel08 → plan"
gospel09='convert a spec';      gospel09="$gospel09 into a plan"
gospel10="why it's";            gospel10="$gospel10 required"
gospel11="why war doesn't";     gospel11="$gospel11 ship its own"
gospel12='interview a spec';    gospel12="$gospel12 into a plan"
gospel13='author the';          gospel13="$gospel13 input plan"
gospel14='without a';           gospel14="$gospel14 ratified spec"
gospel15='routes you to your';  gospel15="$gospel15 installed grilling skill"
gospel16='nothing else is';     gospel16="$gospel16 required"
for f in "$README" "$CLAUDE_MD" "$WAR_HELP" "$CONTEXT" "$WAR_STRATEGY"; do
  lacks_i "$f" "$gospel01"
  lacks_i "$f" "$gospel02"
  lacks_i "$f" "$gospel03"
  lacks_i "$f" "$gospel04"
  lacks_i "$f" "$gospel05"
  lacks_i "$f" "$gospel06"
  lacks_i "$f" "$gospel07"
  lacks_i "$f" "$gospel08"
  lacks_i "$f" "$gospel09"
  lacks_i "$f" "$gospel10"
  lacks_i "$f" "$gospel11"
  lacks_i "$f" "$gospel12"
  lacks_i "$f" "$gospel13"
  lacks_i "$f" "$gospel14"
  lacks_i "$f" "$gospel15"
  lacks_i "$f" "$gospel16"
done
# NEW-present twins, one per suite-owned surface (Task 6's table names each anchor; war-help's
# is the rewritten `/war-strategy` command-table row — the doctrinal row Task 6 updated):
has_i "$README"    'recommended auxiliary plugin'
has_i "$CLAUDE_MD" 'one interview, one merged artifact'
has_i "$WAR_HELP"  'one merged plan, decision record + phases in a single artifact'
has_i "$CONTEXT"   'input shape'

printf '\n== war-pipeline-structure: %s failure(s) ==\n' "$fails"
exit $fails
