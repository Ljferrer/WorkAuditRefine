#!/usr/bin/env bash
# Structure test for skills/war-strategy/SKILL.md + references/plan-interview.md: locks all
# five sections, the three inline templates (merged plan / spec input shape / roadmap), the
# merged-template internals ratified by the 2026-08-04 interview-and-authoring-contract plan
# (Task 1), the interview doctrine's ratified internals, the doctrine's Evidence + slot law
# section (presence pin + the five-atom mirror-equality block, #1307: the D4 / D5 / tag-set /
# D12 / D14 law atoms extracted from both surfaces, whitespace-normalized, non-empty-asserted
# per surface, then compared against the canonical SKILL.md §2 bytes — tag-set by keyword
# sequence, D14 by marker presence), the four both-ways
# lacks_i positive controls (#1308: each retired-wording absence pattern proven ALIVE against
# an independent re-cased fixture, and its -i proven load-bearing), and — case-insensitive —
# the ABSENCE of the retired two-template/required-Grill-Me wording. grep is fence-blind, so
# template-internal headings are checked as verbatim full lines: an arrow annotation /
# leading spaces make an annotated line unique to its fence; bare headings shared across the
# template + example fences are pinned by exact-line occurrence COUNT (check_n), and
# example-fence-only headings by exact-whole-line match (check_x — a backticked prose mention
# of the same bytes never satisfies it). Plain-bash, no mktemp — bash 3.2-safe.
# Exit 0 = all green; else non-zero.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SKILL="$HERE/SKILL.md"
DOCTRINE="$HERE/references/plan-interview.md"

fails=0
# All helpers pass the pattern via `-e` + `--` so anchors that START with `-` (the separate
# `- ` field bullets are exactly that shape) are never parsed as grep options.
check() { # regex (vs SKILL.md)
  if grep -q -e "$1" -- "$SKILL"; then
    printf 'ok - %s\n' "$1"
  else
    printf 'not ok - missing: %s\n' "$1"
    fails=$((fails + 1))
  fi
}
check_f() { # fixed string (vs SKILL.md) — verbatim line fragments, incl. leading spaces
  if grep -qF -e "$1" -- "$SKILL"; then
    printf 'ok - %s\n' "$1"
  else
    printf 'not ok - missing: %s\n' "$1"
    fails=$((fails + 1))
  fi
}
check_x() { # fixed string, EXACT whole line (vs SKILL.md) — matches a fence heading line but
  # never a backticked prose mention of the same bytes embedded in a longer line
  if grep -qxF -e "$1" -- "$SKILL"; then
    printf 'ok - exact line: %s\n' "$1"
  else
    printf 'not ok - missing exact line: %s\n' "$1"
    fails=$((fails + 1))
  fi
}
check_n() { # fixed string, EXACT whole line + required occurrence count (vs SKILL.md) — for
  # bare headings shared across fences: deleting any one occurrence breaks the count
  n="$(grep -cxF -e "$1" -- "$SKILL")"
  if [ "$n" -eq "$2" ]; then
    printf 'ok - %s exact-line occurrences: %s\n' "$2" "$1"
  else
    printf 'not ok - expected %s exact-line occurrences, found %s: %s\n' "$2" "$n" "$1"
    fails=$((fails + 1))
  fi
}
doc_f() { # fixed string (vs references/plan-interview.md)
  if grep -qF -e "$1" -- "$DOCTRINE"; then
    printf 'ok - doctrine :: %s\n' "$1"
  else
    printf 'not ok - doctrine missing: %s\n' "$1"
    fails=$((fails + 1))
  fi
}
# Case-INSENSITIVE fixed-string ABSENCE in SKILL.md — the retired-wording guard. Insensitive
# because a benign re-case of retired prose must not slip past a case-sensitive absence arm
# (the recorded lacks()-vs-has_i() asymmetry class). Patterns are assembled at the call site
# from split fragments so this file is never itself a hit for a repo-wide sweep of the
# retired phrases ([[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]]).
lacks_i() { # fixed string (vs SKILL.md)
  if grep -qiF -e "$1" -- "$SKILL"; then
    printf 'not ok - SKILL.md UNEXPECTEDLY has :: %s (case-insensitive)\n' "$1"
    fails=$((fails + 1))
  else
    printf 'ok - SKILL.md lacks :: %s (correct, case-insensitive)\n' "$1"
  fi
}

