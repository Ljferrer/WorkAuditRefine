# ADR & comment doc-truth sweep + README Status retro-compression and CHANGELOG introduction

Issues: #1363, #1305, #1266, #1290, #1291, #1292, #1253, #1330, #1317

## 1. Context — the gap / problem

Nine small, independent doc/comment currency defects, best landed as one sweep. Every claim below was
re-verified against the live tree at base `6fff2ee` (2026-08-06); counts are dated snapshots at that base
and must be re-measured at the task's rebased base (D12).

**ADR 0030 undercounts its own convention block** (verified: issue #1363 (2026-08-06); verified: issue
#1305 (2026-08-06)). `skills/war-strategy/SKILL.md` §2's "Reference the live artifact" block now carries
**eight** bullets — the eighth is `**Dated snapshots (D12 staleness rule)**` — but
`docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`'s Decision section enumerates seven forms
(no Dated-snapshots member) and its Consequences bullet still says "six rules + the
defined-but-not-yet-emitted annotation". Re-verified live: no `dated`/`snapshot` token appears anywhere in
the ADR, which is why the staleness is invisible to a name-grep. Issues #1363 and #1305 are the same
defect filed from two runs; #1305 offers two close routes (record D12 in ADR 0044's decision scope, or
amend ADR 0030). Re-verified live: ADR 0044 mentions D12 only as embedded prose inside its evidence-tag
material, never as convention-block attribution — so ADR 0030, the block's owner, is the right home.

