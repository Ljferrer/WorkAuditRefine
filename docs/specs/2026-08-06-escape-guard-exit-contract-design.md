# Escape-guard exit contract hardening — zero-byte baseline dies infra, Step-4 triage gains its exit-2 arm, the gitignored ceiling is pinned as deferred

Issues: #1263, #1369, #1268

## 1. Context — the gap / problem

One subsystem, one exit contract. `skills/red-team/assets/assert-no-repo-escape.sh` is the /red-team
escape-detection authority with a load-bearing floor-family contract — 0 = clean, 1 = escape,
2 = git/infra error, and 2 must never collapse into (or be preempted by) 1 (verified: the guard's
exit-codes header block, live tree @ 6fff2ee, 2026-08-06). Three defects/decisions resolve against that
single contract:

- **Zero-byte baseline collapses infra into a false escape.** The arg-parse baseline validation block
  checks `-e`, `-f`, and `-r` on the `--baseline` path but not `-s`, so a zero-byte baseline is
  accepted; the two-file awk ref-diff then hits the `NR==FNR` degeneracy — with an empty first file
  `NR` never diverges from `FNR`, every live-dump line is absorbed into `base[]` via `next`, `live[]`
  stays empty, and the `END` block prints `removed: <ref>` for every live `refs/heads/`/`refs/tags/`
  ref — exit 1 (escape, with an inverted message) instead of 2 (infra)
  (verified: issue #1263 (2026-08-06); re-confirmed against the arg-parse baseline validation block and
  the awk pass in the live tree @ 6fff2ee). This is the exact wrong implementation the suite's own
  case-26 banner names ("treat an absent baseline as an EMPTY one"), reached via an empty rather than
  missing file; case 26 covers only the missing-file path and the suite (27 cases, dated snapshot
  2026-08-06 @ 6fff2ee) has no zero-byte case (verified: issue #1263 (2026-08-06); re-confirmed in
  `skills/red-team/assets/assert-no-repo-escape.test.sh`). The lesson
  `docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md` records the gotcha and notes the `-s` check
  was raised twice as a Minor follow-up and never added (verified: issue #1263 (2026-08-06); lesson
  body re-read at 6fff2ee).

- **Step-4 triage has no exit-2 arm; ADR 0043 over-claims.** `skills/red-team/SKILL.md` Step 4 enters
  the delta triage on its opening bold clause "On a nonzero exit, diagnose every delta by
  action-provenance FIRST", but the two arms that follow (probe-authored, foreign) handle only deltas —
  an exit 2 has no deltas and no stated resolution arm, so the prose routes an infra fault into a
  triage that cannot resolve it (verified: issue #1268 (2026-08-06); Step 4 re-read at 6fff2ee).
  Separately, ADR 0043's Context states "the *only* mechanic Step 5 offered for closing a blocker (the
  grill loop …)" — over-claiming, since Step 5 also offered a probe re-run, the very mechanic the ADR's
  own two-arm re-verify trigger depends on (verified: issue #1268 (2026-08-06); the sentence stands in
  `docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md` at 6fff2ee).