# All five SKILL.md sections
check '^## 1. Recommended front door'
check '^## 2. The three templates'
check '^## 3. The code-boundary decomposition rule'
check '^## 4. Interview, handoff & convert'
check '^## 5. Closing offer'

# The three inline templates (merged plan primary; spec relabeled input shape — D17)
check '^### Merged plan template'
check '^### Spec template — the input shape'
check '^### Roadmap template'

# Self-sufficient entry doctrine (D2) — each of the three out-of-section carriers pinned
# new-present (frontmatter description · top-of-file bare-invoke bullet · pre-§1
# Self-sufficient-entry sentence) + §1 recommendation wording
check_f 'runs the WAR plan-authoring interview itself'
check_f '**Bare invoke — run the interview**'
check_f 'Self-sufficient entry:'
check_f 'a recommended front door, never a requirement'

# Merged template — Part 1 section set (fence-safe: verbatim lines; annotations make each
# unique to the merged-template fence where they carry one; the bare headings recur verbatim
# in both example fences, so each is pinned by exact-line count — template + 2 examples = 3
# — and deleting any one occurrence goes red)
check_f '## Context — the gap / problem            ← Part 1'
check_n '## Pivotal constraints' 3
check_f '## Resolved design tree                   ← table: decision → resolution → source'
check_f '## Assumptions ledger                     ← required; assumption · basis · blast radius · check   (or exactly: None)'
check_n '## Non-goals / deferred' 3
check_n '## New domain terms · Recommended ADRs' 3

# Template-internal Commander's Intent block (fence-safe: verbatim lines) + the D5 closed
# tag set on the End-state slot (the D18 unified validation criteria)
check_f "## Commander's Intent              ← operator-authored; intent ceiling, plan floor"
check_f '  - Purpose: <why'
check_f '  - Method: <how'
check_f '  - End state: <numbered list'
check_f 'HARD at audit_sha (observable + judge seat)'

# Per-task field bullets — the SEPARATE `- ` bullet law (ratified template law AND an
# extraction requirement: extractFiles ingests ONLY the separate-bullet form) + the Done-when
# slot and its D5 law.
check_f 'every path backticked & comma-separated; the campaign ledger'
check_f '- Done when: <command>   ← required iff requiresTest: true'
check_f '- requiresPackaging: true|false  ← default true'
check_f 'Per-task fields are SEPARATE'
check_f 'ingests ONLY the separate-bullet form'
check_f 'unparseable footprint'
check_f 'silently replaces'
check_f 'is required iff `requiresTest: true`'
# Template-law item 4 (D4/D5): the End-state tag law + the Part-1 evidence-tag law
check_f 'Every End state carries one tag'
check_f 'carries an evidence tag'

# The Part-2 tail: TWO separate H2s (adjudicated 2026-08-05, Q2) — template lines + the law
check_f '## Notes / conscious deviations   (ratify in /red-team)'
check_f '## Open decisions                 (resolved by /red-team)'
check_f 'The tail stays TWO separate H2s'

# Required-section vehicle (ADR 0017): backstops line + explicit-None law
check_f '## Deferred validations (backstops)   ← required; ratify in /red-team; surfaced at every land'
check_f 'a literal `None` is a valid, complete declaration'

# The TWO example docs (End state 7) — operator-form and AFK-form heading pairs (ADR 0014
# either/or alternatives, one per doc). The AFK pair is exact-whole-line: each heading also
# appears backticked inside prose, which a substring check_f would match — check_x binds
# only Example B's fence heading lines.
check_f '### Example A — operator-form (merged plan)'
check_f '### Example B — AFK-form (merged plan)'
check_x "## AI-Commander's Intent"
check_x '## Deferred validations (backstops — AI-declared)'

# Spec template input-shape duties: D4 tag annotation + the §10 check form
check_f '## 1. Context — the gap / problem     ← every claim of fact tagged (evidence tags, D4)'
check_f 'WHEN <trigger> THE <subject> SHALL <result>'

