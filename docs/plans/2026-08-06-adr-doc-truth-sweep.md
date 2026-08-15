# ADR & comment doc-truth sweep + README Status retro-compression and CHANGELOG introduction

Converted by `/war-machine --afk` from
[docs/specs/2026-08-06-adr-doc-truth-sweep-design.md](../specs/2026-08-06-adr-doc-truth-sweep-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason). Issues addressed: #1363, #1305, #1266, #1290, #1291, #1292, #1253, #1330, #1317, and —
folded 2026-08-15 by operator direction (campaign-era doc-truth follow-ups from landed plan 2, both
in this sweep's exact family) — #1398 and #1399. Issue → task
mapping: #1363 + #1305 (same defect, two filings) → Task 1.1 (ADR 0030 amendment + the mined lesson's
stamp); #1266 → Task 1.1 (ADR 0033 + ADR 0025 correction notes); #1290 → Task 1.2 (ADR 0008 pointer
repair + whole-file survey); #1291 → Task 1.3 (`ARGS_FALLBACK_ANCHOR` comment); #1292 → Task 1.4 (tour
re-derivation + tour-narrative sweep); #1253 → Task 1.5 (C11/H5 comment truth + archived-memory scope
note); #1330 + #1317 → Task 1.6 (README retro-compression, `CHANGELOG.md`, checklist item,
`strip_prose()` resolution comment), with #1317's durable checklist item self-applied by Task 2.1's own
release blurb; #1398 → Task 1.1 (the ADR 0033 correction note's Decision-2 half — exit-2 set + check
(c)); #1399 → Task 1.7 (the awk-degeneracy lesson's appended correction note). `/war` files its own
epic + task issues regardless (war-execution-must-file-issues);
closing the eleven source issues is Lead checkpoint work at phase close
(war-checkpoint-must-close-task-issues), never assumed from the epic close.

## Context — the gap / problem

Nine small, independent doc/comment currency defects, one sweep. Snapshot base for every measured claim:
the repo tip `6fff2ee` (2026-08-06), re-verified at conversion (2026-08-13) in the session worktree —
whose additional commits are docs-only (specs, plans) and touch none of these surfaces. Every count below
is a dated snapshot at that base; re-measure at each task's rebased dispatch base (D12), which for this
plan — the batch's terminal sink — lags the drafting base by up to thirteen landed predecessor plans.

1. **ADR 0030 undercounts its own convention block** (verified: issues #1363 + #1305 (2026-08-06);
   re-confirmed at conversion). `skills/war-strategy/SKILL.md` §2's "Reference the live artifact" block
   carries **eight** bullets — the newest member (the one that made it eight) is
   `**Dated snapshots (D12 staleness rule)**` — but
   `docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`'s Decision section enumerates seven
   forms (no Dated-snapshots member) and its Consequences bullet still reads "six rules + the
   defined-but-not-yet-emitted annotation". No `dated`/`snapshot` token appears anywhere in the ADR
   (conversion grep), so the staleness is invisible to a name-grep. ADR 0044 mentions D12 only as
   embedded prose inside its evidence-tag material (its lines re-read at conversion state the same
   dated-snapshot semantics the planned note states — no contradiction), so ADR 0030, the block's owner,
   is the right home. #1363's mined source lesson
   `docs/learnings/archive/adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts.md`
   exists at the base (conversion ls) and is stamped by the fixing task.
2. **Two ADR bullets became false code-facts** (verified: issue #1266 (2026-08-06); re-confirmed at
   conversion). (a) ADR 0033's Consequences still records the ref-diff as unbuilt ("`ponytail:` a full
   ref-diff snapshot is the named upgrade path, built only if a second escape slips the pattern") and
   calls the porcelain half unqualified "exact" — but
   `skills/red-team/assets/assert-no-repo-escape.sh` ships a `--baseline` mode whose header documents
   check (c) as "the exact ref-diff" and qualifies the porcelain half as "EXACT for tracked and
   untracked-but-not-ignored paths" (header re-read at conversion; predecessor plan 2's landed header
   edits widen only the zero-byte/exit-2 sentences and leave both cited phrases byte-intact — its plan
   text pins the ponytail ceiling paragraph byte-identical). (b) ADR 0025's Consequences bullet freezes
   the `CONTEXT.md` `### Drift-guard discipline` glossary at "five terms"; the live subsection defines
   **six** bold terms, the sixth (**Guard-split deps edge**) forced by ADR 0025's own Amendment
   (2026-08-02) (conversion count). Predecessor plan 5's CONTEXT.md eviction moves only the
   Dead-agent/Stale-prior-attempt/provision-base-divergence entries (reserve: Near-miss diagnostic) —
   the Drift-guard discipline subsection is not in its eviction set (verified: plan 5 Task 1.1 slice).
3. **ADR 0008 carries a form-forbidden line-anchored citation and a mis-named construct pointer**
   (verified: issue #1290 (2026-08-06); re-confirmed at conversion). The Context paragraph cites
   `` [`design.md:58-62`](...#L58) `` — line-accurate at the base (design.md § "6. State & resume"
   sits at line 58 today) but the exact line-anchored form the anchor-by-construct rule forbids, one
   any upstream edit rots; missed by the earlier whole-file scan (grep-is-a-floor: it caught the
   `SKILL.md`-shaped pointers, not the `design.md`-shaped one). Decision sub-point 1 cites `skills/war/SKILL.md`
   § "Invariants (never violate)", "the push-first-CAS clause" — that section's invariant bullet says
   "never `--force`/`reset --hard` on shared branches" and contains no "push-first" wording (section
   re-read at conversion); push-first-CAS prose lives in `skills/war/references/design.md`
   § "6. State & resume" (the "One authority, two durable advisory records" block — both constructs
   verified present at conversion). `docs/adr/` is outside `reference-link-integrity.test.mjs`'s
   `SCAN_DIRS` (agents + war references — conversion read), so no suite arbitrates these links; the
   hand survey is the guard.
4. **`ARGS_FALLBACK_ANCHOR`'s comment invites the inverted reading** (verified: issue #1291
   (2026-08-06); re-confirmed at conversion). ADR 0037's Correction (2026-08-02, #1240) fixed the
   direction: the `const A =` ternary's args-fallback tail in `workflow-template.js` is the **canonical
   source**; `ARGS_FALLBACK_ANCHOR` in `skills/war/assets/stage-workflow.mjs` is the **hand-maintained
   mirror site**. The live `ARGS_FALLBACK_ANCHOR` comment block still says "this is the single
   authoritative copy" with no canonical-source sentence, while its `NAME_ANCHOR`/`DESCRIPTION_ANCHOR`
   sibling carries an explicit "Canonical source of the bytes: the `export const meta` block … of
   workflow-template.js" sentence (both blocks re-read at conversion). Out-of-Files by construction for
   the originating phase, hence routed here.
5. **Tour step 14 carries a rotted advisory line number** (verified: issue #1292 (2026-08-06);
   re-confirmed at conversion). `.tours/architect-war-system.tour` step 14 describes the `..`-traversal
   guard in `hooks/validate-worktree-scope.sh` as "(line ≈49)"; the guard's comment block begins at
   line 51 and its portable case pattern spans ≈61–76 (dated snapshot at `6fff2ee`). The tour is
   18 steps; step 14's is the only inline `line ≈`-prefixed mention (conversion scan), and the grill
   located two further **prefix-less** approximate anchors — step 8's ≈453–458/≈461 and step 12's
   ≈843–844 — named as first-class re-derivation targets in Task 1.4, not left as sweep stragglers.
   The issue is deliberately the work-list for the standing tour-narrative sweep, not an absorbed
   one-liner.