- **Gitignored leak paths are a documented, deliberately-deferred ceiling.** Both the snapshot-mode
  pre-run integrity refusal and check (a) build on `git status --porcelain`, which never reports
  ignored paths — a probe leaking a write into a gitignored path is invisible to both checks and
  creates no ref for the baseline ref-diff to catch (verified: issue #1369 (2026-08-06); both
  porcelain call sites re-confirmed at 6fff2ee). The guard's own header records this as its third
  detection ceiling, explicitly deferred: widening to `--ignored` needs its own back-compat pin plus a
  ruling on legitimately-ignored directories — "recorded as the gitignored-leak-paths backstop, not
  taken here" (verified: issue #1369 (2026-08-06); the ponytail ceiling-3 paragraph at 6fff2ee). The
  lesson `docs/learnings/escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes.md` §3 mirrors
  the same ceiling (verified: issue #1369 (2026-08-06)).

Authoring-time survey finding (beyond the issues' named files): the escape-guard bullet in
`skills/red-team/references/lenses.md` (named construct: the "Pre/post ref-diff escape guard (executed
probes)" bullet) restates the exit contract ("2 = a git/infra error or unreadable baseline") and
compresses Step 4's routing as "A nonzero result routes the verdict through the self-confound gate,
action-provenance first" — the same two drifts in miniature (verified: live tree @ 6fff2ee,
2026-08-06). It must move in the same commit as the Step-4 fix or the surfaces fork.

## 2. Pivotal constraints

- **The 1-vs-2 boundary is a floor-family contract.** Infra never collapses into escape and is never
  preempted by one — baseline validation runs at arg-parse time, ahead of every check (the guard's
  check-(c) header note; suite case 27 pins the ordering). The new check must live there too.
- **No-baseline byte-equivalence.** Without `--baseline`, check mode must stay byte-equivalent to the
  pre-ref-diff script in exit codes, stdout, and checks (sole delta: one stderr advisory — suite cases
  19/20). The zero-byte check must sit inside the `--baseline`-only validation block, touching nothing
  else.
- **Every `die` call site passes an explicit code.** Suite case 10 is a standing negative call-site
  lock; the new die must carry an explicit trailing `2`.
- **Step-4 prose is anchor-pinned.** `skills/red-team/diagnosis-preflight.test.sh` asserts tolerant
  anchors (`self-confound`, `action-provenance`, …) in `skills/red-team/SKILL.md`; the triage rewrite
  must keep them present.
- **ADR 0043's decision is ratified, not re-litigated.** The ADR implements the 2026-07-28 operator
  directive; the correction touches the Context over-claim only, all other body text byte-unchanged.
- **Ceiling-3 header text stays byte-identical.** The #1369 resolution is a ratified deferral, not a
  behavior change — the ponytail paragraph that documents it must not be reworded.
- **Suite conventions.** macOS bash 3.2.57, cwd-independent, fresh mktemp fixtures, artifacts outside
  the repo tree; new cases extend the suite's numbered header enumeration in the same commit (the
  banner-count trap).