# "Reference the live artifact, never a stack-fragile literal" convention block (§2) —
# pin the heading plus each of the named rules + the defined-but-not-yet-emitted
# annotation by a distinctive teeth phrase, so a future edit can't silently drop one.
# Fixed-string, anchored inside the line (no quote-marks/bold crossing the anchor).
check '^### Reference the live artifact, never a stack-fragile literal'
check_f 'name the enclosing symbol or comment header'        # construct locator
check_f 'reference the self-discovery gate'                   # self-discovery gate (resolveGate)
check_f 'append to the canonical export in'                  # canonical export mirror
check_f 'use the dotted path'                                # dotted path for nested keys
check_f 'next free patch above the live base'               # release-task next-free-patch
check_f 'defined-but-not-yet-emitted; produced in Task N'    # cross-slice annotation
check_f 'requires a manual same-scope title/comment survey'  # grep-as-floor
check_f 'The advisory `plan-literal-lint.mjs` (`skills/war-strategy/assets/`)'   # §2 convention block
check_f 'run `node skills/war-strategy/assets/plan-literal-lint.mjs <plan>`'     # §4 lint-the-authored-plan step
# D12 staleness sentence (new convention bullet, same block)
check_f 'literals are dated snapshots at a stated base'
check_f "re-measure at the task's rebased base"

# Drift-guard coverage subsection (§3) — pin the block heading plus the rules whose teeth live
# here by their distinctive phrase, so a future edit can't silently drop one. Rule 7 (guard-split
# deps-edge) is pinned in skills/war-machine/war-pipeline-structure.test.sh, which also carries the
# OLD-absent assert for this subsection's retired rule-count word.
# Fixed-string, no quote-marks/bold crossing the anchor (byte-anchor-fragility trap).
check '^### Drift-guard coverage'
check_f 'unguarded mirror is a plan defect'   # rule (a): new mirror ⇒ registry row same task
check_f 'OLD value absent'                     # rule (b): default-flip enumerates surfaces, asserts old absent

# §4 — ADR 0042 pointer (trigger + read shape), bare-invoke-runs-the-interview, widened
# HANDOFF DIRECTIVE, merged conversion target, the four merged-shape gap rows, D9 binding
check_f 'When authoring a plan from scratch, read'
check_f 'read [references/plan-interview.md](references/plan-interview.md)'
check_f '### Bare invoke — run the interview'
check_f 'terminating only on one merged plan'
check_f "only from the operator's answers"
check_f 'Author into the merged template:'
check_f 'The conversion target is always the merged shape'
check_f 'untagged factual claims (D4)'
check_f 'implicit `## Assumptions ledger`'
check_f "untagged End states (D5's closed tag set)"
check_f 'without `Done when:`'
check_f 'bound by the same question contract'

# Interview doctrine file — presence + its ratified internals (structure-test lock-step:
# every ratified sentence lands with its pin in the same task)
if [ -f "$DOCTRINE" ]; then
  printf 'ok - references/plan-interview.md exists\n'
else
  printf 'not ok - references/plan-interview.md is MISSING\n'
  fails=$((fails + 1))
fi
doc_f 'Stage 0 — silent recon'
doc_f "node skills/_shared/war-memory.mjs query '<slug> plan-authoring' --repo docs/learnings"
doc_f 'Stage 1 — silent rehearsal + pre-mortem'
doc_f 'delete-the-feature probe'
doc_f 'Stage 1b — private full-template draft'
doc_f 'Stage 2 — the interview'
doc_f 'one question per turn'
doc_f 'Qk/14'
doc_f 'Stage 3 — mid-budget checkpoint'
doc_f 'Stage 4 — coverage sweep + two echo-backs'
doc_f 'Stage 5 — two silent gates'
doc_f 'untagged claim of fact is a bug'
doc_f 'never a `(verified:)` source'
doc_f 'zero operator questions'
doc_f '## The decisive-slots table'
doc_f '1:N → roadmap rule'
doc_f 'docs/plans/YYYY-MM-DD-<slug>.md'
doc_f 'A gap review is a shorter interview, not a different discipline'
# Doctrine-side presence pin (#1307, D7): the mirrored law section carried ZERO pins before
# this — it could be deleted outright with the suite green. Deletion now reds twice: this
# pin, and the mirror-equality block's per-surface non-empty asserts below.
doc_f '## Evidence + slot law (shared with the template)'

