# Shell pin-helper hardening — existence guard, bound -i, case-insensitive retirements, prose-stripped presence

Converted by `/war-machine` from [docs/specs/2026-08-06-shell-pin-helpers-design.md](../specs/2026-08-06-shell-pin-helpers-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason). Issues addressed: #1362, #1310, #1374, #1371. Issue → task mapping: #1362 → Task 1.1 (existence
guard + the two committed guard controls); #1310 → Task 1.1 (the `_hit`/`_hit_i` inner-predicate pair +
control routing — the WAR Lead's correction comment on that issue withdrew the "folded into Task 8's
dispatch" note and mandates the refactor land as its own change citing the issue, which Task 1.1's commit
does); #1374 → Task 1.1 (count-flip retirement migration); #1371 → Task 1.1 (`has_i_stripped` + the
five-twin migration + the lesson stamp). `/war` files its own epic + task issues regardless
(war-execution-must-file-issues); closing the four source issues is Lead checkpoint work at phase close
(war-checkpoint-must-close-task-issues), never assumed from the epic close.

## Context — the gap / problem

One helper family, four recorded defects, one refactor diff. `skills/war-machine/war-pipeline-structure.test.sh`
is the pipeline's structural pin suite: `has()`/`has_i()` assert fixed-string presence, `lacks()`/`lacks_i()`
assert absence through `strip_prose()` (which drops `## Status`/`## Changelog` sections), and the suite
exits with the count of failed assertions (`set -u`, no `set -e`; the file-top contract reads "Exit 0 = all
present; exit N = N failed assertions") (verified: helper bodies and the file-top contract re-read in the
live tree at `6fff2ee`, 2026-08-06). Source spec: `docs/specs/2026-08-06-shell-pin-helpers-design.md`.
Snapshot base for every measured claim: the repo tip at `6fff2ee` (2026-08-06); conversion-time
re-measurements below are at the same base (the session worktree's spec-batch and checkpoint commits are
docs-only and touch none of these surfaces).