**Two ADR bullets became false code-facts** (verified: issue #1266 (2026-08-06)). (1) ADR 0033's
Consequences still records the ref-diff as unbuilt ("`ponytail:` a full ref-diff snapshot is the named
upgrade path, built only if a second escape slips the pattern") and calls the porcelain half unqualified
"exact" — but `skills/red-team/assets/assert-no-repo-escape.sh` now ships a `--baseline` mode whose own
header documents check (c) as "the exact ref-diff", and qualifies the porcelain half as exact only "for
tracked and untracked-but-not-ignored paths". Re-verified live in the guard's header comment. (2) ADR
0025's Consequences bullet (construct: the `CONTEXT.md` gains-a-subsection bullet) freezes the
`### Drift-guard discipline` glossary at "five terms"; the live `CONTEXT.md` subsection defines **six** —
the sixth, **Guard-split deps edge**, being the very term ADR 0025's own Amendment (2026-08-02) forced.
Re-verified live: the subsection's bold term list is six members.

**ADR 0008 carries a rotted line-anchored citation and a mis-named construct pointer** (verified: issue
#1290 (2026-08-06)). The Context paragraph still cites `` [`design.md:58-62`](...#L58) `` — the exact
line-anchored form the repo's anchor-by-construct rule forbids, missed by the earlier whole-file pointer
scan (a grep-is-a-floor miss: the scan caught the `SKILL.md`-shaped pointers, not the `design.md`-shaped
one). And Decision sub-point 1's re-anchored pointer cites `skills/war/SKILL.md` § "Invariants (never
violate)", "the push-first-CAS clause" — re-verified live: that section's invariant bullet says "never
`--force`/`reset --hard` on shared branches" and contains no "push-first" wording (push-first-CAS prose
lives in Setup step 6, the Land steps, and `skills/war/references/design.md` § "6. State & resume"). The
re-anchor names a construct absent from the section it cites.

**`stage-workflow.mjs`'s `ARGS_FALLBACK_ANCHOR` comment invites the inverted reading** (verified: issue
#1291 (2026-08-06)). ADR 0037's Correction (2026-08-02, #1240) fixed the direction: the `const A =`
ternary's args-fallback tail in `workflow-template.js` is the **canonical source**; `ARGS_FALLBACK_ANCHOR`
in `skills/war/assets/stage-workflow.mjs` is the **hand-maintained mirror site**. Re-verified live: the
`ARGS_FALLBACK_ANCHOR` comment block still says "this is the single authoritative copy" with no
canonical-source sentence, while its `NAME_ANCHOR`/`DESCRIPTION_ANCHOR` sibling comment carries an
explicit "Canonical source of the bytes: the `export const meta` block ... of workflow-template.js"
sentence. Out-of-Files by construction for the originating phase, hence correctly routed here.

**Tour step 14 carries a rotted advisory line number** (verified: issue #1292 (2026-08-06)).
`.tours/architect-war-system.tour` step 14 describes the `..`-traversal guard in
`hooks/validate-worktree-scope.sh` as "(line ≈49)"; re-verified live: the guard's comment block begins at
line 51 and its portable case pattern spans lines ≈61-76 (dated snapshot at base `6fff2ee`). The
description already names the construct, so the residual work is re-deriving the advisory number. The
issue is deliberately the work-list for the standing tour-narrative sweep, not an absorbed fix.

**C11/H5 rationale comments state the opposite of the code trace** (verified: issue #1253 (2026-08-06)).
In `hooks/validate-auditor-git.test.sh`, the C11 rationale comment (construct: the comment block above the
`expect_deny "C11: ..."` call) and the H5 comment (above `expect_deny "H5: ..."`) both claim a
printf-corrupted payload would make "the deny ... VACUOUS" via the non-auditor `*) exit 0` pass-through.
Re-verified live: both cases use `expect_deny`, whose definition requires exit 2 **and** a `WAR:` stderr
marker — a pass-through exit 0 with empty stderr fails loud at authoring time. C11 inherited the wording
from H5 (donor-prompt-latent-omission class); both cite the archived memory
`printf-json-escaping-vacuous-test-case`, whose body describes a genuinely vacuous case (an
exit-0-asserting allow test) but over-generalizes with "Every such test is silently vacuous for inputs in
that character class" — false for deny-asserting cases. Re-verified live in
`docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`.

**README `## Status` retro-compression + CHANGELOG introduction** (verified: issue #1330 (2026-08-06)).
The forward half is done — the live `## Status` is the short bulleted 0.17.0 blurb. The backward half is
untouched, re-verified live: `CHANGELOG.md` does not exist and no recorded decline exists; the 0.15.x and
0.16.0 long blurbs live only in git history with no relocated home; the seven-item Status-blurb authoring
checklist stands unre-evaluated. The binding constraints all hold live: `**<version>**` is the first bold
token after the `## Status` heading (extracted by construct in
`skills/war/assets/version-slots.test.mjs`, which also rides the monotonic floor on it); the
`### Status-blurb authoring checklist` heading and its provenance anchor are locked by the same test; the
`## Releasing` table row naming `README.md` → "the `## Status` line/paragraph" is guarded prose; and
`strip_prose()` in `skills/war-machine/war-pipeline-structure.test.sh` drops `## Status`/`## Changelog`
*sections* — a new `CHANGELOG.md` *file* is a different surface whose guard interaction must be resolved.
Re-verified live: the absence helpers `lacks()`/`lacks_i()` scan an **explicitly enumerated** file list
(never a repo-root recursive grep), and `CHANGELOG.md` is not in any of those lists — so relocated blurbs
trip nothing today; the resolution just needs recording so the next reader does not re-derive it.

**The 0.16.0 work-scope/release-scope conflation needs a durable guard** (verified: issue #1317
(2026-08-06)). The 0.16.0 blurb's unscoped "zero `/war` engine change" claim was true of the plan's work
and false of the release window (12 engine-path files shipped from unbumped PRs #1280/#1294); it shipped
to consumers unedited and the surface is now gone from the live README. The durable ask — a checklist item
distinguishing work-scope from release-scope claims — is absent from the live seven-item checklist
(re-verified: no item mentions release windows or unbumped predecessor landings). The retro-located
0.16.0 entry in `CHANGELOG.md` is also the natural place to finally correct the claim in the historical
record.

## 2. Pivotal constraints

- **ADRs are append-only.** The repair channel for a stale ratified bullet is a dated
  amendment/correction note (the shape of ADR 0037's "Correction (2026-08-02, #1240)" note), never an
  edit of the ratified bullet's bytes. Exception, both recorded in `docs/learnings/`: the Status currency
  header line may be updated, and **pointer/citation currency repairs are in-place edits** — the landed
  precedent is the phase-close polish that re-anchored two ADR 0008 `SKILL.md` pointers in place
  (verified: issue #1290 (2026-08-06)).
- **`version-slots.test.mjs` is the arbiter for every README release-surface edit**: `**<version>**`
  stays the first bold token after the `## Status` heading; the `### Status-blurb authoring checklist`
  heading and its provenance-slug anchor bullet must survive; the `## Releasing` table row naming
  `README.md` → "the `## Status` line/paragraph" is guarded prose (verified: issue #1330 (2026-08-06)).
- **No `docs/specs/` citation anywhere in README** (ADR 0046) — `CHANGELOG.md` entries must respect the
  same rule since README links to it [assumed: extend the ADR 0046 README rule to the file README links
  as its changelog — if wrong: the guard's pinned corpus does not cover CHANGELOG.md and a spec-path
  citation there is merely un-scanned, not forbidden; a Lead can relax this at plan conversion].
- **`strip_prose()` semantics must not change.** The `## Status`/`## Changelog` section-drop and the
  enumerated-list absence scans in `skills/war-machine/war-pipeline-structure.test.sh` stay
  byte-compatible; this sweep only *records* the CHANGELOG.md interaction resolution.
- **Comment-only code edits.** The `stage-workflow.mjs` and `validate-auditor-git.test.sh` changes touch
  comments only — zero behavior change; every discovered suite must stay green (gate discovery via
  `resolveGate` in `war-config.mjs`, never an enumerated suite list).
- **The tour file is JSON** — edits must leave `.tours/architect-war-system.tour` machine-valid, and the
  construct name stays primary with the line number advisory (`≈` hedge kept).
- **Redaction-lint clean**: the archived-memory edit must pass the fail-closed redaction lint.
- **Ordering**: this group lands **after** sibling groups `war-strategy-mirror-guards`,
  `gate2-publication-guard`, and `shell-pin-helpers` (file contention; see §8).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #1363/#1305 close route: ADR 0044 decision-scope note vs ADR 0030 amendment | **Amend ADR 0030** — it owns the convention block; ADR 0044's D12 mention is embedded prose, not attribution (verified: issue #1305 (2026-08-06)) |
| ADR 0030 count line: add "eighth" member count vs restate as invariant | **Restate as invariant** in the amendment note — the block's membership is owned by the live `skills/war-strategy/SKILL.md` §2 block; any member count in the ADR is a dated snapshot. The note also enumerates the Dated-snapshots (D12) form so a name-grep finds it |
| ADR 0033 / ADR 0025 repair channel | Dated correction note appended per ADR (ADR 0037 Correction-note shape); ratified bullets stay byte-unchanged |
| ADR 0008 `design.md:58-62` re-anchor target | `skills/war/references/design.md` § "6. State & resume" (the "One authority, two durable advisory records" block) — the construct that carries the three-layer material; in-place citation edit |
| ADR 0008 push-first-CAS pointer | Re-name to the construct that exists: the § "Invariants (never violate)" bullet's own wording (the never-`--force`/`reset --hard`-on-shared-branches clause); the push-first-CAS *mechanism* citation points at `design.md` § "6. State & resume" |
| `ARGS_FALLBACK_ANCHOR` comment | Add the canonical-source sentence mirroring the meta-anchor sibling's shape — canonical: the `const A =` ternary's args-fallback tail in `workflow-template.js`; mirror: `ARGS_FALLBACK_ANCHOR` — scope the "single authoritative copy" phrase to what it means (the single in-suite anchor constant the test imports), and cite ADR 0037's Correction (2026-08-02, #1240) note |
| Tour step 14 | Re-derive the advisory number against the rebased base (≈51 at base `6fff2ee`); keep the `≈` hedge and construct-name primacy; then run the tour-narrative sweep over all steps |
| C11/H5 comments | Both sites in **one task**: replace the VACUOUS claim with the true trace — pass-through exit 0 + empty stderr makes `expect_deny` (exit 2 + `WAR:` marker required) fail loud at authoring time |
| Archived memory `printf-json-escaping-vacuous-test-case` | Append a dated scope note: the vacuity claim holds only where the assertion is satisfied by the bail-out outcome (exit-0-asserting allow cases); deny-asserting cases fail loud. Body otherwise untouched (the RESOLVED-stamp convention: notes append, bodies stay) |
| CHANGELOG.md shape | New top-level `CHANGELOG.md`: H1 + reverse-chronological `## <semver> — <date>` sections; historical blurbs (0.15.0, 0.15.1, 0.16.0, 0.17.0) relocated from git history, lightly compressed to the short shape |
| 0.16.0 entry truth | The relocated 0.16.0 entry carries the scope correction: the zero-engine-change claim scoped to the plan's work, with a note that the release window shipped engine-path files from unbumped PRs #1280/#1294 (verified: issue #1317 (2026-08-06)) |
| `## Status` ↔ CHANGELOG link | `## Status` keeps the short current-release blurb and gains one line linking `CHANGELOG.md` for history; the bold semver token stays first |
| CHANGELOG as a version slot? | **No** — `CHANGELOG.md` is not a fifth release slot; `version-slots.test.mjs` gains no CHANGELOG assertion [assumed: keeping release friction flat — if wrong: a stale CHANGELOG head entry ships silently until the next doc sweep] |
| Checklist re-evaluation (#1330 scope 3) | **Keep all seven items** — each polices a semantic overclaim class the short shape can still commit — and **insert one new item** distinguishing work-scope from release-scope claims (the #1317 durable ask), placed before the Provenance item so "Every item above" stays true; the provenance anchor bullet survives verbatim |
| strip_prose × CHANGELOG.md | **No guard change.** The absence scans read an explicitly enumerated file list that excludes `CHANGELOG.md`; record that resolution in one sentence beside the `strip_prose()` comment block so it is never re-derived (verified: issue #1330 (2026-08-06)) |
| Version bump | None in this sweep — doc/comment-only; the next release's bump carries it [assumed: no marketplace-visible behavior changes — if wrong: a release phase is appended at plan conversion, next free patch above the live base] |

## 4. Mechanics

**ADR amendments (append-only notes).**
- `docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`: append a dated amendment note recording
  that the live convention block gained the **Dated snapshots (D12 staleness rule)** form, and restating
  the Consequences member count as an invariant (membership owned by the live SKILL.md block; counts here
  are dated snapshots). Pre-existing body bytes unchanged.
- `docs/adr/0033-executed-probes-behind-escape-guard.md`: append a dated correction note — the ref-diff
  upgrade path **was built** (`assert-no-repo-escape.sh` `--baseline` mode; check (c) is the exact
  ref-diff scoped to heads+tags), and the porcelain half is exact only for tracked and
  untracked-but-not-ignored paths, per the guard's own header.
- `docs/adr/0025-drift-guard-discipline.md`: append a dated correction note — the `CONTEXT.md`
  `### Drift-guard discipline` subsection now defines **six** terms, the sixth (**Guard-split deps
  edge**) forced by this ADR's own 2026-08-02 amendment; restate the count as owned by the live
  subsection.
- `docs/adr/0044-authoring-contract-and-merged-artifact.md` is **read-only reference** for the amendment
  wording (D12's home contract); it is edited only if plan conversion finds its D12 prose contradicts the
  ADR 0030 note [assumed: it does not — if wrong: a one-line cross-reference is added in the same task].

**ADR 0008 pointer repair (in-place citation edits).**
In `docs/adr/0008-git-is-the-resume-source-of-truth.md`: replace the Context paragraph's
`` [`design.md:58-62`](...#L58) `` citation with a construct-anchored link to
`skills/war/references/design.md` § "6. State & resume"; fix Decision sub-point 1's pointer so the named
construct exists (see §3). Then the mandatory survey: grep the ADR for `#L[0-9]` and `\.md:[0-9]+-[0-9]+`
patterns is the **floor** — after the grep, hand-read every link and section citation in the file
end-to-end and list each remaining rotted or mis-named pointer as a survey-derived correction.

**`stage-workflow.mjs` comment.**
In the comment block above `export const ARGS_FALLBACK_ANCHOR`: add the canonical-source sentence
(canonical: the `const A =` ternary's args-fallback tail in `workflow-template.js`; this constant: the
hand-maintained mirror the imported-constant anchor guard arbitrates), scope the "single authoritative
copy" phrase, cite ADR 0037's Correction note. No constant, export, or behavior change;
`stage-workflow.test.mjs` (discovered by `resolveGate`) stays the arbiter.

**Tour re-derivation.**
Fix step 14's "(line ≈49)" to the re-measured value at the task's rebased base (≈51 at base `6fff2ee`).
Then the tour-narrative sweep this issue is the work-list for: grep the tour for `line ≈` and inline
line-number mentions is the **floor** — after the grep, hand-check every step's `file`/`line` field and
description narrative against the live target files, and list each rotted anchor or false code-fact as a
survey-derived correction. The file must re-parse as JSON after editing.

**Auditor-guard test comments + archived memory.**
One task fixes both `hooks/validate-auditor-git.test.sh` sites (C11 and H5 rationale comments) with the
fail-loud trace, and appends the dated scope note to
`docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`. A grep for `VACUOUS` in the suite is
the **floor** — after the grep, hand-scan the suite's same-scope case titles and rationale comments (the
C-block and H-block families) for any sibling that repeats the inherited claim in other words, and list
stragglers as survey-derived corrections. The suite must stay green.

**README retro-compression + CHANGELOG.**
- Create `CHANGELOG.md` (H1 + reverse-chronological `## <semver> — <date>` sections) from the historical
  `## Status` blurbs recovered via git history; compress each to the short shape; the 0.16.0 entry
  carries the work-scope/release-scope correction with the two unbumped source PRs named.
- `README.md`: `## Status` keeps the current short blurb, bold semver first, and gains one link line to
  `CHANGELOG.md`; insert the new checklist item ("Work scope is not release scope — a claim about what
  *this plan's work* touched must not read as a claim about the *release window*; a window that absorbed
  unbumped landings names them or scopes the sentence") before the Provenance item, renumbering so the
  provenance anchor bullet stays last and verbatim.
- `skills/war-machine/war-pipeline-structure.test.sh`: add the one-sentence resolution comment beside
  `strip_prose()` (CHANGELOG.md is outside the enumerated absence-scan lists by design; a future guard
  that enumerates it must decide its own strip rule). Comment-only.
- `skills/war/assets/version-slots.test.mjs`: expected **unchanged**; it is in the footprint as the
  arbiter that must stay green, and as the fallback home if the checklist insertion disturbs a pin
  [assumed: the insertion preserves heading + anchor so no test edit is needed — if wrong: the lock's
  fixture is updated in the same task, never weakened].
- Sweep the doc surfaces for stale checklist-count words: grep for `seven-item` (and the spelled
  `seven item`) across `README.md`, `CLAUDE.md`, `CONTEXT.md`, `skills/` docs is the **floor** — after
  the grep, hand-scan each hit file's same-scope headings and comments for paraphrased count claims
  ("the seven checks", "all seven") and list stragglers as survey-derived corrections.

## 5. Surface changes

- `docs/adr/0030-live-artifacts-over-stack-fragile-literals.md` — dated amendment note appended
- `docs/adr/0033-executed-probes-behind-escape-guard.md` — dated correction note appended
- `docs/adr/0025-drift-guard-discipline.md` — dated correction note appended
- `docs/adr/0008-git-is-the-resume-source-of-truth.md` — two in-place citation repairs + pointer survey
- `docs/adr/0044-authoring-contract-and-merged-artifact.md` — read-only reference (edited only on the §4 contingency)
- `skills/war/references/design.md` — read-only re-anchor target (no edit expected)
- `skills/war/assets/stage-workflow.mjs` — comment-only edit at `ARGS_FALLBACK_ANCHOR`
- `.tours/architect-war-system.tour` — step 14 advisory number + sweep-derived corrections
- `hooks/validate-auditor-git.test.sh` — comment-only edits at C11 and H5
- `docs/learnings/archive/printf-json-escaping-vacuous-test-case.md` — dated scope note appended
- `README.md` — `## Status` link line; checklist item inserted
- `CHANGELOG.md` — new file
- `skills/war/assets/version-slots.test.mjs` — expected unchanged (arbiter; contingency home)
- `skills/war-machine/war-pipeline-structure.test.sh` — one-sentence comment beside `strip_prose()`

## 6. New domain terms (CONTEXT.md)

None. "Changelog" and "retro-compression" are ordinary-language; no CONTEXT.md entry is warranted
[assumed: no downstream surface needs a ratified term — if wrong: add a one-line glossary entry at plan
conversion].

## 7. Recommended ADRs

None new. All ADR-side work is dated amendment/correction notes through the established append-only
channel (ADR 0037's Correction-note precedent). The CHANGELOG introduction is recorded by this spec, the
correcting commit bodies, and the `strip_prose()` comment — not an ADR [assumed: a changelog file is
housekeeping, not a binding architectural decision — if wrong: a short ADR is drafted at plan
conversion].

## 8. Open risks / implementation notes

- **Ordering (machine hint mirrored in the survey manifest):** this group depends on sibling groups
  `war-strategy-mirror-guards`, `gate2-publication-guard`, and `shell-pin-helpers` landing first — file
  contention on `skills/war-strategy/SKILL.md`-adjacent guard suites, the Gate-2 publication surfaces,
  and the shared shell pin helpers in `skills/war-machine/war-pipeline-structure.test.sh` that this
  sweep's comment edit and count-word sweep touch. Re-measure every dated snapshot in this spec at the
  rebased base after those land.
- **Checklist insertion is a release-slot-adjacent edit.** The `## Status`/`## Releasing` region is
  guarded prose; run `version-slots.test.mjs` locally before hand-off, and treat any red as a defect in
  the insertion, not a license to widen the test.
- **The "single authoritative copy" rewording must not leak into behavior**: only comment bytes may
  change in `stage-workflow.mjs`; the exported constants are load-bearing anchors.
- **Tour edits risk JSON breakage** — validate the parse after every edit.
- **Amendment-note wording can itself go stale**: every count the notes state must be written as a dated
  snapshot with the live surface named as owner, per the very convention ADR 0030 ratifies.
- **The archived-memory edit is a mutation of a pre-existing memory file** — legitimate here because the
  repo-root archive is an ordinary committed file edited by a worker in its worktree (the servitor-write
  guard is not in this path), but the edit must be additive (appended note) and redaction-lint clean.
- **CHANGELOG content is recovered from git history** — recover blurb text with `git log`/`git show`
  against `README.md` history; do not paraphrase version claims beyond the sanctioned compression, and
  keep the 0.16.0 correction visibly a correction (dated, issue-cited), not a silent rewrite of history.

## 9. Non-goals / deferred

- **No edit to `skills/war-strategy/SKILL.md`** — the live convention block is correct; the ADR is what
  lags. (Also owned by a sibling group; see §8.)
- **No rewrite of any ratified ADR bullet** — append-only notes exclusively (plus the sanctioned in-place
  pointer repairs in ADR 0008).
- **No `strip_prose()` behavior change** and no new absence-scan enumeration of `CHANGELOG.md`.
- **No fifth version slot** — `CHANGELOG.md` head-entry freshness is unguarded, accepted residual.
- **No checklist shrink** — re-evaluation resolved to keep-and-extend; removing items is a test change
  needing its own argument (verified: issue #1330 (2026-08-06)).
- **No tour format migration** — literal line numbers remain the tour format's requirement; this sweep
  only re-derives advisory values and keeps construct names primary.
- **No ADR 0044 D12 restructuring** — the chosen close is the ADR 0030 amendment.
- **No version bump in this sweep** (see §3; revisit at plan conversion if scope grows).

## 10. Validation criteria

1. WHEN ADR 0030 is read after landing THE amendment note SHALL name the Dated-snapshots (D12) form so a
   name-grep finds it · check: `grep -qi 'dated snapshot' docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`
2. WHEN ADR 0030's amendment is read THE member count SHALL be restated as an invariant owned by the live
   block · check: `grep -qE 'Amendment \(2026-08' docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`
3. WHEN ADR 0033 is read THE correction note SHALL record the `--baseline` ref-diff as built · check:
   `grep -q 'baseline' docs/adr/0033-executed-probes-behind-escape-guard.md`
4. WHEN ADR 0025 is read THE correction note SHALL record the six-term subsection and its forcing
   amendment · check: `grep -qi 'six term' docs/adr/0025-drift-guard-discipline.md`
5. WHEN ADR 0008 is scanned for line-anchored citations THE file SHALL carry none · check:
   `! grep -qE '#L[0-9]+|\.md:[0-9]+-[0-9]+' docs/adr/0008-git-is-the-resume-source-of-truth.md`
   · manual same-scope survey: hand-scan `docs/adr/0008-git-is-the-resume-source-of-truth.md`'s
   same-scope tests/comments for same-meaning reworded siblings the grep misses; list each straggler
   as a survey-derived correction
6. WHEN ADR 0008 names a cited construct THE construct SHALL exist verbatim in the cited file · check:
   `grep -qF 'State & resume' skills/war/references/design.md && grep -qF -- '--force' skills/war/SKILL.md`
7. WHEN the `ARGS_FALLBACK_ANCHOR` comment is read THE block SHALL carry the canonical-source sentence
   and the ADR 0037 citation · check:
   `grep -B10 'export const ARGS_FALLBACK_ANCHOR' skills/war/assets/stage-workflow.mjs | grep -qi 'canonical source' && grep -B10 'export const ARGS_FALLBACK_ANCHOR' skills/war/assets/stage-workflow.mjs | grep -q '0037'`
8. WHEN the tour is parsed THE file SHALL be valid JSON with step 14's rotted advisory number gone ·
   check: `python3 -m json.tool .tours/architect-war-system.tour > /dev/null && ! grep -qF '≈49' .tours/architect-war-system.tour`
   · manual same-scope survey: hand-scan `.tours/architect-war-system.tour`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction
9. WHEN the auditor-guard suite comments are read THE VACUOUS claim SHALL be replaced by the fail-loud
   trace at both sites · check:
   `! grep -q 'VACUOUS' hooks/validate-auditor-git.test.sh && grep -qi 'fail loud' hooks/validate-auditor-git.test.sh`
   · manual same-scope survey: hand-scan `hooks/validate-auditor-git.test.sh`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction
10. WHEN the auditor-guard suite runs THE suite SHALL stay green · check:
    `bash hooks/validate-auditor-git.test.sh`
11. WHEN the archived memory is read THE scope note SHALL bound the vacuity claim to
    bail-out-satisfying assertions · check:
    `grep -qi 'deny-asserting' docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`
12. WHEN the learnings tree is linted THE redaction lint SHALL pass · check:
    `node skills/_shared/war-memory.mjs lint docs/learnings/`
13. WHEN `CHANGELOG.md` is read THE file SHALL exist with reverse-chronological per-release sections
    including a corrected 0.16.0 entry · check:
    `grep -q '## 0.17.0' CHANGELOG.md && grep -q '## 0.16.0' CHANGELOG.md && grep -qi 'release window' CHANGELOG.md`
14. WHEN README `## Status` is read THE section SHALL link `CHANGELOG.md` and keep the bold semver as
    its first bold token · check:
    `grep -q 'CHANGELOG.md' README.md && node --test skills/war/assets/version-slots.test.mjs`
15. WHEN the Status-blurb checklist is read THE work-scope vs release-scope item SHALL be present with
    the provenance anchor bullet surviving · check:
    `grep -qi 'release scope' README.md && node --test skills/war/assets/version-slots.test.mjs`
16. WHEN the pipeline-structure suite runs THE `strip_prose()` resolution comment SHALL be present and
    the suite green · check:
    `grep -q 'CHANGELOG.md' skills/war-machine/war-pipeline-structure.test.sh && bash skills/war-machine/war-pipeline-structure.test.sh`
17. WHEN the merge gate runs THE self-discovered suites SHALL all pass (gate discovery via `resolveGate`
    in `war-config.mjs`) · check: the refiner's standard gate run