# ---------------------------------------------------------------------------------------
# Mirror-equality block (#1307, D3–D6). The plan-authoring law is stated on BOTH reading
# surfaces — SKILL.md §2's law-statement bullets (canonical) and the doctrine's
# `## Evidence + slot law (shared with the template)` section (mirror). Per atom: a
# construct-anchored awk flag-range from each surface, whitespace-normalized (join wrapped
# lines, squeeze spaces), sed-trimmed to the atom's span, asserted NON-EMPTY per surface
# (default-deny — a deleted section or moved anchor reds here, never compares "" == ""),
# then asserted byte-equal (a divergence prints both normalized extracts). The tag-set atom
# is compared as its encounter-ordered keyword sequence (check: / gate: / HARD at audit_sha
# / backstop:, word-boundary-safe on the left so prose like "checkable" — no colon — never
# counts); fewer than four keywords on a surface is that surface's non-empty failure. The
# D14 atom projects both surfaces onto the per-row marker fragment — the two non-empty arms
# are the teeth, the equality arm is degenerate by design (A3/Note 5).
extract_range() { # $1=file  $2=anchor (fixed substring)  $3=bound ERE — emits the first
  # anchor line through the line BEFORE the first bound match, joined + space-squeezed.
  # Every live range below terminates at an in-file bullet/heading/fence/blank, never EOF.
  awk -v a="$2" -v b="$3" '
    !f { if (index($0, a)) { f = 1; print }; next }
    f  { if ($0 ~ b) exit; print }
  ' "$1" | tr '\n' ' ' | tr -s ' '
}
# Generic bound: next column-0 bullet opener / heading (fence-internal ## lines included —
# they bound the template End-state slot) / fence delimiter / blank line.
MEQ_BOUND='^- |^#|^```|^[[:space:]]*$'
mirror_eq() { # $1=atom name  $2=SKILL-side extract  $3=doctrine-side extract
  local eq_ready=1
  if [ -z "$2" ]; then
    printf 'not ok - mirror atom %s: SKILL.md extract/projection is EMPTY (anchor or span missing)\n' "$1"
    fails=$((fails + 1)); eq_ready=0
  fi
  if [ -z "$3" ]; then
    printf 'not ok - mirror atom %s: doctrine extract/projection is EMPTY (anchor or span missing)\n' "$1"
    fails=$((fails + 1)); eq_ready=0
  fi
  if [ "$eq_ready" -eq 1 ]; then
    if [ "$2" = "$3" ]; then
      printf 'ok - mirror atom %s: surfaces byte-equal after normalization\n' "$1"
    else
      printf 'not ok - mirror atom %s: surfaces DIVERGE\n' "$1"
      printf '  SKILL.md : %s\n' "$2"
      printf '  doctrine : %s\n' "$3"
      fails=$((fails + 1))
    fi
  fi
}

# D4 atom — the evidence-tag triple + the D11 issue-derived source form; span: the
# backticked (user) token through the (D11) close.
meq_skill="$(extract_range "$SKILL" '- **Every End state carries one tag**' "$MEQ_BOUND" \
  | sed -e 's/^.*`(user)`/`(user)`/' -e 's/(D11).*$/(D11)/')"
meq_doc="$(extract_range "$DOCTRINE" '- **Evidence tags (D4):**' "$MEQ_BOUND" \
  | sed -e 's/^.*`(user)`/`(user)`/' -e 's/(D11).*$/(D11)/')"
mirror_eq 'D4' "$meq_skill" "$meq_doc"

# D5 atom — the Done-when law sentence; span: the backticked Done-when slot through the
# backticked None-with-basis close.
meq_skill="$(extract_range "$SKILL" '- **Done-when law (D5):**' "$MEQ_BOUND" \
  | sed -e 's/^.*`Done when: <command>`/`Done when: <command>`/' -e 's/`None — <basis>`.*$/`None — <basis>`/')"
