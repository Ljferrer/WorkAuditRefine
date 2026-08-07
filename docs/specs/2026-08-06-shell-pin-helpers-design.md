# Shell pin-helper hardening — existence, case, and stripping semantics in one refactor

Issues: #1374, #1371, #1362, #1310

Four recorded defects in `skills/war-machine/war-pipeline-structure.test.sh`'s helper family land
as one helper-refactor diff: a hard-fail existence guard so absence pins can never pass vacuously
(#1362), a stdin-reading inner predicate pair so the committed `-i` control binds the helper
instead of an inline copy (#1310), migration of the count-word-flip retirement asserts to the
case-insensitive helper (#1374), and a `strip_prose`-aware presence variant so NEW-present pins
cannot be self-satisfied by README `## Status` blurb prose (#1371). Zero gate, hook, or engine
changes — the suite stays a self-discovered `*.test.sh`.

## 1. Context — the gap / problem

`skills/war-machine/war-pipeline-structure.test.sh` is the pipeline's structural pin suite:
`has()`/`has_i()` assert fixed-string presence, `lacks()`/`lacks_i()` assert absence through
`strip_prose()` (which drops README `## Status` and `## Changelog` sections), and the suite exits
with the count of failed assertions. Four defects are live in that helper family, all
code-verified at today's tip (`6fff2ee`, 2026-08-06):

- **Vacuous absence pass on a missing target.** `lacks()` and `lacks_i()` read their target via a
  bare `strip_prose < "$1"` redirect with no existence check, and the script sets `set -u` but not
  `set -e`; a deleted or renamed pinned surface leaves grep an empty stream, grep exits 1, and
  every absence pin against that surface prints a false `ok` (verified: issue #1362 (2026-08-06);
  confirmed by Read of the `lacks()`/`lacks_i()` bodies and the `set -u` line at tip `6fff2ee`).
  Today this is mitigated only by construction — each pinned surface also carries a positive
  presence pin, and `has()`/`has_i()` red loudly on a missing file because bare grep exits 2 —
  not by any guard inside the absence helpers (verified: issue #1362 (2026-08-06)).
- **The `-i` control exercises an inline copy, not the helper.** `lacks_i()` embeds its `-i`
  directly, and the committed `lacks_i -i positive control` block runs its own inline
  `printf | strip_prose | grep -qiF` pipeline rather than calling the helper; mentally deleting
  the `-i` from `lacks_i`'s body reds no committed assertion — both real retired-grill call sites
  stay green (their phrases are absent in every casing) and the control proves grep's `-i`
  semantics, not the helper's (verified: issue #1310 (2026-08-06); the proposed `_hit_i`
  stdin-reading inner helper appears nowhere in the live file — verified: grep, 2026-08-06). The
  WAR Lead's correction comment on issue #1310 withdrew the original "folded into Task 8's
  dispatch" closing note — adjudication rows thread into auditor prompts only — so the refactor
  must land as its own change citing that issue (verified: issue #1310 comment (2026-08-06)).
- **Count-flip retirement asserts still case-sensitive.** The count-word-flip retirement asserts
  against the war-strategy SKILL — the pair assembled from `retired_count_a`/`retired_count_b`
  plus the `rules` suffix — still route through case-sensitive `lacks()`, so a benign
  sentence-case revert of the retired count prose passes silently (verified: issue #1374
  (2026-08-06); confirmed live at the assignments following the guard-split deps-edge block). This
  is the recorded `lacks`-vs-`lacks_i` asymmetry class's original concrete instance, flagged Minor
  with disposition absorb and left unfixed at that phase's close (verified: issue #1374
  (2026-08-06)).
- **NEW-present pins read the raw file.** `has()` and `has_i()` grep the file unstripped while the
  absence helpers strip `## Status`/`## Changelog` first; a release blurb quoting or closely
  paraphrasing a pinned literal therefore satisfies a NEW-present pin by itself, degrading the pin
  from "the target section landed the phrasing" to "the phrasing appears anywhere in the file"
  (verified: issue #1371 (2026-08-06); the recorded instance and the `has_i_stripped` fix option
  live in `docs/learnings/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md`). At
  today's tip the recorded README pin (`recommended auxiliary plugin`) has exactly 2
  case-insensitive hits, both structural (the section heading plus link text/fragment) — the
  lesson's 4-hit instance including a Status-blurb hit is a dated snapshot at the 2026-08-05 land
  tip it names (verified: grep of `README.md`, 2026-08-06).

Migration is green-by-construction at today's tip: the retired count phrases have 0
case-insensitive hits in the war-strategy SKILL, and every candidate NEW-present twin retains at
least one hit after `strip_prose` (README 2, the other four surfaces 1 each) — measured 2026-08-06
at `6fff2ee`; only `README.md` among the candidate surfaces carries a `## Status` heading today,
so stripping changes scanned bytes on README alone (verified: awk+grep census, 2026-08-06).

## 2. Pivotal constraints

- **bash-3.2-safe, no mktemp, plain grep/awk** — the file's own top-comment convention; the suite
  is self-discovered by `resolveGate`'s `*.test.sh` sweep, so zero gate edits.
- **`set -u` only; never add `set -e`** — that would wholesale-change every helper's failure
  semantics; the existence guard is explicit and local (issue #1362's shape).
- **Exit contract preserved**: exit N = N failed assertions. Every new red path (missing file,
  broken `-i`, stripped-presence miss) increments `fails` and returns — never an early `exit`.
- **Case discipline preserved**: case-sensitivity stays reserved for flag/token literals that
  never re-case (the `has()`/`has_i()` header convention); retired PROSE absence goes `lacks_i`.
  The rename-loop `lacks()` call sites pin structural tokens (skill-dir names) and stay
  case-sensitive [assumed: matches the file's own recorded case-discipline — if wrong: a two-line
  migration of that loop to `lacks_i` is additive and lands green, the tokens are absent in every
  casing].
- **Sweep hygiene**: every retired-phrase or re-cased fixture literal stays assembled at runtime
  from split fragments so the file never self-matches a repo-wide sweep (the
  coupling-comment-self-match class the file already documents).
- **Temp-break proof**: per the file's own convention, every new or altered assertion is proven to
  FAIL once against a mutated copy before commit, evidence in the commit body.
- **One file, one task** (code-boundary rule 1): all four issues are one helper-refactor diff in
  `skills/war-machine/war-pipeline-structure.test.sh`; the lesson stamp is a second, file-disjoint
  edit in the same change.

## 3. Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Predicate factoring | Stdin-reading inner pair — `_hit() { strip_prose \| grep -qF -e "$1"; }` and `_hit_i() { strip_prose \| grep -qiF -e "$1"; }` — whose sole delta is the `-i`; every stripped-scan helper wraps one of them via `< "$1"` | (verified: issue #1310 fix proposal (2026-08-06)); the symmetric `_hit` is [assumed: default for a bindable case-sensitive half — if wrong: only `_hit_i` lands and the control's case-sensitive half keeps a plain grep] |
| D2 | Existence guard | Hard-fail `[ -f "$1" ]` check inside every helper that reads its target through `strip_prose` (`lacks`, `lacks_i`, the new presence variant): prints a distinct `not ok - <basename> MISSING FILE` line, increments `fails`, returns without grepping | (verified: issue #1362 (2026-08-06)); shared tiny guard helper vs. inlined test is executor's latitude |
| D3 | Count-flip migration | The `retired_count_a`/`retired_count_b` retirement asserts move `lacks()` → `lacks_i()`; green-by-construction (0 case-insensitive hits at `6fff2ee`) | (verified: issue #1374 (2026-08-06); census 2026-08-06) |
| D4 | Control routing | The committed `-i` control's re-cased-fixture half calls `_hit_i` (fixture on stdin), so dropping the helper's `-i` reds a committed assertion; the plain-grep half calls `_hit`, binding the `-i` as the sole delta between the two inner predicates | (verified: issue #1310 (2026-08-06)); second-half routing through `_hit` is [assumed: default — if wrong: that half keeps its inline `grep -qF` and only the `-i` half binds the helper] |
| D5 | Presence variant | New `has_i_stripped()` (the lesson's recorded name): existence guard + `_hit_i "$2" < "$1"`, ok/not-ok lines labeled `(case-insensitive, prose-stripped)`; opt-in per pin, never a wholesale `has_i` replacement | (verified: issue #1371 and the lesson's fix option (b), 2026-08-06) |
| D6 | Pin migration scope | Exactly the NEW-present twins that pair with `lacks_i` old-absent pins on the same surface: the four gospel twins (README, CLAUDE.md, war-help, CONTEXT) plus the machine `author the merged plan` twin — five pins, all ≥1 stripped hit at `6fff2ee` | [assumed: default — the twin-of-a-retirement class is the recorded degradation; if wrong: a README-only migration still closes the lesson's concrete instance] |
| D7 | Committed controls | Two committed self-checks join the file's control precedent: (a) the guard fires on a nonexistent path — probed via command substitution so the probe's own `fails` increment stays in the subshell; (b) the guard passes a real file. Plus the D4-routed `-i` control | [assumed: house convention (the existing prose-exclusion and `-i` control blocks) — if wrong: temp-break proof in the commit body alone covers #1362] |
| D8 | Fixture routing | The rename prose-exclusion self-check's two inline `printf \| strip_prose \| grep` pipelines also route through `_hit`, leaving zero inline copies of the stripped-scan composition outside the two inner predicates | [assumed: default hygiene — if wrong: they stay inline; they pin `strip_prose` itself and were never the #1310 defect] |
| D9 | Lesson stamp | `docs/learnings/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md` description gains a `MITIGATED (#1371, <land date>)` prefix; body and keywords otherwise untouched | (verified: repo resolved-lesson-stamp convention — description prefix, body stays present-tense) |

## 4. Mechanics

### a. Inner predicates (`_hit`, `_hit_i`)

Two stdin-reading one-liners placed beside `strip_prose()`, differing only in the `-i` flag. All
stripped scans — helper bodies and committed fixture controls alike — compose these, so any
future mutation of the composition (dropping `-i`, dropping `strip_prose`) is bound by at least
one committed assertion.

### b. Existence guard

`lacks()`, `lacks_i()`, and `has_i_stripped()` each verify `[ -f "$1" ]` before scanning. On
failure: one `not ok - <basename> MISSING FILE :: <literal>` line, `fails` incremented, early
return. This converts issue #1362's deleted-surface vacuous pass into a red per affected
assertion while keeping the exit-count contract exact. `has()`/`has_i()` stay guardless — bare
grep already exits 2 and reds them on a missing file.

### c. Helper rewrites and call-site migrations

- `lacks()` → guard + `! _hit "$2" < "$1"` shape; `lacks_i()` → guard + `! _hit_i "$2" < "$1"`
  shape (their ok/not-ok lines byte-unchanged).
- `has_i_stripped()` added: guard + `_hit_i "$2" < "$1"`, presence polarity.
- The `retired_count_a`/`retired_count_b` asserts migrate `lacks` → `lacks_i` (D3).
- The `lacks_i -i positive control` block: re-cased half → `printf … | _hit_i "<pattern>"`;
  case-sensitive half → `printf … | _hit "<pattern>"` (D4). Fixture fragments stay split.
- The rename prose-exclusion self-check's two fixture pipelines route through `_hit` (D8),
  polarity per check unchanged (prose ignored / structural caught).
- The five D6 twin pins migrate `has_i` → `has_i_stripped`.

### d. Call-site census — grep floor plus mandatory manual survey

The migration census is a token sweep (`grep -n` for `lacks `, `lacks_i `, `has_i `, and
`strip_prose` occurrences in the suite), and **grep is a floor, not a ceiling**: after the grep,
hand-scan the file's same-scope comments, block banners, and printf labels end-to-end and list
each straggler as a survey-derived correction. Stragglers already found by this spec's own survey
(2026-08-06, `6fff2ee`) that the same diff must fix or re-verify:

1. The `lacks_i()` header comment's "body mirrors lacks() exactly except the -i flag" sentence —
   false after the `_hit_i` refactor; rewrite to name the inner predicate (the comments-lag-
   rewritten-code class).
2. The `-i` control banner's "the case-insensitive composition lacks_i wraps" phrasing — update
   to name `_hit_i` now that the control calls it directly.
3. The gospel-pins block comment's "lacks_i() inherits strip_prose" claim — still true via
   `_hit_i`; re-verify wording, no change expected.
4. The rename-loop absence pins (`war-survey-corps`/`war-aftermath` tokens) — confirmed
   structural-token class, deliberately kept case-sensitive `lacks()` (D3's boundary), not a
   straggler.
5. The file-top exit-contract comment ("exit N = N failed assertions") — still true; the guard's
   red counts as a failed assertion.

### e. Lesson stamp

Prefix the `description:` frontmatter value of
`docs/learnings/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md` with
`MITIGATED (#1371, <land date>): `; body, keywords, and relates untouched (D9).

## 5. Surface changes

- `skills/war-machine/war-pipeline-structure.test.sh` — the helper-refactor diff (all four
  issues).
- `docs/learnings/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md` — description
  stamp only.

## 6. New domain terms (CONTEXT.md)

None. `_hit`/`_hit_i`/`has_i_stripped` are file-local helper names, not pipeline vocabulary.

## 7. Recommended ADRs

None. File-local test hardening; the case-discipline and prose-strip conventions it extends are
already recorded in-file and in the linked lessons — no triad-passing decision.

## 8. Open risks / implementation notes

- **Ordering**: this group depends on no sibling groups landing first (empty dependency list; the
  survey manifest carries the machine hint). Its single production surface is the suite itself,
  so contention risk is confined to other work touching the same test file.
- **Staleness rule**: the green-by-construction measurements in §1 are dated snapshots at
  `6fff2ee`; the worker re-runs the two census greps (retired count phrases case-insensitive;
  five twins' stripped-hit counts) at its rebased dispatch base before migrating, and treats a
  changed count as a stop-and-report, not a silent adaptation.
- **Subshell isolation for D7(a)**: the committed missing-file control must invoke the helper in
  a command substitution or pipeline so the probe's own `fails` increment dies in the subshell;
  the control then asserts the captured output carries the `MISSING FILE` marker. Getting this
  wrong double-counts and breaks the exit contract.
- **Output-format consumers**: the gate consumes the suite's exit status, not its ok/not-ok text
  [assumed: `resolveGate` discovery runs the suite for its exit code — if wrong: keep every
  existing ok/not-ok line byte-stable and only add new lines].
- **Comment lag**: the §4d survey list is the committed floor; the auditor should re-run the
  same-scope hand-scan at the pinned `audit_sha` rather than trusting this spec's snapshot.

## 9. Non-goals / deferred

- **Sibling suite**: `skills/war-strategy/war-strategy-structure.test.sh` carries its own
  single-target `lacks_i` helper family (no `strip_prose`, hardcoded SKILL.md target) — out of
  this footprint; if the vacuous-pass class is later confirmed there, it is its own issue.
- **Comment-leader stripping** stays out of the helpers — the file already records that it
  belongs to the hand-run land-time sweep.
- **No case-sensitive stripped presence variant** (`has_stripped`): no call site needs one today;
  add it the first time a case-stable token literal needs blurb-independent proof.
- **No wholesale `has_i` → `has_i_stripped` migration** beyond the five D6 twins: most presence
  pins legitimately accept a hit anywhere in the file.
- **Blurb-phrasing policy** (the lesson's fix option (a)) is not mandated — the stripped variant
  makes it unnecessary for migrated pins.
- **Sibling lesson stamps**: the lessons cited by issues #1362 and #1374/#1310 are outside this
  footprint; stamping them is left to the closing comments on those issues and routine memory
  housekeeping.

## 10. Validation criteria

- V1 WHEN the landed suite runs at the integrated tip THE suite SHALL exit 0 · check:
  `bash skills/war-machine/war-pipeline-structure.test.sh; echo $?` → `0`.
- V2 WHEN a surface scanned by `lacks_i()` is renamed away in a throwaway copy (e.g. move
  `skills/war-machine/SKILL.md` aside) THE suite SHALL exit nonzero with a `MISSING FILE` not-ok
  line naming that basename, never a vacuous `ok - … lacks` for it · check: rename in a scratch
  clone, run the suite, grep its output for `MISSING FILE`; restore.
- V3 WHEN the `-i` is deleted from `_hit_i`'s body in a throwaway copy THE committed `-i` control
  SHALL go red · check: `sed 's/grep -qiF/grep -qF/'` on the inner predicate in a scratch copy,
  run, expect nonzero and the control's not-ok line.
- V4 WHEN a re-cased revert of a retired count phrase (the `retired_count_a`/`retired_count_b` +
  `rules` pair, sentence-cased) is appended to a scratch copy of the war-strategy SKILL THE
  migrated retirement asserts SHALL red · check: append to a scratch-copy target, run the suite
  pointed at it (or patch `$WAR_STRATEGY` in a scratch suite copy), expect the case-insensitive
  UNEXPECTEDLY-has not-ok.
- V5 WHEN a migrated NEW-present twin's literal survives only inside a `## Status` blurb in a
  scratch copy of README THE `has_i_stripped` pin SHALL red · check: scratch README carrying
  `recommended auxiliary plugin` solely under `## Status`, run, expect the prose-stripped
  MISSING not-ok.
- V6 WHEN the missing-file committed control runs against the live tree THE suite's `fails` count
  SHALL be unaffected by the probe's own subshell red · check: suite exit 0 at the landed tip
  with the control's ok line present in output.
- V7 WHEN the refactor lands THE stripped-scan composition SHALL exist in exactly the two inner
  predicates · check: `grep -En 'strip_prose *[|<]' skills/war-machine/war-pipeline-structure.test.sh`
  → exactly the `_hit` and `_hit_i` bodies (dated expectation at land; re-count at the rebased
  base).
- V8 WHEN the lesson stamp lands THE lesson's description SHALL open with the MITIGATED prefix ·
  check: `grep -c 'MITIGATED (#1371' docs/learnings/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md`
  → `1`.
- V9 WHEN every new or altered assertion is authored THE commit body SHALL carry its temp-break
  red-proof (mutated-copy evidence per the file-top convention) · check: commit-body Red-proof
  block enumerates V2-V5's mutations.