1. **Vacuous absence pass on a missing target** (verified: issue #1362 (2026-08-06); re-confirmed at
   `6fff2ee` by Read of the `lacks()`/`lacks_i()` bodies and the `set -u` line). Both absence helpers read
   their target via a bare `strip_prose < "$1"` redirect with no existence check; a deleted or renamed
   pinned surface leaves grep an empty stream, grep exits 1, and every absence pin against that surface
   prints a false `ok`. Today this is mitigated only by construction — each pinned surface also carries a
   positive presence pin, and `has()`/`has_i()` red loudly on a missing file because bare grep exits 2 —
   not by any guard inside the absence helpers (verified: issue #1362 (2026-08-06)).
2. **The `-i` control exercises an inline copy, not the helper** (verified: issue #1310 (2026-08-06);
   re-confirmed at `6fff2ee`). `lacks_i()` embeds its `-i` directly, and the committed `lacks_i -i positive
   control` block runs its own inline `printf | strip_prose | grep -qiF` pipeline rather than calling the
   helper; mentally deleting the `-i` from `lacks_i`'s body reds no committed assertion — both real
   retired-grill call sites stay green (their phrases are absent in every casing) and the control proves
   grep's `-i` semantics, not the helper's. The proposed `_hit_i` stdin-reading inner helper appears
   nowhere in the live file (verified: grep at conversion, `6fff2ee`). The Lead's correction comment on
   #1310 establishes that adjudication rows thread into auditor prompts only, so the refactor must land as
   its own change citing that issue (verified: issue #1310 comment (2026-08-06)).
3. **Count-flip retirement asserts still case-sensitive** (verified: issue #1374 (2026-08-06);
   re-confirmed live at the `retired_count_a`/`retired_count_b` assignments following the guard-split
   deps-edge block). The count-word-flip retirement asserts against the war-strategy SKILL — the pair
   assembled from `retired_count_a`/`retired_count_b` plus the `rules` suffix — still route through
   case-sensitive `lacks()`, so a benign sentence-case revert of the retired count prose passes silently.
   This is the recorded `lacks`-vs-`lacks_i` asymmetry class's original concrete instance, flagged Minor
   with disposition absorb and left unfixed at that phase's close (verified: issue #1374 (2026-08-06)).
4. **NEW-present pins read the raw file** (verified: issue #1371 (2026-08-06); re-confirmed at `6fff2ee`).
   `has()` and `has_i()` grep the file unstripped while the absence helpers strip prose first; a release
   blurb quoting or closely paraphrasing a pinned literal therefore satisfies a NEW-present pin by itself,
   degrading the pin from "the target section landed the phrasing" to "the phrasing appears anywhere in
   the file". The recorded instance and the `has_i_stripped` fix option live in
   `docs/learnings/archive/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md` (verified: lesson
   frontmatter re-read at conversion). At the conversion base the recorded README pin (`recommended
   auxiliary plugin`) has exactly 2 case-insensitive hits, both structural and both surviving
   `strip_prose` — the lesson's 4-hit instance including a Status-blurb hit is a dated snapshot at the
   2026-08-05 land tip it names (verified: conversion grep census, 2026-08-06).
5. **Migration is green-by-construction at the conversion base** (verified: awk+grep census re-run at
   conversion, 2026-08-06, `6fff2ee`): the retired count phrases have 0 case-insensitive hits in the
   war-strategy SKILL; every candidate NEW-present twin retains its hits after `strip_prose` (README
   raw=2/stripped=2; CLAUDE.md, war-help, CONTEXT.md, and the machine SKILL 1/1 each); only `README.md`
   among the candidate surfaces carries a `## Status` or `## Changelog` heading, so stripping changes
   scanned bytes on README alone. **The full suite exits 0 at the base** (executed at conversion), and
   the expected post-change result is also exit 0 — no pin legitimately flips at this tree (D11).
6. **The gate consumes the suite's exit status only** (verified: `resolveGate` in
   `skills/war/assets/war-config.mjs` re-read at conversion — the discovery clause composes
   `bash "$f" || exit 1`; ok/not-ok text is display-only). This retires the spec §8 output-format
   assumption (see the ledger note).
7. **Cross-reference census:** no other suite pins this suite's bytes — the only repo references to
   `war-pipeline-structure` outside the file itself are comment-only mentions in
   `skills/red-team/diagnosis-preflight.test.sh` (names it as a text-scan precedent) and
   `skills/war-strategy/war-strategy-structure.test.sh` (notes rule 7 is pinned here) (verified:
   repo-wide grep for `war-pipeline-structure` at `6fff2ee` (2026-08-06)).
8. **Sibling observation:** `fm_lacks_key()` shares the vacuous-pass class — awk on a missing file
   emits nothing and the frontmatter-key absence check prints `ok` — but it reads through
   `frontmatter()`, not `strip_prose()`, sits outside every cited issue, and both of its target files
   carry loud `has()` pins; recorded as a non-goal, not silently widened into scope (verified: Read of
   `fm_lacks_key()`, `frontmatter()`, and their call-site pins at `6fff2ee` (2026-08-06)).

## Pivotal constraints

- **bash-3.2-safe, no mktemp, plain grep/awk** — the file's own top-comment convention; the suite is
  self-discovered by `resolveGate`'s `*.test.sh` sweep (referenced by name, never by suite enumeration),
  so zero gate, hook, or engine edits.
- **`set -u` only; never add `set -e`** — that would wholesale-change every helper's failure semantics;
  the existence guard is explicit and local (issue #1362's shape).
- **Exit contract preserved**: exit N = N failed assertions. Every new red path (missing file, broken
  `-i`, stripped-presence miss) increments `fails` and returns — never an early `exit`. The gate consumes
  exit status only (Context 6); existing ok/not-ok lines stay byte-unchanged anyway as belt-and-suspenders.
- **Case discipline preserved**: case-sensitivity stays reserved for flag/token literals that never
  re-case (the `has()`/`has_i()` header convention); retired PROSE absence goes `lacks_i`. The
  rename-loop `lacks()` call sites pin structural tokens (skill-dir names) and stay case-sensitive (A2).
- **Sweep hygiene**: every retired-phrase or re-cased fixture literal stays assembled at runtime from
  split fragments so the file never self-matches a repo-wide sweep, and no comment may restate the
  stripped-scan composition literally (`strip_prose` followed by a pipe or redirect) — a comment quoting
  it would fork End state 2's census (the coupling-comment-self-match class the file already documents).
- **Temp-break proof**: per the file's own convention, every new or altered assertion is proven to FAIL
  once against a mutated copy before commit, evidence in the commit-body Red-proof block.
- **Suite-flip honesty**: expected full-suite result is exit 0 at the base (measured at conversion) and
  exit 0 post-change (Context 5). Any pin that flips red under the new semantics — e.g. a twin whose
  literal survives only inside a `## Status` blurb at the rebased base — is a REAL instance of #1371's
  class caught live: stop-and-report, resolve by restoring the target section's wording, never by
  downgrading the pin back to `has_i` or silently adapting a count (D11).
- **One file, one task** (code-boundary rule 1): all four issues are one helper-refactor diff in
  `skills/war-machine/war-pipeline-structure.test.sh`; the lesson stamp is a second, file-disjoint file
  edit **inside the same task** — the spec's own "same change" wording, and the batch's stamp-honesty
  precedent (escape-guard D9): a stamp in a parallel dependency-free task can merge while the fix
  escalates, claiming a mitigation that never landed; folding costs zero parallelism.
- **Redaction lint stays green**: the lesson-description edit rides the fail-closed lint, which runs
  in-gate via its discovered shell-test wrapper (never an enumerated suite list).
- **Release discipline**: the version bump is its own trailing phase; version literals in this plan and
  the source spec are non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Predicate factoring | Stdin-reading inner pair beside `strip_prose()` — `_hit() { strip_prose \| grep -qF -e "$1"; }` and `_hit_i() { strip_prose \| grep -qiF -e "$1"; }` — whose sole delta is the `-i`; every stripped-scan helper wraps one of them via `< "$1"` | spec D1; (verified: issue #1310 fix proposal (2026-08-06)); the symmetric `_hit` is A1 |
| D2 | Existence guard | Hard-fail `[ -f "$1" ]` check inside every helper that reads its target through `strip_prose` (`lacks`, `lacks_i`, the new `has_i_stripped`): prints a distinct `not ok - <basename> MISSING FILE :: <literal>` line, increments `fails`, returns without grepping. `has()`/`has_i()` stay guardless — bare grep already exits 2 and reds them on a missing file. Shared tiny guard helper vs. inlined test is executor's latitude | spec D2; (verified: issue #1362 (2026-08-06)) |
| D3 | Count-flip migration | The `retired_count_a`/`retired_count_b` retirement asserts move `lacks()` → `lacks_i()`; green-by-construction (0 case-insensitive hits, re-measured at conversion) | spec D3; (verified: issue #1374 (2026-08-06); census 2026-08-06) |
| D4 | Control routing | The committed `-i` control's re-cased-fixture half pipes the fixture into `_hit_i` (stdin), so dropping the helper's `-i` reds a committed assertion; the plain-grep half pipes into `_hit`, binding the `-i` as the sole delta between the two inner predicates | spec D4; (verified: issue #1310 (2026-08-06)); second-half routing is A1 |
| D5 | Presence variant | New `has_i_stripped()` (the lesson's recorded name): existence guard + `_hit_i "$2" < "$1"`, presence polarity, ok/not-ok lines labeled `(case-insensitive, prose-stripped)`; opt-in per pin, never a wholesale `has_i` replacement | spec D5; (verified: issue #1371 and the lesson's fix option (b), 2026-08-06) |
| D6 | Pin migration scope | Exactly the NEW-present twins that pair with `lacks_i` old-absent pins on the same surface: the four gospel twins (README `recommended auxiliary plugin`, CLAUDE.md `one interview, one merged artifact`, war-help `one merged plan, decision record + phases in a single artifact`, CONTEXT `input shape`) plus the machine `author the merged plan` twin — five pins, all with ≥1 stripped hit at the conversion base | spec D6 (carried [assumed] scope → A3) |
| D7 | Committed controls | Two committed self-checks join the file's control precedent (the prose-exclusion and `-i` control blocks): (a) the guard fires on a nonexistent path — the helper invoked via command substitution so the probe's own `fails` increment dies in the subshell, then the captured output is asserted to carry the `MISSING FILE` marker; (b) the guard passes a real file (captured output carries the normal ok line, no marker). **Both controls invoke `lacks_i` specifically** — pinned, not executor latitude, so the probes can never perturb End state 5's `has_i_stripped` call-site count. Plus the D4-routed `-i` control | spec D7 (carried [assumed] house-convention basis → A4); probe-helper pin is a grill patch (F6), logged for /red-team |
| D8 | Fixture routing | The rename prose-exclusion self-check's two inline `printf \| strip_prose \| grep` pipelines also route through `_hit` (polarity per check unchanged: prose ignored / structural caught), leaving zero inline copies of the stripped-scan composition outside the two inner predicates | spec D8 (carried [assumed] hygiene default → A5) |
| D9 | Lesson stamp | `docs/learnings/archive/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md` `description:` frontmatter value gains a `MITIGATED (shell-pin-helpers/1.1, #1371): ` prefix — the batch's escape-guard stamp shape (fixing task + issue; no land-date token, which is unknowable at worker time); body, keywords, and relates untouched. The stamp travels **in the fixing task** (stamp honesty — see D10) | spec D9, stamp shape + placement per the escape-guard batch precedent (grill patch F10, logged for /red-team); (verified: repo resolved-lesson-stamp convention — description prefix, body stays present-tense) |
| D10 | Task decomposition | One task in Phase 1 — the helper-refactor diff (all four issues) plus the file-disjoint lesson stamp folded into it — and the standard trailing release phase. The fold is the batch's stamp-honesty precedent (escape-guard D9): a stamp in a parallel dependency-free task can merge while the fixing task escalates, leaving the lesson claiming a mitigation that never landed; folding removes the hazard with zero parallelism lost. No deps edges, and no drift guard is split from its fact (rule 7 not triggered — Note 1) | conversion judgment revised per grill patch F10, logged for /red-team; war-strategy §3 |
| D11 | Suite-flip protocol | Expected suite result: exit 0 at base (measured) and exit 0 post-change (census, Context 5). The worker re-runs the census at its rebased dispatch base BEFORE migrating — (a) the two retired count phrases case-insensitive in the war-strategy SKILL (expect 0), (b) the five twins' stripped-hit counts (expect ≥1 each), (c) the full suite (expect exit 0). A changed count is stop-and-report, never a silent adaptation; a twin at stripped=0 is #1371's class live — fix the target surface's section wording, never downgrade the pin | spec §8 staleness rule, sharpened at conversion |
| D12 | No unwired negative-reference helper | The structural-test blind-spot doctrine's unwired-negative-reference prescription is not invoked by this spec; the both-ways burden is carried by the committed controls instead — D7's fire/pass pair and D4's catch/miss pair are live negative references, and every altered assertion carries a temp-break Red-proof | conversion judgment (deviation from the drafter caution, reason in Note 2), logged for /red-team |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The symmetric `_hit` lands alongside `_hit_i` (D1), and the `-i` control's case-sensitive half routes through it (D4) | spec D1/D4 (carried [assumed] rows): default for a bindable case-sensitive half | only `_hit_i` lands and only the `-i` half binds the helper; A1-wrong entails A5's fallback (D8's case-sensitive fixtures cannot route through a helper that does not exist), so End state 2's census expectation becomes 5 dated sites — the `_hit_i` body plus four inline case-sensitive compositions (`lacks()`'s body, the control's case-sensitive half, and D8's two fixture pipelines) | ratify in /red-team |
| A2 | The rename-loop `lacks()` call sites pin structural tokens (skill-dir names) and stay case-sensitive | spec §2 (carried [assumed] row): matches the file's own recorded case-discipline | a two-line migration of that loop to `lacks_i` is additive and lands green — the tokens are absent in every casing | ratify in /red-team |
| A3 | Five-twin migration scope (D6) is the wanted boundary | spec D6 (carried [assumed] row): the twin-of-a-retirement class is the recorded degradation; most other presence pins legitimately accept a hit anywhere | a README-only migration still closes the lesson's concrete instance; a wider migration is future opt-in per pin | ratify in /red-team |
| A4 | Committed guard controls (D7) match the file's house convention | spec D7 (carried [assumed] row): the existing prose-exclusion and `-i` control blocks are the precedent | temp-break proof in the commit body alone covers #1362; the two control blocks are dropped | ratify in /red-team |
| A5 | Routing the prose-exclusion fixtures through `_hit` (D8) is wanted hygiene | spec D8 (carried [assumed] row): leaves zero inline composition copies | they stay inline — they pin `strip_prose` itself and were never the #1310 defect; End state 2's census expectation grows by 2 dated sites | ratify in /red-team |
| A6 | No sibling plan must LAND first; this group is the declared upstream of two sibling groups | spec §8 (empty dependency list; the survey manifest carries the machine hint). Conversion-time verification of the sibling spec texts at `6fff2ee`: `war-strategy-mirror-guards` declares "this spec depends on the shell-pin-helpers group's plan landing first" (its §8; it treats this suite as read-only validation and its constraints block names the exact pin substrings this suite holds over the machine SKILL); `adr-doc-truth-sweep` declares it lands after `war-strategy-mirror-guards`, `gate2-publication-guard`, AND `shell-pin-helpers` (its §2/§8 — its comment edit and count-word sweep touch this very suite) | landed out of order, the downstream groups validate against un-landed helper semantics or edit comments this refactor rewrites | roadmap: dependency-spine edges this plan → `war-strategy-mirror-guards` and this plan → `adr-doc-truth-sweep`, plus `## Shared-file contention` rows; /war-campaign's sweep contention check re-verifies |
| A7 | The green-by-construction census (Context 5) still holds at the task's rebased dispatch base | re-measured at the conversion base; checkpoints 1–3 are docs-only and the three predecessor plans' footprints do not touch this suite or the five twin surfaces' pinned sections (their shared README touch is the `## Status` release blurb — exactly the region `strip_prose` drops) | a changed count triggers D11's stop-and-report; a stripped=0 twin is a live #1371 finding to fix at the target surface | D11's mandated pre-migration census; backstop row |

Retired spec assumption (retired with a stated reason, per the conversion contract): spec §8's "the gate consumes the suite's exit status, not its
ok/not-ok text [assumed]" is **upgraded to code-verified** at conversion — `resolveGate` composes
`bash "$f" || exit 1` (Context 6). Its fallback (keep existing ok/not-ok lines byte-stable) is adopted
anyway as a constraint, so the assumption row is retired rather than carried.

## Non-goals / deferred

- **Sibling suite**: `skills/war-strategy/war-strategy-structure.test.sh` carries its own single-target
  `lacks_i` helper family (no `strip_prose`, hardcoded SKILL.md target) — out of this footprint; if the
  vacuous-pass class is later confirmed there, it is its own issue.
- **`fm_lacks_key()` existence guard** (Context 8): same vacuous-pass shape, different read path
  (`frontmatter()`, not `strip_prose()`), no recorded issue, loud `has()` pins on both its target files —
  out of scope; if confirmed as debt, its own issue (mirrors the sibling-suite non-goal).
- **Comment-leader stripping** stays out of the helpers — the file already records that it belongs to the
  hand-run land-time sweep.
- **No case-sensitive stripped presence variant** (`has_stripped`): no call site needs one today; add it
  the first time a case-stable token literal needs blurb-independent proof.
- **No wholesale `has_i` → `has_i_stripped` migration** beyond the five D6 twins: most presence pins
  legitimately accept a hit anywhere in the file.
- **Blurb-phrasing policy** (the lesson's fix option (a)) is not mandated — the stripped variant makes it
  unnecessary for migrated pins.
- **Sibling lesson stamps**: the lessons cited by issues #1362 and #1374/#1310 are outside this footprint;
  stamping them is left to the closing comments on those issues and routine memory housekeeping. Only the
  #1371 lesson (D9) is stamped here, because this plan lands its recorded fix option.

## New domain terms · Recommended ADRs

None. `_hit`/`_hit_i`/`has_i_stripped` are file-local helper names, not pipeline vocabulary (spec §6);
file-local test hardening extends conventions already recorded in-file and in the linked lessons — no
triad-passing decision (spec §7).

## Commander's Intent

- **Purpose:** the pipeline's structural pin suite can no longer lie in any of its four recorded ways — a
  deleted pinned surface reds every absence pin against it instead of passing vacuously; the `-i` in the
  case-insensitive absence path is bound by a committed assertion instead of an inline look-alike; a
  sentence-case revert of retired count prose is caught; and a NEW-present twin proves its target section
  landed the phrasing, immune to a README Status blurb quoting it — with the suite still green
  end-to-end, its exit-count contract intact, and the #1371 lesson stamped MITIGATED.
- **Method:** factor the stripped scan into the stdin-reading inner pair `_hit`/`_hit_i` (sole delta the
  `-i`) and compose every stripped-scan helper and committed fixture control from them; add a hard-fail
  `[ -f ]` existence guard with a distinct `MISSING FILE` not-ok inside the three strip_prose-reading
  helpers (never `set -e`, never an early exit — `fails` increments and the helper returns); migrate the
  two count-flip retirement asserts to `lacks_i`; add `has_i_stripped` and migrate exactly the five
  retirement-twin presence pins; commit the missing-file/real-file guard controls with
  subshell-isolated `fails`; rewrite the two stale helper comments the spec's survey found; stamp the
  lesson. All bash-3.2-safe, zero gate/hook/engine edits, every altered assertion temp-break-proven, the
  census re-run at the rebased dispatch base with stop-and-report on drift.
- **End state:**
  1. `lacks()`, `lacks_i()`, and `has_i_stripped()` each hard-fail on a missing target file with a
     distinct `MISSING FILE` not-ok naming the basename, incrementing `fails` and returning (exit-count
     contract exact); the two committed guard controls (fires on a nonexistent path, passes on a real
     file) are green with the probe's increment subshell-isolated ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh; echo $?` → `0` with both
     guard-control ok lines in the output; the scratch-rename red-proof is a backstop row.
  2. The stripped-scan composition (`strip_prose` piped or redirected) exists in exactly the two inner
     predicate bodies — helper bodies and both fixture control blocks compose `_hit`/`_hit_i`, zero
     inline copies ·
     check: `grep -Ec 'strip_prose *[|<]' skills/war-machine/war-pipeline-structure.test.sh` → `2`
     (dated expectation at conversion; re-count at the rebased base; A1/A5 shift it as their rows state).
     **Mandatory manual same-scope survey (grep is a floor):** hand-scan comments and printf labels for
     any restatement of the composition literal — none may exist (the coupling-comment class).
  3. The committed `-i` control binds the helper: its re-cased half pipes the fixture into `_hit_i` and
     its case-sensitive half into `_hit`, so deleting the `-i` from `_hit_i`'s body reds a committed
     assertion ·
     check: `grep -Fc -e '"$recased_fixture" | _hit_i "' skills/war-machine/war-pipeline-structure.test.sh`
     → `1` and `grep -Fc -e '"$recased_fixture" | _hit "' skills/war-machine/war-pipeline-structure.test.sh`
     → `1` (or the equivalent pipe-into-helper lines located by construct in the control block, if the
     worker's exact bytes differ); the sed-mutation red-proof is a backstop row.
  4. The count-flip retirement asserts are case-insensitive ·
     check: `grep -Fc -e 'lacks_i "$WAR_STRATEGY"' skills/war-machine/war-pipeline-structure.test.sh`
     → `2` and `grep -Fc -e 'lacks "$WAR_STRATEGY"' skills/war-machine/war-pipeline-structure.test.sh`
     → `0`.
  5. `has_i_stripped()` exists (guard + `_hit_i "$2" < "$1"`, `(case-insensitive, prose-stripped)`
     labels) and exactly the five D6 twin pins route through it, each still finding ≥1 stripped hit ·
     check: `grep -Fc -e 'has_i_stripped "' skills/war-machine/war-pipeline-structure.test.sh` → `5`
     call-site hits (dated expectation; re-count with the census at the rebased base; the D7 guard
     controls invoke `lacks_i` — pinned — so no probe adds a sixth hit) and the suite run of End
     state 1 green; the Status-blurb-only scratch-README red-proof is a backstop row.
  6. The spec-survey comment stragglers are resolved: the `lacks_i()` header no longer claims its body
     "mirrors lacks() exactly except the -i flag" and the `-i` control banner names `_hit_i` instead of
     "the case-insensitive composition lacks_i wraps"; survey items 3–5 (gospel-block comment, rename-loop
     case boundary, file-top exit-contract comment) re-verified still-true ·
     check: `grep -Fc -e 'body mirrors lacks()' skills/war-machine/war-pipeline-structure.test.sh`
     → `0` and `grep -Fc -e 'composition lacks_i wraps' skills/war-machine/war-pipeline-structure.test.sh`
     → `0`. (The retired sentence wraps across two comment lines at the base — "body mirrors lacks()" /
     "exactly except the -i flag" — so the check pins the single-line first half, the
     line-based-grep-vs-wrapped-phrase class the suite itself documents; both greps measured 1 at
     conversion, expect 0 post-rewrite.) **Mandatory manual same-scope survey (grep is a floor):** hand-scan the file's comments,
     block banners, and printf labels end-to-end at the rebased base; list each straggler beyond the
     spec's five as a survey-derived correction (backstop row).
  7. Suite-flip honesty: the suite exits 0 at the integrated tip, matching the measured base result —
     zero pin flips; any census drift at the rebased base was stop-and-reported per D11, never silently
     adapted ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh; echo $?` → `0`.
  8. The #1371 lesson description opens with the MITIGATED prefix in the escape-guard stamp shape ·
     check: `grep -Fc -e 'MITIGATED (shell-pin-helpers/1.1, #1371' docs/learnings/archive/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md`
     → `1` (the stamp convention deliberately leaves the body present-tense — hand-verify the diff stays
     description-only).
  9. The full gates are green at the integrated tip, the redaction lint included ·
     gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
     'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop (this suite and the
     war-memory lint wrapper are discovered members) both exit 0.
  10. The landing commit cites all four issues — #1362, #1310 (the Lead-comment-mandated own-change
      citation), #1374, and #1371 — and its body carries the Red-proof block enumerating the four
      mutation proofs (backstop rows 1–4) ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat).
  11. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha — the suite cannot fail on a wholly absent release).

## Build order (for /war)

Phase 1 (Task 1.1 alone) → Phase 2 (release).

No deps edges anywhere: one task owns the whole phase (the file-disjoint lesson stamp is folded into it
for stamp honesty — D10), no drift guard is split from its fact (rule 7 not triggered — Note 1), and
every construct the task edits exists at the frozen phase base.

## Phase 1 — Helper refactor + lesson stamp

### Task 1.1: The helper-refactor diff + lesson stamp (#1362, #1310, #1374, #1371)

- Files: `skills/war-machine/war-pipeline-structure.test.sh`, `docs/learnings/archive/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md`
- Plan slice: **Pre-flight census (D11)** — at the rebased dispatch base, re-run and record in the done
  report: (a) `grep -ciF` of `two authoring rules` and `two drift-guard rules` in
  `skills/war-strategy/SKILL.md` (expect 0 each); (b) the five D6 twins' post-`strip_prose` hit counts
  (expect ≥1 each: README `recommended auxiliary plugin`, CLAUDE.md `one interview, one merged artifact`,
  war-help `one merged plan, decision record + phases in a single artifact`, CONTEXT `input shape`,
  machine SKILL `author the merged plan`); (c) the full suite (expect exit 0). Any drift is
  stop-and-report — a stripped=0 twin is #1371's class live: fix the target surface's section wording,
  never downgrade the pin. **Inner predicates (D1)** — add the stdin-reading pair beside `strip_prose()`:
  `_hit() { strip_prose | grep -qF -e "$1"; }` and `_hit_i() { strip_prose | grep -qiF -e "$1"; }`, sole
  delta the `-i`, with a header comment that describes without restating the composition literal (sweep
  hygiene). **Existence guard (D2)** — `lacks()`, `lacks_i()`, and the new `has_i_stripped()` each check
  `[ -f "$1" ]` before scanning; on failure print one
  `not ok - <basename> MISSING FILE :: <literal>` line, increment `fails`, return (never `exit`, never
  `set -e`); `has()`/`has_i()` stay guardless. **Helper rewrites (D1/D5)** — `lacks()` → guard +
  `! _hit "$2" < "$1"`; `lacks_i()` → guard + `! _hit_i "$2" < "$1"` (their existing ok/not-ok lines
  byte-unchanged); `has_i_stripped()` added with guard + `_hit_i "$2" < "$1"`, presence polarity,
  `(case-insensitive, prose-stripped)` labels. **Call-site migrations (D3/D4/D6/D8)** — the
  `retired_count_a`/`retired_count_b` + `rules` asserts move `lacks` → `lacks_i`; the `-i` control's
  re-cased half becomes `printf '%s\n' "$recased_fixture" | _hit_i "$retired_grill_a $retired_grill_b"`
  and its case-sensitive half the `_hit` twin (fixture fragments stay split); the rename prose-exclusion
  self-check's two fixture pipelines route through `_hit`, polarity unchanged (prose ignored /
  structural caught); the five D6 twin pins migrate `has_i` → `has_i_stripped`. **Committed guard
  controls (D7)** — both controls invoke `lacks_i` specifically (pinned — the probe helper is not
  executor latitude, so the controls never perturb End state 5's `has_i_stripped` call-site count):
  (a) invoke `lacks_i` against a nonexistent path via command substitution (the probe's `fails`
  increment dies in the subshell) and assert the captured output carries the `MISSING FILE` marker;
  (b) invoke `lacks_i` against a real file and assert the marker is absent / the normal ok line
  present; both bash-3.2 `case`-pattern asserts, each incrementing the real `fails` on failure.
  **Comment currency (spec §4d)** — rewrite the `lacks_i()` header sentence ("body mirrors lacks()
  exactly except the -i flag" — false post-refactor) to name the inner predicate; update the `-i`
  control banner to name `_hit_i`; re-verify items 3–5 (the gospel-block "lacks_i() inherits
  strip_prose" claim — still true via `_hit_i`; the rename-loop structural-token case boundary — stays
  `lacks()`, A2; the file-top exit-contract comment — still true, the guard's red counts as a failed
  assertion); run End state 6's mandatory manual survey end-to-end and list stragglers. **Temp-break
  proofs** — prove each altered-assertion family red once against a mutated copy and enumerate all four
  in the commit-body Red-proof block: (1) a scanned surface renamed away in a scratch copy → `MISSING
  FILE` not-ok, nonzero exit; (2) `sed 's/grep -qiF/grep -qF/'` on `_hit_i` in a scratch copy → the `-i`
  control reds; (3) a sentence-cased revert of a retired count phrase appended to a scratch war-strategy
  SKILL copy (scratch suite copy pointing at it) → the migrated asserts red; (4) a scratch README
  carrying `recommended auxiliary plugin` solely under `## Status` → the `has_i_stripped` pin reds.
  **Lesson stamp (D9)** — prefix the `description:` frontmatter value of
  `docs/learnings/archive/gospel-new-present-pin-self-satisfied-by-status-blurb-prose.md` with
  `MITIGATED (shell-pin-helpers/1.1, #1371): ` (the escape-guard stamp shape — fixing task + issue, no
  land-date token); body, `metadata.keywords`, and every other frontmatter key byte-untouched (the
  repo's resolved-lesson-stamp convention deliberately leaves the body present-tense); the redaction
  lint (a discovered gate member) must stay green.
  Commits cite #1362, #1310, #1374, #1371.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap is
  non-authoritative). Expected integration base: the tip after whichever 2026-08-06 campaign
  predecessors the roadmap sequences ahead of this plan (ADR 0011 stack-and-plow) — no predecessor
  **must** land first for this plan's correctness (A6: empty upstream list; this group is itself the
  declared upstream of `war-strategy-mirror-guards` and `adr-doc-truth-sweep`, which land after), so if
  this plan launches first the base is the master tip at campaign launch. Standalone fallback: run
  through plain `/war`, resolve the next free patch from the four slots themselves. The Status blurb
  names the absence-pin existence guard, the bound `-i` inner predicates, the case-insensitive
  count-flip retirements, and the prose-stripped presence variant `has_i_stripped` — quoting only
  identifiers that exist in the landed diff (release-blurb lessons: count words match the enumeration;
  quoted literals byte-match landed identifiers; guard semantics stated no wider than the
  implementation — the guard reds absence/stripped-presence pins whose target file is missing, it does
  not police deletions repo-wide). The blurb necessarily narrates this suite's own hardening: it lives
  in the `## Status` section `strip_prose` drops, and the migrated presence pins no longer read it —
  self-consistent by construction, no fragment-splitting needed in README prose.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Red-proof 1 (End state 1, #1362): rename a `lacks_i`-scanned surface away in a scratch copy → the
  suite exits nonzero with a `MISSING FILE` not-ok naming that basename, never a vacuous `ok - … lacks` ·
  why deferred: a delete-and-trace mutation run is uncommittable by design; the committed guard controls
  (D7) are the standing non-vacuity guard · runner: Task 1.1's worker runs it in a scratch copy and
  records it in the commit-body Red-proof block; gate-audit reads it SOFT.
- Red-proof 2 (End state 3, #1310): `sed 's/grep -qiF/grep -qF/'` on `_hit_i` in a scratch copy → the
  committed `-i` control reds, nonzero exit · why deferred / runner: same shape as Red-proof 1.
- Red-proof 3 (End state 4, #1374): a sentence-cased revert of the retired count pair appended to a
  scratch war-strategy SKILL copy (suite copy pointed at it) → the migrated asserts red with the
  case-insensitive UNEXPECTEDLY-has not-ok · why deferred / runner: same shape.
- Red-proof 4 (End state 5, #1371): a scratch README carrying `recommended auxiliary plugin` solely
  inside `## Status` → the `has_i_stripped` pin reds with the prose-stripped MISSING not-ok · why
  deferred / runner: same shape.
- The mandatory manual same-scope surveys of End states 2 and 6 (comments, banners, printf labels —
  composition restatements and comment stragglers) · why deferred: a hand-scan cannot be a mechanical
  gate member; done-report-only evidence, which gate-audit reads as SOFT and never a hold · runner:
  Task 1.1's worker records the outcome (mandatory statement even when zero stragglers); the auditor
  re-runs the same-scope hand-scan at the pinned `audit_sha` rather than trusting this plan's snapshot
  (spec §8's comment-lag instruction); the Lead re-runs End states 2–6's greps at phase close.
- The D11 pre-flight census at the rebased dispatch base (retired-phrase hits, five twins' stripped
  counts, full-suite exit) with stop-and-report on drift · why deferred: conversion-time counts are
  dated snapshots at `6fff2ee`; the binding measurement is at the task's real base · runner: Task 1.1's
  worker, pre-migration, recorded in the done report; A7 carries the blast radius.

## Notes / conscious deviations

1. **Rule 7 (guard-split deps-edge) is not triggered.** Every mechanical guard this plan authors travels
   in the same task and file as the fact it guards — the helper refactor, its committed controls, and
   every migrated call site are one diff in one file. The folded lesson stamp is not a guard
   (frontmatter prose naming the fixing task and issue). Phase 1 is a single dependency-free task.
2. **No unwired negative-reference helper (D12)** — a knowing deviation from the drafter-caution's
   blind-spot-doctrine pointer, with reason: the spec nowhere requests one, and this refactor's
   both-ways burden is already carried by live committed controls — D7's fire/pass guard pair and the
   D4-routed catch/miss `-i` pair are wired negative references (each proves its helper CAN fail), and
   backstop rows 1–4 carry the mutation proofs. Adding an unwired helper the file never calls would be
   unrequested scaffolding. Logged for /red-team ratification.
3. **The suite is itself a structural-pin suite over live doc surfaces** — the flip-honesty protocol
   (D11) is therefore load-bearing, not ceremony: the five twin migrations change what bytes those pins
   scan (README alone today, Context 5), and the count-flip migration widens what casings two absence
   pins catch. Both are census-green at the conversion base; the worker's pre-flight re-census at the
   rebased base is the guard against a predecessor blurb or reword having moved the ground.
4. **Posterity survivors.** Historical artifacts keep the retired wordings and are never retro-edited:
   the source spec, issues #1310/#1362/#1371/#1374's verbatim quotes, and the cited lesson bodies all
   carry "body mirrors lacks() exactly", the inline-pipeline description, and the old capture claims.
   Every OLD-absent check here (End state 6) is scoped to the single live suite file; the lesson stamp
   (D9) touches description frontmatter only.
5. **Contention honesty / downstream spine (A6).** This plan has no upstream predecessor in the
   2026-08-06 batch. Two sibling groups declare it upstream, verified in their spec texts at conversion:
   `war-strategy-mirror-guards` (dependsOn — it validates its reworded machine-SKILL prose against this
   suite *as landed* and treats the suite as read-only), and `adr-doc-truth-sweep` (lands-after — its
   comment edit and count-word sweep touch this very file, so it must see the refactored helper comments,
   not the pre-refactor ones). The roadmap must carry this plan → those two as dependency-spine edges
   plus `## Shared-file contention` rows (`skills/war-machine/war-pipeline-structure.test.sh` ↔
   `adr-doc-truth-sweep`; `skills/war-machine/SKILL.md` phrasing ↔ `war-strategy-mirror-guards`,
   read-side). The three committed predecessor plans (red-team-gate-cli, escape-guard-exit-contract,
   done-when-floor-wiring) touch none of this plan's footprint; the trailing release-slot overlap with
   every sibling plan is the sanctioned stacked-release pattern, not contention.
6. **No cross-suite pin risk** (Context 7): the only external references to this suite are comment-only
   mentions in two sibling suites — nothing pins its bytes, so the refactor cannot flip a foreign test.
7. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the code-verified lesson issues #1362/#1371 and the war-followup issues
   #1310/#1374; the spec's flagged [assumed] rows are carried as A1–A5 with their fallbacks intact;
   conversion-time judgments (D10–D12, A6–A7, Notes 1–2) are logged for /red-team ratification.
8. **Grill-directed patches (2026-08-12 volley), applied in place:** the D7 probe-helper pin (F6 —
   `lacks_i` chosen over scoping End state 5's grep, keeping the whole-file count meaningful); the
   lesson-stamp fold into Task 1.1 plus the escape-guard stamp shape (F10 — stamp honesty, no land-date
   token); the A1 blast-radius census arithmetic corrected to 5 sites with the A5 entailment (F13); and
   evidence-tag hygiene on Context 7/8 and the retired-assumption label (F9). The grill's execution run
   otherwise held the plan: all four defects reproduced, a full mock refactor built from Part 1 alone
   ran green with all four Red-proof mutations redding.

## Open decisions

None. The spec's design tree is fully resolved; the spec-flagged [assumed] rows are carried as A1–A5
with fallbacks, and every conversion-time judgment is logged above for /red-team.