meq_doc="$(extract_range "$DOCTRINE" '- **Done-when law (D5):**' "$MEQ_BOUND" \
  | sed -e 's/^.*`Done when: <command>`/`Done when: <command>`/' -e 's/`None — <basis>`.*$/`None — <basis>`/')"
mirror_eq 'D5' "$meq_skill" "$meq_doc"

# D12 atom — the staleness sentence (already convergent; guarded against future drift).
meq_skill="$(extract_range "$SKILL" '- **Dated snapshots (D12 staleness rule)**' "$MEQ_BOUND" \
  | sed -e 's/^.*literals are dated snapshots/literals are dated snapshots/' -e "s/rebased base.*\$/rebased base/")"
meq_doc="$(extract_range "$DOCTRINE" '- **Staleness (D12):**' "$MEQ_BOUND" \
  | sed -e 's/^.*literals are dated snapshots/literals are dated snapshots/' -e "s/rebased base.*\$/rebased base/")"
mirror_eq 'D12' "$meq_skill" "$meq_doc"

# Tag-set atom — the closed End-state tag set, compared as its encounter-ordered keyword
# sequence (SKILL side: the merged-template fence's End-state slot; doctrine side: the
# closed-set sentence inside the D5 bullet). Formatting differs by design (fence slot with
# placeholder args vs backticked prose), so the projection, not the sentence, is the atom.
project_tags() { # stdin: one normalized line -> encounter-ordered keyword sequence
  awk '
    function boundary_at(s, p) {
      if (p == 1) return 1
      return (substr(s, p - 1, 1) !~ /[A-Za-z0-9_]/)
    }
    function firstpos(s, tok, from,   off, idx, p) {
      off = from
      while (1) {
        idx = index(substr(s, off), tok)
        if (idx == 0) return 0
        p = off + idx - 1
        if (boundary_at(s, p)) return p
        off = p + 1
      }
    }
    {
      s = $0
      n = split("check:|gate:|HARD at audit_sha|backstop:", toks, "|")
      pos = 1; out = ""
      while (1) {
        best = 0; bt = ""
        for (i = 1; i <= n; i++) {
          p = firstpos(s, toks[i], pos)
          if (p > 0 && (best == 0 || p < best)) { best = p; bt = toks[i] }
        }
        if (best == 0) break
        out = (out == "" ? bt : out " > " bt)
        pos = best + length(bt)
      }
      print out
    }
  '
}
meq_skill="$(extract_range "$SKILL" '- End state: <numbered list' "$MEQ_BOUND" | project_tags)"
meq_doc="$(extract_range "$DOCTRINE" '- **Done-when law (D5):**' "$MEQ_BOUND" | project_tags)"
meq_skill_n="$(printf '%s\n' "$meq_skill" | awk -F' > ' '{ print ($0 == "" ? 0 : NF) }')"
meq_doc_n="$(printf '%s\n' "$meq_doc" | awk -F' > ' '{ print ($0 == "" ? 0 : NF) }')"
tag_eq_ready=1
if [ "$meq_skill_n" -lt 4 ]; then
  printf 'not ok - mirror atom tag-set: SKILL.md yields %s of 4 keywords (%s)\n' "$meq_skill_n" "$meq_skill"
  fails=$((fails + 1)); tag_eq_ready=0
fi
if [ "$meq_doc_n" -lt 4 ]; then
  printf 'not ok - mirror atom tag-set: doctrine yields %s of 4 keywords (%s)\n' "$meq_doc_n" "$meq_doc"
  fails=$((fails + 1)); tag_eq_ready=0
fi
if [ "$tag_eq_ready" -eq 1 ]; then
  if [ "$meq_skill" = "$meq_doc" ]; then
    printf 'ok - mirror atom tag-set: keyword sequences equal (%s)\n' "$meq_skill"
  else
    printf 'not ok - mirror atom tag-set: keyword sequences DIVERGE\n'
    printf '  SKILL.md : %s\n' "$meq_skill"
    printf '  doctrine : %s\n' "$meq_doc"
    fails=$((fails + 1))
  fi
fi