- **Redaction lint.** Touching `docs/learnings/` requires the fail-closed lint to stay green.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where does the zero-byte check live? | Fourth check in the arg-parse baseline validation block (after `-e`/`-f`/`-r`): `[ -s "$baseline_file" ]` else `die … 2`. Arg-parse time, so an infra fault is never preempted by an escape conclusion (the case-27 rationale, extended). |
| Rekey the awk loader instead (`FNR==NR && FILENAME==ARGV[1]`)? | Rejected. It fixes the degeneracy's direction but silently *accepts* the empty baseline as "no refs at baseline", reporting every live ref `added:` — still exit 1. An empty baseline is always an infra artifact (next row), so acceptance is wrong in principle, not just in direction. |
| Can a legitimate baseline be zero bytes? | No. Snapshot mode writes via `printf '%s\n' "$snap_out"` — even an empty ref set yields a one-byte file (the trailing newline). `-s` rejects only files no snapshot-mode run can produce: truncated/failed writes or foreign artifacts. (verified: the snapshot-write construct in the guard, live tree @ 6fff2ee, 2026-08-06) |
| Step-4 triage shape | Enter the delta triage on **exit 1** specifically; add a one-line exit-2 arm: fix the named git/infra fault and re-run the guard — exit 2 is neither clean nor an escape, and the gate is never piped while the guard is unsettled. Quarantine-on-nonzero (the guard header's "never CLEARED until the state is clean") is unchanged: both codes forbid `CLEARED` until settled. |
| ADR 0043 correction | Surgical: drop the over-claim so the sentence reads as "the removal mechanic Step 5 offered for closing a blocker (the grill loop …)" — the argument (nothing stopped removal being applied to a merely-patched finding) stays intact; every other body byte unchanged. |
| #1369 disposition | Ceiling ratified as deferred — no `--ignored` widening. Action taken: pin the current behavior with a new suite case (gitignored stray file, refs unchanged → exit 0), so any future widening must consciously flip a red case. This delivers the "back-compat pin" half of the prerequisites the ceiling text names. [assumed: pin-not-widen is the right minimal claim for a minor documented residual — if wrong: the pin is one deletable case and widening becomes its own spec] |
| Zero-byte suite case shape | Mirrors case 26's non-vacuity: the fixture carries a `rogue` branch so the degeneracy path would return 1; assert exit 2, explicitly `!= 1`. |
| Lesson closure | `docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md` gets the repo's RESOLVED description-prefix stamp; body/keywords untouched per the stamp convention. [assumed: standard stamp convention applies — if wrong: skip the stamp; the fix stands on its own] |

## 4. Mechanics

**`skills/red-team/assets/assert-no-repo-escape.sh`**
- In the arg-parse baseline validation block, after the `-r` check, add:
  `[ -s "$baseline_file" ] || die "--baseline file is zero bytes (a truncated or failed snapshot write — infra error, never a pass): $baseline_file" 2`
  — explicit trailing `2` (case-10 call-site lock covers it automatically).
- Header, same commit: the check-(c) note "A missing or unreadable baseline file is 2" widens to
  "A missing, unreadable, or zero-byte baseline file is 2"; the exit-codes block's line for 2 widens
  "unreadable baseline" to "unreadable or zero-byte baseline". The ponytail ceiling-3 paragraph is
  byte-identical before and after.

**`skills/red-team/assets/assert-no-repo-escape.test.sh`**
- New case (zero-byte baseline): fixture repo with a `rogue` branch; create the baseline artifact as an
  empty file (outside the repo tree, per suite convention); run check mode with `--baseline`; assert
  exit 2 and explicitly not 1. Banner names the `NR==FNR` degeneracy and pairs with case 26 (the
  missing-file sibling) — without the `-s` check this case reds with exit 1.
- New case (gitignored ceiling pin): fixture commits a `.gitignore` naming a pattern **before** the
  snapshot (so the pre-run refusal does not fire on the untracked `.gitignore` itself), takes the
  snapshot, then writes a file matching the ignored pattern; run check mode with `--baseline`; assert
  exit 0. Banner names ponytail ceiling 3 and states this case's role: a pinned, documented false
  negative — flipping it red is the deliberate first act of any future `--ignored` widening.
- Extend the suite's numbered header enumeration with both cases, and append a "pinned by the
  gitignored-ceiling case as a documented false negative" clause to the gitignored bullet of the
  header's residual-ceilings block. Both suites remain discovered by the merge gate via `resolveGate`'s
  patterns by name — no gate change.

**`skills/red-team/SKILL.md` (Step 4)**
- The opening bold clause becomes "**On exit 1, diagnose every delta by action-provenance FIRST**"
  (rest of the sentence unchanged).
- Add the one-line exit-2 arm adjacent to the two provenance arms: on exit 2 there is no delta to
  triage — fix the named git/infra fault and re-run the guard; exit 2 is neither clean nor an escape,
  and the gate is never piped while the guard is unsettled.
- The Step-4 exit-contract parenthetical widens "an unreadable baseline" to "an unreadable or
  zero-byte baseline".
- All `diagnosis-preflight.test.sh` anchors (`self-confound`, `action-provenance`, `single-path`,
  `primary evidence`, `falsif`) remain present.

**`docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`**
- In the Context paragraph, replace the "the *only* mechanic Step 5 offered" phrasing with a
  non-exclusive form ("the removal mechanic Step 5 offered …"); no other body byte changes.

**`skills/red-team/references/lenses.md`** (survey-derived correction)
- In the "Pre/post ref-diff escape guard (executed probes)" bullet: widen "unreadable baseline" to
  "unreadable or zero-byte baseline", and scope the action-provenance routing clause to the exit-1
  arm (the quarantine framing itself may stay code-agnostic — both nonzero codes forbid `CLEARED`).

**`docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md`**
- Prefix the frontmatter `description` with the RESOLVED stamp naming this spec's issue (#1263);
  body and keywords untouched.

**Doc-consistency sweep (grep floor + mandatory survey)**
- Sweep: `grep -rn 'unreadable baseline' skills/ docs/` and
  `grep -rn 'On a nonzero exit, diagnose' skills/ docs/` — handle every match. Dated snapshot of hits
  at 6fff2ee (2026-08-06): the guard header (two sites), the Step-4 parenthetical, the `lenses.md`
  bullet; the retired opener appears once (Step 4).
- **Mandatory manual same-scope survey (grep is a floor, not a ceiling):** after the grep, hand-scan
  the guard's full header comment, the suite's top-of-file banner and residual-ceilings block, Step 4's
  neighboring prose, and the `lenses.md` escape-guard bullet's surrounding lens list — list each
  straggler as a survey-derived correction. This spec's own authoring survey already produced one: the
  `lenses.md` bullet restates the contract in different words that no retired-phrase grep hits.

## 5. Surface changes

- `skills/red-team/assets/assert-no-repo-escape.sh` — the `-s` check + two header contract widenings.
- `skills/red-team/assets/assert-no-repo-escape.test.sh` — two new cases + header enumeration/ceiling-note updates.
- `skills/red-team/SKILL.md` — Step-4 opener scoping, exit-2 arm, parenthetical widening.
- `skills/red-team/references/lenses.md` — escape-guard bullet consistency (survey-derived).
- `docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md` — Context over-claim correction.
- `docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md` — RESOLVED description stamp.

Carving hint for conversion: the guard + its suite are one cohesive unit (one task); the four prose
surfaces are file-disjoint from it and from each other, but `SKILL.md` + `lenses.md` should travel
together (same drift, same commit rationale).

## 6. New domain terms (CONTEXT.md)

None. "Gitignored-leak-paths backstop" already exists as guard-header prose and stays as-is.

## 7. Recommended ADRs

None new. ADR 0043 receives the surgical Context correction only. The #1369 deferral ratification is
recorded by this spec plus the pinned suite case — below ADR weight. [assumed: spec + pin suffice as
the decision record — if wrong: promote the deferral to a short ADR at plan conversion]

## 8. Open risks / implementation notes

- **Ordering:** no sibling-group dependency — the survey manifest's machine hint for this group is an
  empty depends-on list; the file footprint is self-contained.
- **Retired-opener grep must use the full phrase.** Step 3 of `skills/red-team/SKILL.md` contains an
  unrelated "a **nonzero exit** (missing file, invalid JSON …)" about the war-config resolve — a loose
  `nonzero exit` retirement grep false-reds on it. Scope the OLD-absent check to
  `On a nonzero exit, diagnose`.
- **Fixture ordering in the gitignored pin case:** commit the `.gitignore` before taking the snapshot,
  or the snapshot-mode pre-run refusal fires on the untracked `.gitignore` itself and the case tests
  the wrong arm.
- **Byte-equivalence stays intact by construction:** the `-s` check sits inside the
  `[ -n "$baseline_file" ]` validation block, so no-baseline invocations are untouched (cases 19/20
  keep pinning the advisory behavior).
- **Anchor preservation:** re-run `skills/red-team/diagnosis-preflight.test.sh` after the Step-4 edit;
  the rewrite keeps every asserted token.
- **RESOLVED stamp semantics:** the stamp freezes the lesson body's present-tense description of the
  defect — expected, per the repo's stamp convention; do not rewrite the body to match.
- The awk pass keeps its bare `NR==FNR` key: with `-s` guaranteeing a non-empty first file, the idiom
  is safe, and layering a second fix would obscure which one is load-bearing.

## 9. Non-goals / deferred

- **No `--ignored` widening** (issue #1369's ceiling stands): deferred pending the remaining
  prerequisite — a ruling on legitimately-ignored directories; the back-compat-pin prerequisite is
  half-delivered by the new pinned suite case. The guard's ceiling-3 header text is untouched.
- **Ceilings 1 and 2 untouched:** the b2 origin-side ceiling and pre-baselined pattern-slipping refs
  remain as documented.
- **No re-litigation** of ADR 0043's decision or the 2026-07-28 adjudication directive.
- **No snapshot-format change:** the `printf '%s\n'` write stays; its one-byte floor is what makes
  `-s` sound.

## 10. Validation criteria

1. WHEN check mode receives a zero-byte `--baseline` file THE guard SHALL exit 2 (never 1), naming the
   empty baseline as an infra error · check: `bash skills/red-team/assets/assert-no-repo-escape.test.sh`
   (new zero-byte case green) and `grep -n -- '-s "$baseline_file"' skills/red-team/assets/assert-no-repo-escape.sh`
   (one hit in the baseline validation block).
2. WHEN the zero-byte fixture also carries an escape-worthy `rogue` branch THE guard SHALL still exit 2
   — infra is never preempted (the case-27 rule, extended) · check: the new case's fixture creates the
   branch and asserts `rc != 1`; suite run green.
3. WHEN a probe writes only into a gitignored path and no ref changes THE guard SHALL exit 0 — the
   pinned ceiling-3 false negative · check: the new gitignored-pin case green in the same suite run.
4. WHEN the guard's ceiling-3 header paragraph is diffed against its pre-change text THE bytes SHALL be
   identical · check: `grep -c 'gitignored-leak-paths backstop, not taken here' skills/red-team/assets/assert-no-repo-escape.sh`
   returns 1.
5. WHEN Step 4 opens the delta triage THE prose SHALL scope it to exit 1 and carry an exit-2 arm ·
   check: `grep -c 'On a nonzero exit, diagnose' skills/red-team/SKILL.md` returns 0,
   `grep -c 'On exit 1, diagnose' skills/red-team/SKILL.md` returns 1, and a `grep -n 'exit 2' skills/red-team/SKILL.md`
   hit lands inside Step 4's new arm · manual same-scope survey: hand-scan `skills/red-team/SKILL.md`'s
   same-scope tests/comments for same-meaning reworded siblings the grep misses; list each straggler as
   a survey-derived correction.
6. WHEN the Step-4 rewrite lands THE diagnosis pre-flight anchors SHALL survive ·
   check: `bash skills/red-team/diagnosis-preflight.test.sh` green.
7. WHEN ADR 0043's Context describes Step 5's closing mechanics THE exclusivity over-claim SHALL be
   absent with the sentence's argument intact · check: `grep -cF '*only* mechanic' docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`
   returns 0 and `grep -cF 'removes resolved findings' docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`
   returns 1 · manual same-scope survey: hand-scan `docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`'s
   same-scope tests/comments for same-meaning reworded siblings the grep misses; list each straggler as
   a survey-derived correction.
8. WHEN any surface restates the baseline arm of the exit contract THE enumeration SHALL include the
   zero-byte case · check: `grep -rln 'zero-byte' skills/red-team/assets/assert-no-repo-escape.sh skills/red-team/SKILL.md skills/red-team/references/lenses.md`
   lists all three files — followed by the §4 manual survey of those files' same-scope comments and
   bullets, stragglers listed as survey-derived corrections.
9. WHEN the lesson is stamped THE frontmatter description SHALL open with the RESOLVED prefix and the
   redaction lint SHALL stay green · check: `grep -n 'RESOLVED' docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md`
   hits the `description` line, and `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