6. **C11/H5 rationale comments state the opposite of the code trace** (verified: issue #1253
   (2026-08-06); re-confirmed at conversion — `VACUOUS` at exactly two sites, lines ≈283 and ≈502,
   dated snapshot). Both comment blocks claim a printf-corrupted payload would make "the deny …
   VACUOUS" via the non-auditor `*) exit 0` pass-through; both cases use `expect_deny`, whose
   definition requires exit 2 **and** a `WAR:` stderr marker (definition re-read at conversion) — a
   pass-through exit 0 with empty stderr fails loud at authoring time. C11 inherited the wording from
   H5 (donor-prompt-latent-omission class); both cite the archived memory
   `docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`, whose body over-generalizes
   ("Every such test is silently vacuous for inputs in that character class" — line ≈68, re-read at
   conversion) — true for exit-0-asserting allow cases, false for deny-asserting ones.
7. **README `## Status` retro-compression + CHANGELOG introduction** (verified: issue #1330
   (2026-08-06); re-confirmed at conversion). The forward half is done — the live `## Status` is the
   short bulleted 0.17.0 blurb. The backward half is untouched: `CHANGELOG.md` does not exist, no
   recorded decline exists, and the historical long blurbs live only in `README.md` git history
   (recoverable — conversion `git log` locates the release commits: 0.15.0 `90c3b44`, 0.15.1
   `46d42be`, 0.16.0 `84c8ced`, 0.17.0 `14b4f01` with post-release blurb edits `3bf8ce1`/`5fa7548`;
   this version set is a dated snapshot — every predecessor release in this batch appends one more,
   and the deeper history holds ~113 recoverable releases back to 0.5.0, so the recovery is bounded
   at 0.15.0-forward per issue #1330's own scope line — D10).
   Binding constraints all hold live (conversion read of `skills/war/assets/version-slots.test.mjs`):
   `**<version>**` is extracted as the first bold token after the `\n## Status` heading boundary and
   rides the monotonic floor; the `### Status-blurb authoring checklist` heading and its
   provenance-slug anchor bullet are locked (with a non-vacuity negative reference); the Releasing
   prose must keep "four version slots across three files" and never the "three files" undersell; and
   `strip_prose()` in `skills/war-machine/war-pipeline-structure.test.sh` drops `## Status`/
   `## Changelog` *sections* while the absence helpers scan an **explicitly enumerated** file list that
   excludes `CHANGELOG.md` — relocated blurbs trip nothing today; the resolution just needs recording.
8. **The 0.16.0 work-scope/release-scope conflation needs a durable guard** (verified: issue #1317
   (2026-08-06)). The 0.16.0 blurb's unscoped "zero `/war` engine change" claim was true of the plan's
   work and false of the release window (12 engine-path files shipped from unbumped PRs #1280/#1294);
   it shipped unedited and the surface is now gone from the live README. The live seven-item checklist
   has no item distinguishing work-scope from release-scope claims (re-read at conversion). The
   retro-located 0.16.0 `CHANGELOG.md` entry is the natural place to correct the historical record —
   visibly a dated, issue-cited correction, never a silent rewrite.
9. **Count-word sweep floor is zero at base** (conversion grep): `seven-item` / `seven item` /
   `seven checks` / `all seven` have **0** hits across `README.md`, `CLAUDE.md`, `CONTEXT.md`,
   `skills/`, and `docs/adr/` — the checklist body is numbered but nowhere counted in prose. The sweep
   stays as a confirm-zero floor + paraphrase hand-scan at the rebased base.

## Pivotal constraints

- **ADRs are append-only.** The repair channel for a stale ratified bullet is a dated
  amendment/correction note (ADR 0037's "Correction (2026-08-02, #1240)" shape), never an edit of the
  ratified bullet's bytes — ADR 0030's "six rules" Consequences bullet and ADR 0033/0025's stale
  bullets stay byte-intact forever, with the note beside them. Two sanctioned exceptions, both
  recorded in `docs/learnings/`: the **Status currency header line** may be updated
  (adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line), and **pointer/citation
  currency repairs are in-place edits** (the landed ADR 0008 phase-close precedent, verified: issue
  #1290 (2026-08-06)).
- **`version-slots.test.mjs` is the arbiter for every README release-surface edit**: `**<version>**`
  stays the first bold token after the `## Status` heading (no bold token may precede it in the
  section); the `### Status-blurb authoring checklist` heading and its provenance-slug anchor bullet
  survive; the `## Releasing` table row naming `README.md` → "the `## Status` line/paragraph" and the
  "four version slots across three files" prose are guarded; the suite is expected **unchanged** —
  any red is a defect in the edit, never a license to widen or weaken the test (A3 carries the one
  sanctioned contingency).
- **No `docs/specs/` citation in README (ADR 0046) — nor in `CHANGELOG.md`** [carried A1]: entries
  cite issues, PRs, and ADRs; any `docs/specs/` path in a recovered historical blurb is dropped or
  replaced at compression time. Costless to comply regardless of whether ADR 0046's pinned corpus is
  read as covering the file README links as its changelog.
- **`strip_prose()` semantics must not change.** The section-drop and the enumerated absence-scan
  lists in `skills/war-machine/war-pipeline-structure.test.sh` stay byte-compatible; this sweep only
  *records* the CHANGELOG interaction resolution — and the recording comment must NOT restate the
  stripped-scan composition literally (`strip_prose` followed by a pipe or redirect): predecessor
  plan 4's landed End state pins `grep -Ec 'strip_prose *[|<]'` to the two inner-predicate bodies,
  and a comment matching that census forks it (the coupling-comment-self-match class).
- **Comment-only code edits.** The `stage-workflow.mjs` and `validate-auditor-git.test.sh` changes
  touch comment bytes only — zero behavior change, no exported constant moves; every discovered suite
  stays green (gate discovery via `resolveGate` in `war-config.mjs`, never an enumerated suite list).
- **The tour file is JSON** — `.tours/architect-war-system.tour` must re-parse after every edit;
  construct names stay primary, line numbers advisory with the `≈` hedge kept.
- **Redaction lint stays green**: all three `docs/learnings/` edits (the archive scope note, the
  lesson stamp, Task 1.7's appended correction section) ride the fail-closed lint, which runs
  in-gate via its discovered shell-test wrapper.
- **Platform law** (batch-refined wording): every committed check whose pattern is a LITERAL — above
  all one carrying mid-pattern metacharacters — runs `grep -F`; deliberate regexes (the `#L[0-9]+`
  rot scan, `fails? loud`) stay regexes and cannot ride `-F`. Execute-your-literals: run each check as
  written before committing it. (AI-declared)
- **Ordering**: this group lands **after** sibling groups `shell-pin-helpers`,
  `war-strategy-mirror-guards`, and `gate2-publication-guard` (declared upstream edges), and the
  roadmap sequences it **last** in the batch — its Task 1.6 edits README release-adjacent structure
  that every predecessor's release task rewrites (Note 3). Witness steps record predecessor presence;
  drift is stop-and-report, never silent adaptation.
- **Stacked-release honesty**: as the batch's terminal release, the baseline lag peaks here
  (stacked-per-branch-releases-make-main-lag-cumulative) — the bump resolves the next free patch from
  the live slots at land time; every version literal in this plan, the spec, and the roadmap is
  non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | #1363/#1305 close route | **Amend ADR 0030** — it owns the convention block; ADR 0044's D12 mention is embedded prose, not attribution | spec D1; (verified: issue #1305 (2026-08-06)) |
| D2 | ADR 0030 count line | **Restate as invariant** in the amendment note — membership is owned by the live `skills/war-strategy/SKILL.md` §2 block; any member count in the ADR is a dated snapshot. The note also enumerates the Dated-snapshots (D12) form by name so a name-grep finds it | spec D2 |
| D3 | ADR 0033 / 0025 repair channel | Dated correction note appended per ADR (ADR 0037 Correction-note shape); ratified bullets byte-unchanged; Status currency line may be updated | spec D3 |
| D4 | ADR 0008 `design.md:58-62` re-anchor | Construct-anchored link to `skills/war/references/design.md` § "6. State & resume" (the "One authority, two durable advisory records" block); in-place citation edit | spec D4 |
| D5 | ADR 0008 push-first-CAS pointer | Re-name to the construct that exists: § "Invariants (never violate)"'s never-`--force`/`reset --hard`-on-shared-branches clause; the push-first-CAS *mechanism* citation points at `design.md` § "6. State & resume" | spec D5 |
| D6 | `ARGS_FALLBACK_ANCHOR` comment | Add the canonical-source sentence mirroring the meta-anchor sibling's shape (canonical: the `const A =` ternary's args-fallback tail in `workflow-template.js`; this constant: the hand-maintained mirror the imported-constant anchor guard arbitrates); scope "single authoritative copy" to what it means (the single in-suite anchor constant the test imports); cite ADR 0037's Correction (2026-08-02, #1240) | spec D6 |
| D7 | Tour step 14 | Re-derive the advisory number at the task's rebased base (≈51 at `6fff2ee`); keep `≈` and construct-name primacy; then the tour-narrative sweep over all 18 steps | spec D7 |
| D8 | C11/H5 comments | Both sites in one task: replace the VACUOUS claim with the true trace — pass-through exit 0 + empty stderr makes `expect_deny` (exit 2 + `WAR:` marker required) fail loud at authoring time; comments carry the literal phrase "fails loud" | spec D8, phrase pinned at conversion for End state 10's check |
| D9 | Archived memory | Append a dated scope note bounding the vacuity claim to assertions the bail-out outcome satisfies (exit-0-asserting allow cases); deny-asserting cases fail loud. Body otherwise untouched (notes append, bodies stay) | spec D9 |
| D10 | CHANGELOG.md shape | New top-level `CHANGELOG.md`: H1 + reverse-chronological `## <semver> — <date>` sections; **bounded at 0.15.0-forward** (issue #1330's own scope line: "0.15.x, 0.16.0, and whatever has landed by then" — the full README history holds ~113 recoverable releases back to 0.5.0, 28× the in-scope set, so an unbounded rule defeats the issue's scope): one section per release from 0.15.0 through the rebased-base head (the drafting-base set of four is a dated snapshot; predecessor releases extend it), each release's blurb taken **as last edited before its supersession** (0.17.0's includes its post-release blurb fixes), pre-0.17.0 long blurbs lightly compressed to the short shape, 0.17.0+ short blurbs relocated near-verbatim; no `docs/specs/` citations (A1) | spec D10, enumeration rule bounded + sharpened at conversion per the grill (AI-declared) |
| D11 | 0.16.0 entry truth | The relocated 0.16.0 entry carries the scope correction: the zero-engine-change claim scoped to the plan's work, plus a dated, issue-cited note that the release window shipped engine-path files from unbumped PRs #1280/#1294 | spec D11; (verified: issue #1317 (2026-08-06)) |
| D12 | `## Status` ↔ CHANGELOG link | `## Status` keeps the short current-release blurb and gains one trailing link line to `CHANGELOG.md` (no bold token — the semver stays the section's first bold token); the line sits after the blurb so a future replace-in-place blurb rewrite can keep it | spec D12, placement sharpened at conversion (AI-declared) |
| D13 | CHANGELOG as a version slot? | **No** — not a fifth slot; `version-slots.test.mjs` gains no CHANGELOG assertion [carried A2: keeping release friction flat — if wrong: a stale head entry ships silently until the next doc sweep] | spec D13 |
| D14 | Checklist re-evaluation | **Keep all seven items**, **insert one new item** distinguishing work-scope from release-scope claims (the #1317 durable ask) immediately before the Provenance item, renumbering so the Provenance bullet stays last with "Every item above" still true and its anchor slug byte-verbatim | spec D14 |
| D15 | strip_prose × CHANGELOG.md | **No guard change.** Record the resolution in one sentence beside `strip_prose()` — the absence scans read an explicitly enumerated file list that excludes `CHANGELOG.md` by design; a future guard that enumerates it must decide its own strip rule — worded without the composition literal (Pivotal constraints) | spec D15 |
| D16 | Version bump | **Release phase appended** — the spec's "no bump" row is retired via its own if-wrong arm: this plan lands as its own consumer-visible PR (new `CHANGELOG.md`, README structure), the batch ships every sibling with a release phase, and shipping *this* plan unbumped would re-enact the exact unbumped-landing defect its own 0.16.0 correction records (#1317). Next free patch above the live base at land time | conversion judgment (deviation from spec D-row, reason here; logged for /red-team) |
| D17 | Release-phase CHANGELOG duty | Task 2.1 appends its own release's `CHANGELOG.md` entry (introducing the file already stale at its own release would be self-refuting); future releases stay unguarded — accepted residual per D13 | conversion judgment (AI-declared), logged for /red-team |
| D18 | Lesson stamp | `docs/learnings/archive/adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts.md` `description:` gains a `RESOLVED (adr-doc-truth-sweep/1.1, #1363): ` prefix (batch stamp shape: fixing task + issue, no land-date token); body/keywords untouched. Stamp travels in the fixing task (stamp honesty). #1266's sibling lesson stays unstamped (Non-goals) | conversion judgment per batch precedent (AI-declared), logged for /red-team |
| D19 | Task decomposition | Six file-disjoint parallel tasks in Phase 1 (one wave, no deps edges — no task consumes another's output; no mechanical guard is authored anywhere, so rule 7 never triggers) + the trailing release phase | conversion judgment; war-strategy §3 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | ADR 0046's README rule extends to `CHANGELOG.md` (the file README links as its changelog) (AI-declared) | spec §2 carried [assumed] row | if wrong, the guard's pinned corpus simply does not cover CHANGELOG.md and a spec-path citation there is un-scanned, not forbidden — compliance is costless either way, so the plan complies unconditionally | ratify in /red-team |
| A2 | No CHANGELOG assertion in `version-slots.test.mjs` keeps release friction flat (AI-declared) | spec D13 carried [assumed] row | a stale CHANGELOG head entry ships silently until the next doc sweep — accepted residual, backstop row | ratify in /red-team |
| A3 | The checklist insertion preserves the `### Status-blurb authoring checklist` heading and provenance-anchor bullet, so `version-slots.test.mjs` needs no edit (AI-declared) | spec §4 carried [assumed] row; conversion read of the lock (heading + anchor-slug + negative reference) | the lock's fixture is updated in the same task, never weakened — the contingency home is in Task 1.6's Files for footprint honesty | End states 16/17's `node --test` run |
| A4 | The three declared upstream plans (4, 11, 12) — and per the roadmap all thirteen predecessors — land before this plan | spec §2/§8 ordering; survey manifest machine hint; conversion read of the three committed plans' slices (plan 4 refactors `war-pipeline-structure.test.sh` around an intact `strip_prose()`; plan 11 pins the war-strategy SKILL §2 block byte-unchanged; plan 12 edits war SKILL.md's Gate-2 bullet, not the Invariants section) | run out of order, Task 1.6's comment lands in the pre-refactor suite (textually fine — `strip_prose()` survives both shapes) and the CHANGELOG simply carries fewer entries; witness steps record which shape was seen | witness records in done reports; roadmap dependency-spine edges |
| A5 | The in-scope release set at the rebased base is the D10-bounded window: 0.15.0 through the rebased-base head (the drafting-base set 0.15.0/0.15.1/0.16.0/0.17.0 plus one per landed predecessor release) — never the ~113-release full history (AI-declared) | conversion + grill `git log` census; issue #1330's own scope line; D10's bounded rule | a missed in-window release leaves a CHANGELOG gap — caught by the worker's mandated bounded census (Task 1.6) and the End state 15 survey; an over-wide census defeats #1330's scope and is stop-and-report | Task 1.6's census, recorded in the done report |
| A6 | The `## Status` → CHANGELOG link line survives this plan's own Phase 2 blurb replacement, and future release authors keep it (AI-declared) | D12's placement (trailing line, outside the replaced blurb paragraph); Task 2.1's directive names it explicitly | a future release's replace-in-place drops the line — unguarded, accepted residual; the next doc sweep is the runner | backstop row |

Retired spec assumptions (retired with a stated reason, per the conversion contract): **(1)** spec §4's
"ADR 0044's D12 prose does not contradict the ADR 0030 note [assumed]" is **upgraded to code-verified**
at conversion — ADR 0044's evidence-tag material states the same "literals are dated snapshots at a
stated base, re-measured at the task's rebased base (D12)" semantics the note will state; the
one-line-cross-reference fallback is not needed and ADR 0044 stays read-only. **(2)** spec D-row
"Version bump: None [assumed: no marketplace-visible behavior changes]" is **retired via its own
if-wrong arm** — see D16; the release phase is appended. **(3)** spec §6/§7's "no CONTEXT.md term / no
ADR needed [assumed]" rows are adopted as-is (triad self-adjudication, Note 5) — no downstream surface
in this plan needs a ratified term, and every ADR-side change travels the established append-only
amendment channel.

## Non-goals / deferred

- **No edit to `skills/war-strategy/SKILL.md`** — the live convention block is correct; the ADR is what
  lags. (The block is also plan 11's byte-unchanged read-anchor.)
- **No rewrite of any ratified ADR bullet** — append-only notes exclusively, plus the two sanctioned
  in-place repair channels (ADR 0008 pointer citations; Status currency lines).
- **No `strip_prose()` behavior change**, no new absence-scan enumeration of `CHANGELOG.md`, and no
  widening of `doc-cli-consistency.test.mjs`'s posterity corpus or
  `reference-link-integrity.test.mjs`'s `SCAN_DIRS` to cover `CHANGELOG.md` or `docs/adr/`.
- **No fifth version slot** — CHANGELOG head-entry freshness is unguarded, accepted residual (A2).
- **No checklist shrink** — keep-and-extend only; removing items is a test change needing its own
  argument (verified: issue #1330 (2026-08-06)).
- **No tour format migration** — literal line numbers remain the format's requirement; this sweep
  re-derives advisory values and keeps construct names primary.
- **No ADR 0044 D12 restructuring** — the chosen close is the ADR 0030 amendment (D1).
- **Sibling lesson stamp deferred**: `adr-consequences-deferred-backstop-goes-stale-when-later-phase-builds-it.md`
  (#1266's mined source) stays unstamped here — the batch precedent leaves sibling stamps to issue
  closing comments and memory housekeeping; only #1363's lesson is stamped because this plan lands its
  recorded fix (D18).

## New domain terms · Recommended ADRs

None. "Changelog" and "retro-compression" are ordinary language (spec §6); all ADR-side work travels
the established append-only amendment channel — the CHANGELOG introduction is recorded by this plan,
the correcting commit bodies, and the `strip_prose()` comment, not an ADR (spec §7). Self-adjudicated
at conversion (Note 5).

## AI-Commander's Intent

- **Purpose:** every recorded doc-truth defect in the group is closed at its owning surface — the four
  stale ADRs carry dated amendment/correction notes or repaired construct-anchored pointers, the two
  inverted/false code comments state the true trace, the tour's advisory anchors are re-derived, the
  archived memory's over-broad claim is bounded — and the README stops doing changelog duty in the
  shop window: `CHANGELOG.md` exists with the full recovered release history including a visibly
  corrected 0.16.0 entry, `## Status` links it, and the authoring checklist gains the
  work-scope/release-scope item that makes the 0.16.0 class checkable — all without changing any
  guard's behavior, weakening any pin, or editing a ratified ADR byte. (AI-declared)
- **Method:** one sweep phase of six file-disjoint parallel tasks — append-only ADR notes written as
  dated snapshots naming the live surface as owner; in-place pointer repairs with a whole-file hand
  survey; comment-only code edits arbitrated by the existing discovered suites; JSON-validated tour
  edits plus the standing tour-narrative sweep; a paired comment+memory truth fix; and the
  README/CHANGELOG/strip_prose-comment cluster with the version-slots suite as unchanged arbiter —
  followed by the batch's terminal release phase, whose own blurb must pass the newly extended
  checklist. Grep checks are floors; every mandated hand survey lists stragglers as survey-derived
  corrections; every count is a dated snapshot re-measured at the rebased base. (AI-declared)
- **End state:**
  1. ADR 0030's amendment note names the Dated-snapshots (D12 staleness rule) form so a name-grep
     finds it · check: `grep -qi 'dated snapshot' docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`. (AI-declared)
  2. ADR 0030's amendment restates the member count as an invariant owned by the live
     `skills/war-strategy/SKILL.md` §2 block, and every pre-existing body byte — including the
     ratified "six rules" Consequences bullet — is unchanged except the sanctioned Status currency
     line · check: `grep -qF 'Amendment (2026-08' docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`
     (`-F` per the platform law — the pattern carries parentheses); the byte-unchanged claim is
     hand-verified in the diff (survey note, SOFT). (AI-declared)
  3. ADR 0033's correction note records the `--baseline` ref-diff as built and the porcelain half as
     exact only for tracked and untracked-but-not-ignored paths, per the guard's own header — and
     *(amendment 2026-08-15, #1398)* corrects Decision 2's two under-descriptions: the exit-2
     parenthetical widened to the full set (git / usage / containment / unreadable / zero-byte
     baseline) and check (c) added to the a/b enumeration · check:
     `grep -q 'baseline' docs/adr/0033-executed-probes-behind-escape-guard.md && grep -qi 'zero-byte' docs/adr/0033-executed-probes-behind-escape-guard.md`. (AI-declared)
  4. ADR 0025's correction note records the six-term `CONTEXT.md` subsection and names its forcing
     2026-08-02 amendment, count restated as owned by the live subsection · check:
     `grep -qi 'six term' docs/adr/0025-drift-guard-discipline.md`. (AI-declared)
  5. ADR 0008 carries zero line-anchored citations · check:
     `! grep -qE '#L[0-9]+|\.md:[0-9]+-[0-9]+' docs/adr/0008-git-is-the-resume-source-of-truth.md` ·
     mandatory same-scope survey (grep is a floor): hand-read every link and section citation in the
     file end-to-end; list each remaining rotted or mis-named pointer as a survey-derived correction. (AI-declared)
  6. Every construct ADR 0008 cites exists verbatim in the cited file · check:
     `grep -qF 'State & resume' skills/war/references/design.md && grep -qF -- '--force' skills/war/SKILL.md`. (AI-declared)
  7. The `ARGS_FALLBACK_ANCHOR` comment carries the canonical-source sentence and the ADR 0037
     citation · check:
     `grep -B10 'export const ARGS_FALLBACK_ANCHOR' skills/war/assets/stage-workflow.mjs | grep -qi 'canonical source' && grep -B10 'export const ARGS_FALLBACK_ANCHOR' skills/war/assets/stage-workflow.mjs | grep -q '0037'`. (AI-declared)
  8. The stager's comment edit changed zero behavior — its discovered suite is green · check:
     `node --test skills/war/assets/stage-workflow.test.mjs`. (AI-declared)
  9. The tour parses as JSON with step 14's rotted advisory number gone · check:
     `python3 -m json.tool .tours/architect-war-system.tour > /dev/null && ! grep -qF '≈49' .tours/architect-war-system.tour` ·
     mandatory same-scope survey (grep is a floor): hand-check every step's `file`/`line` field and
     description narrative against the live target files at the rebased base; list each rotted anchor
     or false code-fact as a survey-derived correction. (AI-declared)
  10. The VACUOUS claim is replaced by the fail-loud trace at both sites · check:
      `! grep -q 'VACUOUS' hooks/validate-auditor-git.test.sh && grep -qiE 'fails? loud' hooks/validate-auditor-git.test.sh`
      (the spec's `grep -qi 'fail loud'` form sharpened to cover the mandated "fails loud" wording —
      Note 6) · mandatory same-scope survey: hand-scan the C-block and H-block case titles and
      rationale comments for any sibling repeating the inherited claim in other words; list
      stragglers. (AI-declared)
  11. The auditor-guard suite stays green · check: `bash hooks/validate-auditor-git.test.sh`. (AI-declared)
  12. The archived memory's scope note bounds the vacuity claim to bail-out-satisfying assertions ·
      check: `grep -qi 'deny-asserting' docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`. (AI-declared)
  13. #1363's mined lesson opens with the RESOLVED stamp · check:
      `grep -Fc -e 'RESOLVED (adr-doc-truth-sweep/1.1, #1363' docs/learnings/archive/adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts.md`
      → `1` (description-only diff, hand-verified). (AI-declared)
  14. The redaction lint passes over the learnings tree · check:
      `node skills/_shared/war-memory.mjs lint docs/learnings/`. (AI-declared)
  15. `CHANGELOG.md` exists with reverse-chronological per-release sections covering every release
      in the D10-bounded window (0.15.0 through the rebased-base head — never the deeper history),
      including the corrected 0.16.0 entry naming the release window and PRs #1280/#1294 · check:
      `grep -qF -- '## 0.17.0' CHANGELOG.md && grep -qF -- '## 0.16.0' CHANGELOG.md && grep -qi 'release window' CHANGELOG.md`
      (a floor — the bounded enumeration is the worker's history census, recorded in the done
      report; A5, SOFT). (AI-declared)
  16. README `## Status` links `CHANGELOG.md` with the bold semver still the section's first bold
      token · check: `grep -qF 'CHANGELOG.md' README.md && node --test skills/war/assets/version-slots.test.mjs`. (AI-declared)
  17. The checklist carries the work-scope vs release-scope item immediately before the Provenance
      item, renumbered, with the provenance anchor bullet last and verbatim · check:
      `grep -qi 'release scope' README.md && node --test skills/war/assets/version-slots.test.mjs`. (AI-declared)
  18. The `strip_prose()` resolution comment is present without restating the stripped-scan
      composition, and the pipeline-structure suite is green · check:
      `grep -qF 'CHANGELOG.md' skills/war-machine/war-pipeline-structure.test.sh && bash skills/war-machine/war-pipeline-structure.test.sh`;
      the composition census (`grep -Ec 'strip_prose *[|<]'`) is unchanged from the task's rebased
      base (plan 4's dated expectation: 2). (AI-declared)
  19. The count-word sweep is clean: `seven-item`/`seven item` and paraphrased count claims over the
      checklist have zero live-surface hits (0 at conversion — confirm-zero floor + paraphrase
      hand-scan; ADR 0030's ratified "six rules" bullet is append-only posterity, never a sweep
      target) · check: `! grep -rn 'seven-item' README.md CLAUDE.md CONTEXT.md skills/` + survey
      note. (AI-declared)
  20. Every task's landing commit cites its mapped issues (#1363/#1305, #1266/#1398, #1290, #1291,
      #1292, #1253, #1330/#1317, #1399) · HARD at audit_sha (git log between the phase base and tip;
      execution-evidence seat). (AI-declared)
  21. The full gates are green at the integrated tip (redaction lint included) · gate: the
      self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test 'skills/**/*.test.mjs'`
      and the documented hooks/skills shell-test loop both exit 0. (AI-declared)
  22. Release: all four version slots move lock-step to the next free patch above the live
      integration base at land time; the new Status blurb passes the extended checklist (including
      its own new item); the release's own CHANGELOG entry is appended and the Status link line
      survives the blurb replacement · check: `node --test skills/war/assets/version-slots.test.mjs`
      plus End state 16's grep re-run. (AI-declared)
  23. *(amendment 2026-08-15, #1399)* The awk-degeneracy lesson carries the appended dated
      correction section stating the true mechanism (`base[]` fills from the live dump; `live[]`
      stays empty), pre-existing body bytes unchanged above it, redaction lint green ·
      check: `grep -qi 'live dump' docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md && grep -qF 'Correction (2026-08-15' docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`
      (byte-unchanged-above claim hand-verified in the diff, SOFT).

## Build order (for /war)

Phase 1 (Tasks 1.1–1.7, one wave, file-disjoint — Task 1.7, amendment 2026-08-15, owns only the awk
lesson file, which no sibling touches) → Phase 2 (release).

No deps edges anywhere: no task consumes another's output, no mechanical guard is authored in this
plan, so rule 7 (guard-split deps-edge) never triggers (Note 1). Every construct each task edits
exists at the frozen phase base.

## Phase 1 — The doc-truth sweep

### Task 1.1: ADR amendment/correction notes + lesson stamp (#1363, #1305, #1266, #1398)

- Files: `docs/adr/0030-live-artifacts-over-stack-fragile-literals.md`, `docs/adr/0033-executed-probes-behind-escape-guard.md`, `docs/adr/0025-drift-guard-discipline.md`, `docs/learnings/archive/adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts.md`
- Plan slice: **Witness census (record, never halt)** — at the rebased dispatch base, re-count and
  record in the done report: the `skills/war-strategy/SKILL.md` §2 "Reference the live artifact"
  block's bullet count (8 at `6fff2ee`; plan 11 declares the file byte-unchanged) and the
  `CONTEXT.md` `### Drift-guard discipline` bold-term count (6 at `6fff2ee`; plan 5's eviction set
  excludes it). The notes state whatever the re-measured values are, as dated snapshots naming the
  live surface as owner. **ADR 0030** — append a dated amendment note (ADR 0037 Correction-note
  shape): the live convention block gained the **Dated snapshots (D12 staleness rule)** form
  (enumerate it by name so a name-grep lands); the Decision list and the Consequences "six rules"
  figure are dated snapshots at their ratification base — membership is owned by the live SKILL.md §2
  block, and counts here must never be read as current (D2). **ADR 0033** — append a dated correction
  note: the ref-diff upgrade path **was built** (`assert-no-repo-escape.sh` `--baseline` mode; check
  (c) is the exact ref-diff scoped to heads+tags), and the porcelain half is exact only for tracked
  and untracked-but-not-ignored paths, per the guard's own header (re-verify both header phrases at
  the rebased base — plan 2's landed edits widen adjacent sentences). *(amendment 2026-08-15,
  #1398)* The same ADR 0033 note also corrects Decision 2's two under-descriptions: the
  exit-contract parenthetical's "2 = git error" is widened to the full exit-2 set (git / usage /
  containment `..` / unreadable baseline / zero-byte baseline — the last landed by plan 2), and
  check (c) is added to Decision 2's a/b enumeration (verify the live set against the guard's own
  header at the rebased base — the guard is the truth source, the note restates it). One note, one
  Correction heading — the three ADR 0033 corrections (#1266's ponytail + #1398's two) travel
  together, per the ADR 0037 Correction-note shape with pre-existing body bytes unchanged.
  **ADR 0025** — append a dated
  correction note: the `CONTEXT.md` `### Drift-guard discipline` subsection now defines **six**
  terms, the sixth (**Guard-split deps edge**) forced by this ADR's own Amendment (2026-08-02);
  count restated as owned by the live subsection. All three: pre-existing body bytes byte-unchanged
  (the ratified stale bullets stay, notes beside them); the Status currency header line may be
  updated (the sanctioned exemption); ADR 0044 is read-only reference (retired assumption 1).
  **Lesson stamp (D18)** — prefix the mined lesson's `description:` frontmatter value with
  `RESOLVED (adr-doc-truth-sweep/1.1, #1363): `; body, `metadata.keywords`, every other key
  byte-untouched; redaction lint stays green. Commits cite #1363, #1305, #1266, #1398.
- Done when: `grep -qi 'dated snapshot' docs/adr/0030-live-artifacts-over-stack-fragile-literals.md && grep -q 'baseline' docs/adr/0033-executed-probes-behind-escape-guard.md && grep -qi 'zero-byte' docs/adr/0033-executed-probes-behind-escape-guard.md && grep -qi 'six term' docs/adr/0025-drift-guard-discipline.md`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: ADR 0008 pointer repair + whole-file survey (#1290)

- Files: `docs/adr/0008-git-is-the-resume-source-of-truth.md`
- Plan slice: **Witness (record, never halt)** — verify at the rebased base that the re-anchor
  targets exist: `## 6. State & resume` + "One authority, two durable advisory records" in
  `skills/war/references/design.md`, and the Invariants bullet's never-`--force`/`reset --hard`
  clause in `skills/war/SKILL.md` (plans 12/13 edit that file's other regions). **In-place citation
  repairs (the sanctioned channel)** — replace the Context paragraph's `` [`design.md:58-62`](…#L58) ``
  citation with a construct-anchored link to `skills/war/references/design.md` § "6. State & resume"
  (the "One authority, two durable advisory records" block); fix Decision sub-point 1's pointer so
  the named construct exists: cite § "Invariants (never violate)"'s own wording (the
  never-`--force`/`reset --hard`-on-shared-branches clause) and point the push-first-CAS *mechanism*
  citation at `design.md` § "6. State & resume" (D4/D5). **Mandatory survey (grep is a floor)** —
  grep the ADR for `#L[0-9]+` and `\.md:[0-9]+-[0-9]+`, then hand-read every link and section
  citation in the file end-to-end against the live targets; list each remaining rotted or mis-named
  pointer as a survey-derived correction in the diff and done report (mandatory statement even at
  zero stragglers). `docs/adr/` is outside `reference-link-integrity.test.mjs`'s scan dirs — the
  hand survey is the only guard; anchor by named construct, never line number. Commits cite #1290.
- Done when: `! grep -qE '#L[0-9]+|\.md:[0-9]+-[0-9]+' docs/adr/0008-git-is-the-resume-source-of-truth.md`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: `ARGS_FALLBACK_ANCHOR` canonical-source comment (#1291)

- Files: `skills/war/assets/stage-workflow.mjs`
- Plan slice: in the comment block above `export const ARGS_FALLBACK_ANCHOR`: add the
  canonical-source sentence mirroring the `NAME_ANCHOR`/`DESCRIPTION_ANCHOR` sibling's shape —
  canonical source of the bytes: the `const A =` ternary's args-fallback tail in
  `workflow-template.js`; this constant: the hand-maintained mirror site the imported-constant
  anchor guard in `stage-workflow.test.mjs` arbitrates. Scope the "single authoritative copy" phrase
  to what it means (the single in-suite anchor constant the test imports — never a claim of
  canonicality over the template's tail), and cite ADR 0037's Correction (2026-08-02, #1240) note.
  Comment bytes only: no constant, export, or behavior change — the exported anchor literals are
  load-bearing. `stage-workflow.test.mjs` (discovered by `resolveGate`) stays the arbiter. Commits
  cite #1291.
- Done when: `node --test skills/war/assets/stage-workflow.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Tour re-derivation + tour-narrative sweep (#1292)

- Files: `.tours/architect-war-system.tour`
- Plan slice: fix step 14's "(line ≈49)" to the re-measured value at the task's rebased base (≈51 at
  `6fff2ee` — re-derive, never copy), keeping the `≈` hedge and construct-name primacy (the
  `..`-traversal guard in `hooks/validate-worktree-scope.sh` stays named). **First-class
  re-derivation targets beyond step 14** (grill-located prefix-less approximate anchors a `line ≈`
  grep misses — not sweep stragglers): step 8's ≈453–458/≈461 and step 12's ≈843–844 — re-measure
  each against its live target file at the rebased base and re-derive, keeping the `≈` hedge.
  **Then the standing tour-narrative sweep this issue is the work-list for (grep is a floor)** —
  grep the tour for `line ≈`, `≈`, and inline line-number mentions; then hand-check every one of
  the 18 steps' `file`/`line`
  fields and description narratives against the live target files at the rebased base
  (tour-narrative-can-assert-a-false-code-fact class); re-derive each rotted advisory anchor and
  list every correction as survey-derived in the done report (mandatory statement even at zero).
  The file must re-parse as JSON after every edit (`python3 -m json.tool`). Commits cite #1292.
- Done when: `python3 -m json.tool .tours/architect-war-system.tour > /dev/null && ! grep -qF '≈49' .tours/architect-war-system.tour`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.5: C11/H5 comment truth + archived-memory scope note (#1253)

- Files: `hooks/validate-auditor-git.test.sh`, `docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`
- Plan slice: **Both suite sites in one edit** — replace the C11 rationale comment (the block above
  the `expect_deny "C11: …"` call) and the H5 comment (above `expect_deny "H5: …"`) VACUOUS claims
  with the true trace: a printf-corrupted payload takes the non-auditor `*) exit 0` pass-through,
  and a pass-through exit 0 with empty stderr makes `expect_deny` — which requires exit 2 **and**
  a `WAR:` stderr marker — **fail loud at authoring time**, never land vacuous (carry the literal
  "fails loud" phrase for End state 10's check). Comment bytes only; the suite must stay green.
  **Sweep (grep is a floor)** — grep the suite for `VACUOUS`; then hand-scan the C-block and
  H-block families' case titles and rationale comments for any sibling repeating the inherited
  claim in other words (donor-prompt-latent-omission class); list stragglers as survey-derived
  corrections. **Archived memory (D9)** — append a dated scope note to
  `docs/learnings/archive/printf-json-escaping-vacuous-test-case.md`: the vacuity claim holds only
  where the assertion is satisfied by the bail-out outcome (exit-0-asserting allow cases);
  deny-asserting cases (exit 2 + `WAR:` marker required) fail loud at authoring time. Additive note
  only — body otherwise untouched (notes append, bodies stay); redaction-lint clean (the archive is
  an ordinary committed file edited by a worker in its worktree — the servitor-write guard is not
  in this path). Commits cite #1253.
- Done when: `bash hooks/validate-auditor-git.test.sh && ! grep -q 'VACUOUS' hooks/validate-auditor-git.test.sh`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.6: README retro-compression, CHANGELOG.md, checklist item, strip_prose comment (#1330, #1317)

- Files: `README.md`, `CHANGELOG.md`, `skills/war-machine/war-pipeline-structure.test.sh`, `skills/war/assets/version-slots.test.mjs`
- Plan slice: `skills/war/assets/version-slots.test.mjs` is the **unchanged arbiter** — in Files for
  footprint honesty and as A3's contingency home only (a believed-necessary edit updates the lock's
  fixture in this task, never weakens an assertion). **Witness (record, never halt)** — at the
  rebased base: `grep -c '_hit_i' skills/war-machine/war-pipeline-structure.test.sh` (≥1 ⇒ plan 4's
  refactor landed; 0 at `6fff2ee`), `bash skills/war-machine/war-pipeline-structure.test.sh; echo $?`
  (expect 0), and `grep -Ec 'strip_prose *[|<]' skills/war-machine/war-pipeline-structure.test.sh`
  (plan 4's dated expectation 2) — the done report states which suite shape was seen and the census
  value, which End state 18 must leave unchanged. **History census (A5/D10 — bounded)** — enumerate
  every release from **0.15.0 through the rebased-base head** whose `## Status` blurb appears in
  `README.md` git history (`git log`/`git show` over the release commits; drafting-base set: 0.15.0
  `90c3b44`, 0.15.1 `46d42be`, 0.16.0 `84c8ced`, 0.17.0 `14b4f01` + blurb fixes
  `3bf8ce1`/`5fa7548`, plus one entry per landed predecessor release — a dated snapshot to
  re-derive). The bound is issue #1330's own scope line; the deeper history (~113 releases back to
  0.5.0) is out of scope by design (Note 9) — never enumerate it. Record the bounded enumeration in
  the done report. **`CHANGELOG.md` (new file, D10/D11)** — H1 + reverse-chronological
  `## <semver> — <date>` sections, one per censused in-window release; each entry is that release's blurb as
  last edited before its supersession; pre-0.17.0 long blurbs lightly compressed to the short shape
  (never paraphrasing version claims beyond the sanctioned compression); short-shape blurbs
  relocated near-verbatim; **no `docs/specs/` citations** (A1 — drop or replace with issue/ADR
  citations at compression); the 0.16.0 entry carries the scope correction — the zero-engine-change
  claim scoped to the plan's work, with a dated, issue-cited (#1317) note that the release window
  shipped engine-path files from unbumped PRs #1280/#1294 — visibly a correction, never a silent
  rewrite. **`README.md`** — `## Status` keeps the current blurb (whatever release heads the rebased
  base), bold semver first, and gains one trailing no-bold link line to `CHANGELOG.md` (D12);
  insert the new checklist item before the Provenance item, renumbering so the Provenance bullet
  stays last (keeping "Every item above" true) with its anchor slug byte-verbatim (D14) — item
  text: **"Work scope is not release scope."** A claim about what *this plan's work* touched must
  not read as a claim about the *release window*; a window that absorbed unbumped landings names
  them or scopes the sentence. **`strip_prose()` resolution comment (D15)** — one sentence beside
  the `strip_prose()` definition: `CHANGELOG.md` is deliberately outside the enumerated
  absence-scan file lists, so relocated release prose trips nothing; a future guard that enumerates
  it must decide its own strip rule. Worded WITHOUT the composition literal — never `strip_prose`
  followed by a pipe or redirect character (the coupling-comment class; plan 4's census is the
  arbiter). **Count-word sweep (grep is a floor)** — confirm-zero for `seven-item`/`seven item`
  across `README.md`, `CLAUDE.md`, `CONTEXT.md`, `skills/` (0 at conversion), then hand-scan the
  checklist's own headings/intro and Releasing-adjacent prose for paraphrased count claims ("the
  seven checks", "all seven"); list stragglers as survey-derived corrections. ADR 0030's ratified
  "six rules" bullet is append-only posterity — never a sweep target. Run
  `node --test skills/war/assets/version-slots.test.mjs` and
  `bash skills/war-machine/war-pipeline-structure.test.sh` locally before hand-off; any red is a
  defect in the edit. Commits cite #1330 and #1317.
- Done when: `node --test skills/war/assets/version-slots.test.mjs && bash skills/war-machine/war-pipeline-structure.test.sh && grep -qF 'CHANGELOG.md' README.md`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.7: awk-degeneracy lesson — appended correction of the inverted mechanism sentence (#1399; folded 2026-08-15)

- Files: `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`
- Plan slice: the lesson's "Concrete instance" mechanism sentence states the degeneracy backwards —
  it claims the awk pass "loads nothing into `base[]`", when with a zero-byte first operand `NR`
  never diverges from `FNR`, so **every stdin record takes the loader branch: `base[]` fills from
  the LIVE dump and `live[]` stays empty**, and the `END` block walks a fully populated `base[]`
  reporting every live ref as `removed:` (#1399's reproduction: `base=2, live=0`; if `base[]` really
  stayed empty the guard would exit 0, the opposite of the exit 1 the lesson correctly concludes).
  The lesson's durable rule and its "How to apply" alternative are correct and untouched. Fix
  channel: an **appended dated `## Correction (2026-08-15, #1399)` section** stating the corrected
  mechanism — never an in-place body edit: plan 2's D8/A2 byte-froze the body, and the repo's own
  `resolved-section-fix-append-can-itself-misstate-which-mode-a-rule-applies-to` lesson governs this
  exact channel (state the corrected direction plainly; do not re-describe the wrong one beyond
  naming the inverted sentence). Pre-existing bytes above the appended section unchanged; the
  ADR 0043/0016 dated-note convention. Redaction lint stays green. Commit cites #1399.
- Done when: `grep -qi 'live dump' docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md && grep -qF 'Correction (2026-08-15' docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step (+ CHANGELOG head entry)

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb
  (replace-in-place, never an empty field, no badge) — to the **next free patch above the live
  integration base at land time**; never a resolved version literal (every version literal in this
  plan, the spec, and the roadmap is non-authoritative). **Expected integration base:** the tip
  after all thirteen 2026-08-06 campaign predecessors per the roadmap (ADR 0011 stack-and-plow) —
  this plan is the batch's terminal release, so the stacked baseline lag peaks here: resolve the
  next free patch from the four live slots themselves, never from any plan's arithmetic.
  **Standalone fallback:** run through plain `/war` off the master tip; same resolution rule, and
  Task 1.6's history census simply finds fewer entries. **Blurb duties:** the new `## Status` blurb
  replaces only the blurb paragraph and **keeps the trailing CHANGELOG link line** (A6, End state
  22); it passes the newly extended authoring checklist — including its own new work-scope vs
  release-scope item: this release's window is the batch-terminal window, so any absolute claim
  names its scope (release-blurb lesson family: count words match the enumeration; quoted literals
  byte-match landed identifiers; guard semantics stated no wider than the implementation — this
  release changes no guard behavior at all: notes, comments, pointers, README structure, and the
  new CHANGELOG are its whole surface). **CHANGELOG head entry (D17):** append this release's own
  `## <semver> — <date>` section at the top, matching the Status blurb's content in the short
  shape; future releases' head-entry freshness stays unguarded (A2, accepted residual).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- The mandatory manual same-scope surveys (End states 2, 5, 9, 10, 15, 19): ADR 0008's whole-file
  pointer read, the 18-step tour-narrative sweep, the C/H-block sibling comment scan, the ADR-note
  byte-unchanged diff check, the CHANGELOG history enumeration, and the count-word paraphrase scan ·
  why deferred: hand-scans cannot be mechanical gate members; done-report-only evidence, which
  gate-audit reads as SOFT and never a hold · runner: each task's worker records the outcome
  (mandatory statement even at zero stragglers); auditors re-run the same-scope scan at the pinned
  `audit_sha`; the Lead re-runs End states 1–19's greps at phase close.
- Every dated snapshot in this plan re-measured at the task's rebased dispatch base (the
  eight-bullet block count, the six-term count, the two guard-header phrases, tour line values, the
  VACUOUS site count, the strip_prose composition census, the D10-bounded release-history window,
  the seven-item zero count) · why deferred: this plan trails up to thirteen landed predecessors — every
  conversion figure is a `6fff2ee` snapshot · runner: the witness/census steps in Tasks 1.1, 1.2,
  1.4, 1.6, recorded in done reports; drift is stop-and-report, never silent adaptation.
- `CHANGELOG.md` head-entry freshness after this plan (A2/D13/D17) · why deferred: deliberately not
  a fifth version slot — guarding it was resolved against to keep release friction flat · runner:
  the next doc-truth sweep; accepted residual.
- The `## Status` → CHANGELOG link line's survival across **future** releases (A6) · why deferred:
  nothing pins it — pinning was resolved against with version-slots.test.mjs held unchanged ·
  runner: release authors (Task 2.1's directive names the duty for this release); the next doc
  sweep thereafter; accepted residual.
- ADR 0046's reach over `CHANGELOG.md` (A1) · why deferred: the plan complies unconditionally, so
  the reading is never load-bearing here · runner: /red-team ratifies the ledger row; the
  doc-cli-consistency corpus owners decide any future enumeration.
- *(amendment 2026-08-15)* End state 23's bytes-unchanged-above-the-appended-section half, and the
  ADR 0033 note's live-set re-verify (the exit-2 enumeration restated from the guard's own header at
  the rebased base, not from #1398's snapshot) · why deferred: diff-shape and rebased-base hand-reads ·
  runner: Tasks 1.7 and 1.1's workers state them in their done reports; gate-audit reads them SOFT.

## Notes / conscious deviations

1. **Rule 7 (guard-split deps-edge) is not triggered.** This plan authors no mechanical guard at
   all — it is a doc/comment truth sweep whose arbiters (version-slots, stage-workflow,
   pipeline-structure, auditor-guard suites, the redaction lint) all pre-exist and stay unchanged.
   Phase 1's seven tasks are mutually file-disjoint with no content dependencies; one wave, no deps.
2. **Predecessor-consistency check (recorded).** All thirteen committed 2026-08-06 plans' `- Files:`
   lines were read at conversion. None touches this plan's Phase 1 footprint files (the four ADRs,
   the tour, `hooks/validate-auditor-git.test.sh`, `stage-workflow.mjs`, the archive lesson,
   `CHANGELOG.md`) except: **plan 4** owns `skills/war-machine/war-pipeline-structure.test.sh`
   (this plan adds one comment sentence after plan 4's refactor lands — witnessed in Task 1.6);
   every plan's release task owns `README.md`'s Status blurb (Note 3); and *(re-census 2026-08-15)*
   the gate-audit-finding-routing plan's own 2026-08-15 amendment (its Task 2.2, #1412) now adds a
   message-content case to `hooks/validate-auditor-git.test.sh` — it lands spine-earlier, so Task
   1.5 edits comment truth on top of the landed suite (additive, construct-disjoint: Task 1.5
   touches C11/H5 rationale comments, not the new denial-diagnostics case). Read-side couplings verified
   against the committed plan texts: plan 11 pins the war-strategy SKILL §2 block byte-unchanged
   (my ADR 0030 note's subject); plan 12 edits war SKILL.md's Gate-2 bullet, and plan 13's pointer
   work lands a trigger-pointer bullet **inside** the Invariants section itself — but at clause
   granularity the never-`--force`/`reset --hard`-on-shared-branches clause ADR 0008's repaired
   pointer anchors on (End state 6's grep) is untouched by both, as is design.md § "6. State &
   resume"; plan 2's escape-guard header edits leave both phrases ADR 0033's note cites byte-intact.
   Task 1.2's witness step re-verifies the clause at the rebased base regardless. ADR-head arithmetic: predecessors edit ADRs 0043/0045/0046 and create 0047
   (plan 13); this plan creates none and amends only 0008/0025/0030/0033 — untouched by every
   predecessor; the next free ADR number at this plan's base is 0048 and stays unconsumed.
3. **Release-surface contention honesty (why this plan lands last).** Task 1.6's README edits are
   *structural* (Releasing checklist insertion, Status link line) — NOT the sanctioned
   slot-bump-overlap every sibling release task shares. Every predecessor release rewrites the
   `## Status` blurb via replace-in-place; had this plan landed earlier, a later predecessor's
   blurb replacement could silently drop the un-pinned link line, and the CHANGELOG would be born
   incomplete. Landing last closes the window: stack-and-plow serializes the plans (no two diffs in
   flight against one base), Task 1.6 sees the final predecessor blurb, and the only remaining
   rewrite is this plan's own Phase 2 — whose directive explicitly preserves the link line and
   appends the head entry. This is the batch's only real release-surface contention, resolved by
   ordering, and the roadmap must carry the three declared upstream edges (plans 4, 11, 12 → this)
   plus a `## Shared-file contention` row for `README.md` (structural vs slot-bump) and
   `skills/war-machine/war-pipeline-structure.test.sh` (plan 4 refactor vs this comment).
4. **Release phase appended — knowing deviation from the spec's "no version bump" row (D16),** via
   the row's own if-wrong arm. Reasons: the batch ships every plan as its own consumer-visible PR
   with a release phase; this plan's deliverables (a new packaged `CHANGELOG.md`, README structure)
   are marketplace-visible; and shipping the plan that *corrects the unbumped-landing defect*
   (#1317: engine files under an unbumped window) as itself an unbumped landing would be
   self-refuting. Logged for /red-team ratification.
5. **Triad self-adjudication (--afk):** no new CONTEXT.md terms (ordinary language; spec §6
   adopted); no new ADRs (append-only amendment channel carries every ADR-side change; the
   CHANGELOG introduction is housekeeping recorded by this plan + the strip_prose comment — spec §7
   adopted); release phase appended (Note 4). Genuine-operator-decision scan: the CHANGELOG
   introduction is a new repo convention, but the spec's resolved rows settle its shape end-to-end
   (file shape, content source, compression rule, 0.16.0 correction, Status link, not-a-slot,
   checklist keep-and-extend, guard non-interaction) — no unresolved design fork remains, so
   nothing here is SKIP-and-report grade.
6. **Check sharpenings vs the spec (logged for /red-team):** End state 10 widens the spec's
   `grep -qi 'fail loud'` to `grep -qiE 'fails? loud'` and pins the comment wording, since the
   mandated trace naturally reads "fails loud"; End state 15's version list is demoted from a
   closed enumeration to a floor + census (the spec's four-version set cannot survive thirteen
   predecessor releases); End state 8 (stage-workflow suite green) and End states 13/19/20 are
   additive conversion checks the spec implies but does not enumerate.
7. **Posterity survivors.** The source spec, the nine issues' verbatim quotes, the archived
   memory's original body, ADR 0030's "six rules" Consequences bullet, ADR 0033's ponytail bullet,
   and ADR 0025's "five terms" bullet all keep their historical wording forever — append-only
   channels correct beside them, and no OLD-absent check in this plan may target ratified ADR bytes
   or archived posterity (the sweeps are scoped to live doctrinal surfaces and the two comment
   sites).
8. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized at the survey's erwin gate 2 from the merged nine-issue group (the ADR/comment
   truth sweep plus the operator-folded README/CHANGELOG pair); the spec's flagged [assumed] rows
   are carried as A1–A3 or retired with stated reasons; conversion-time judgments (D10 bounding and
   sharpening, D12 placement, D16–D19, A4–A6, Notes 1–7 and the grill patches in Note 9) are logged
   for /red-team ratification.
9. **Grill-directed patches (2026-08-13 volley), applied in place (AI-declared):** the D10/A5/End
   state 15 census **bound** — 0.15.0 through the rebased-base head, issue #1330's own scope line;
   the grill measured ~113 recoverable releases back to 0.5.0 (28× the in-scope set), so the
   original unbounded rule would have forced an honest worker into either a scope-defeating ~113
   entries or a stop-and-report. Full pre-0.15.0 archaeology is recorded here as a vetoable
   out-of-scope option for the operator — /red-team can widen the bound. Also applied: the
   convention-block positional fix (newest member, not "the eighth"); `grep -F` on the
   metachar-bearing literal checks (End states 2/15/16/18, Task 1.6's Done when) per this plan's
   own platform-law constraint; the tour's prefix-less approximate anchors (steps 8 and 12)
   promoted to first-class re-derivation targets in Task 1.4; Note 2's plan-13 coupling restated at
   clause granularity; and ADR 0008's citation re-characterized as form-forbidden (line-accurate at
   the base) rather than value-rotted. The grill's execution run otherwise held the plan: all nine
   defects reproduced live, `expect_deny`'s fail-loud trace proven in sandbox, and a mocked landed
   state ran the End-state checks green including `version-slots.test.mjs` against the planned
   README shape.
10. **Amendment (2026-08-15, operator-directed): #1398 and #1399 folded.** Both are plan-2
    phase-close follow-ups in this sweep's exact family. #1398 extends the ADR 0033 correction note
    Task 1.1 already appends (one note carries #1266's ponytail correction and #1398's two
    Decision-2 corrections — same Correction-note channel, same file, no new task). #1399 becomes
    file-disjoint Task 1.7 — the lesson-body inversion cannot ride a description stamp (plan 2's
    D8/A2 byte-freeze is exactly why the wrong sentence survived), so the sanctioned appended
    dated-correction channel applies. Amendment surfaces: header issue map, Task 1.1 slice + Done
    when, Task 1.7, End states 3/20/23, the redaction-lint constraint (three learnings edits),
    build order + Note 1 (seven tasks), Note 2's re-census (the gate-audit-finding-routing
    amendment's new `validate-auditor-git.test.sh` case, spine-earlier). Not folded here: #1396 and
    #1397 (escape-guard mechanics, not doc truth — they stay open for their own round). Logged for
    this plan's /red-team pass.

## Open decisions

None. The spec's design tree is fully resolved; every spec-flagged [assumed] row is carried into the
ledger with a fallback or retired with a stated reason, and every conversion-time judgment is logged
above for /red-team.