# D14 atom — both surfaces projected onto the per-row AI-declared marker fragment (SKILL
# side: Example B's intro prose, bounded at its fence open; doctrine side: the D14 bullet).
meq_frag='per-row `AI-declared` marker'
meq_skill="$(extract_range "$SKILL" '### Example B — AFK-form (merged plan)' '^```')"
meq_doc="$(extract_range "$DOCTRINE" '- **AFK provenance (D14):**' "$MEQ_BOUND")"
meq_skill_p=''; meq_doc_p=''
if printf '%s\n' "$meq_skill" | grep -qF -e "$meq_frag" --; then meq_skill_p="$meq_frag"; fi
if printf '%s\n' "$meq_doc" | grep -qF -e "$meq_frag" --; then meq_doc_p="$meq_frag"; fi
mirror_eq 'D14' "$meq_skill_p" "$meq_doc_p"

# Retired wording — case-insensitive OLD-absent (the self-sufficient-entry flip retired the
# handoff/required-Grill-Me framing; a returning phrase in ANY casing is a regression).
# Fragment-split assembly per the coupling-comment lesson (see lacks_i above).
r1a='never authors'
r1b=' a spec from scratch'
lacks_i "$r1a$r1b"
r2a='hands off to the'
r2b=' installed authoring skills'
lacks_i "$r2a$r2b"
r3a='primer + '
r3b='handoff'
lacks_i "$r3a$r3b"
r4a='dependency '
r4b='check'
lacks_i "$r4a$r4b"

# Positive controls for the four assembled absence patterns (#1308, D8/D11). The assembled
# literals are unfindable by any grep, so a one-character fragment typo would leave a
# pattern matching nothing and its pin silently green forever. Both ways per pattern: the
# re-cased fixture must FIRE the case-insensitive composition (pattern alive), and the same
# fixture must MISS the plain case-sensitive composition (the -i is load-bearing, not
# decorative — the recorded lacks()-vs-has_i() asymmetry class). Fixtures are INDEPENDENT
# re-cased restatements assembled from their OWN split fragments, never from the rN
# variables — deriving a fixture from rN makes the control tautological; a fragment typo
# must be able to desynchronize pattern and fixture. Fixture fragments stay split for the
# same repo-sweep reason as the rN fragments above.
ctl() { # $1=pattern number  $2=fixture (re-cased restatement)  $3=assembled rN pattern
  if printf '%s\n' "$2" | grep -qiF -e "$3" --; then
    printf 'ok - lacks_i pattern %s is alive (re-cased fixture fires under -i)\n' "$1"
  else
    printf 'not ok - pattern %s is dead\n' "$1"
    fails=$((fails + 1))
  fi
  if printf '%s\n' "$2" | grep -qF -e "$3" --; then
    printf 'not ok - pattern %s: -i is decorative (case-sensitive composition also fires)\n' "$1"
    fails=$((fails + 1))
  else
    printf 'ok - lacks_i pattern %s: -i load-bearing (case-sensitive composition misses)\n' "$1"
  fi
}
f1a='Never Authors'
f1b=' A Spec From Scratch'
ctl 1 "$f1a$f1b" "$r1a$r1b"
f2a='Hands Off To The'
f2b=' Installed Authoring Skills'
ctl 2 "$f2a$f2b" "$r2a$r2b"
f3a='Primer + '
f3b='Handoff'
ctl 3 "$f3a$f3b" "$r3a$r3b"
f4a='Dependency '
f4b='Check'
ctl 4 "$f4a$f4b" "$r4a$r4b"

# Commander's Intent sits BEFORE ## Build order inside the merged plan template.
# Locators anchor to the verbatim arrow-bearing template lines (unique to the merged-template
# fence) so a stray earlier bare heading of the same text can't misbind them.
ci="$(grep -nF "## Commander's Intent              ← operator-authored; intent ceiling, plan floor" "$SKILL" | head -n 1 | cut -d: -f1)"
bo="$(grep -nF '## Build order (for /war)          ← the phase list, in DAG order' "$SKILL" | head -n 1 | cut -d: -f1)"
if [ -n "$ci" ] && [ -n "$bo" ] && [ "$ci" -lt "$bo" ]; then
  printf "ok - Commander's Intent precedes ## Build order\n"
else
  printf "not ok - Commander's Intent must precede ## Build order (ci=%s bo=%s)\n" "$ci" "$bo"
  fails=$((fails + 1))
fi

exit $fails
