# Aftermath Class-1 post-delete residual-set verification — survivors vs. hold set after the batched remote delete

Source spec: `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md` (Survey Corps, 2026-07-22).
Issues addressed: #987. Extends the landed `docs/plans/2026-07-16-aftermath-class1-gate-evidence.md`
(its structure-test block and Class-1 prose are the surfaces this plan appends to).
Campaign: the 2026-07-22 survey, drafted by `/war-machine --afk`; no manifest predecessors — queue position
is roadmap-author latitude. Footprint contention verified 2026-07-22 across all nine sibling specs:
`skills/aftermath/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`, and this plan's lesson
file are named by **no** sibling spec; `CONTEXT.md` is named by **all nine** (cross-plan serial — see
Notes) and the four release slots are campaign-serial as always.

## AI-Commander's Intent

*(AI-authored under `/war-machine --afk` — ADR 0014 provenance; no operator ratification. The spec's
resolved design tree is the ceiling; the plan slice is the floor.)*

- **Purpose:** the batched Class-1 remote delete (`git push origin --delete`) is the one place in
  `/aftermath` where a construction bug converts directly into **silent remote data loss** — the
  code-verified lesson records the observed near-miss: an exclusion filter inside a piped
  `while read` subshell silently no-oped and let hold-meant refs flow into the delete batch, and git
  printed success. Every other destructive verb in the skill fails loudly; this one gap gets the same
  discipline: after the batch, re-list the remote and diff survivors against the deliberate hold set,
  so a failed delete or a lost hold-set ref **surfaces, never silently passes** — while ADR 0027's C3
  deletion bar stays byte-unchanged (verification adds evidence, no deletion path, no retry, no
  license).
- **Method:** prose-only encoding, matching how Class-1 executes (the Lead runs it by reading the
  SKILL — the ADR 0027 no-test-asset-family residual stands). One new subsection
  `### Class-1 remote deletes — post-batch residual verification` in `skills/aftermath/SKILL.md`,
  placed after the `### Class-1 local branches — the stranded-upstream -d refusal` subsection and
  before `### Class-4 join rule` (chronologically last among Class-1 subsections, when the batch
  actually fires), carrying the spec §4 six-item content in the SKILL's one-line-paragraph bold-lead
  style. Drift protection extends the **existing** Class-1 gate-evidence block in
  `skills/war-machine/war-pipeline-structure.test.sh` (banner cites the 2026-07-16 spec — kept):
  a sub-comment citing this spec plus two `has_i()` pins on discriminating mid-sentence prose
  anchors, each temp-break-proven; the block's four pre-existing assertions and both row-scoped pins
  stay byte-untouched. The source lesson's stale "not encoded anywhere" dated line is amended **in
  the same commit** as the SKILL edit; `CONTEXT.md` gains one glossary entry. No ADR, no
  mechanization, no gate-cell byte, no frontmatter byte changes anywhere.
- **End state:**
  1. **Subsection live, six items complete** — `skills/aftermath/SKILL.md` carries
     `### Class-1 remote deletes — post-batch residual verification` between the stranded-upstream
     `-d` refusal subsection and `### Class-4 join rule`, stating: (a) the pre-batch `git ls-remote`
     snapshot is **retained** (never retaken — the same snapshot the candidate set was derived
     from), the hold set is its exact-`refs/heads/`-name complement of the delete list, no
     re-classification; (b) the construction advisory — build the batch by explicit set-difference
     (sorted lists, `comm`-style), never an exclusion filter inside a piped `while read` subshell,
     naming the observed silent-no-op mechanism; (c) the two-sided diff — one fresh
     `git ls-remote --heads origin` post-batch; every hold-set ref survives by exact name (a
     missing one is a **data-loss row**; hold-set SHA drift is informational, concurrent pushes are
     normal), every delete-list ref is gone (a survivor is a **failed-delete row**, routine
     reporting, never silently re-batched); (d) the clean-verdict rule — the run does not report
     clean, under any flag **including `--afk`**, until the diff is empty or every discrepancy is a
     report row (verification-failed, never clean-with-a-footnote); (e) loss remediation — a
     data-loss row prints the snapshot SHA and the ready-to-run
     `git push origin <snapshot-sha>:refs/heads/<ref>` restore, executed only behind an interactive
     operator confirm, **printed-only under `--afk`**; (f) the hygiene note — `ls-remote` creates
     no local refs, honoring the objects-only/zero-refs probe discipline by construction.
  2. **Drift guard live inside the existing block, temp-break-proven** —
     `bash skills/war-machine/war-pipeline-structure.test.sh` exits 0 with two new `has_i()` pins
     on `skills/aftermath/SKILL.md` appended **inside the existing Class-1 gate-evidence block**
     (after its two row-scoped checks, before the summary printf), under a sub-comment citing
     `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md` (criterion-9b precedent:
     self-describing, nothing renumbered, banner comment untouched) — one pin for the
     survivors-vs-hold-set diff rule (working anchor `hold set`), one for the clean-verdict rule
     (working anchor `before declaring the run clean`); both anchors verified zero-hit in the SKILL
     **and** the test file at the authoring base (2026-07-22 — red pre-fix), final wording
     worker-latitude at implementation (mid-sentence position required, never sentence-initial);
     temporarily reverting the new subsection flips **both** new assertions red (runs pasted as the
     commit-body `Red-proof:` block per the file's header convention).
  3. **Keep-green + C3 byte-sacred** — the block's four pre-existing assertions
     (`has` on `git cherry`, `has` on `--unset-upstream`, the row-scoped keep-green
     `git merge-base --is-ancestor` pin, the row-scoped `exact ref being removed` pin) all still
     pass **byte-unmodified**, and `git diff` over the change shows the
     `| 1. Stray WAR branches |` table row byte-unchanged (ADR 0027 C3 — no gate edit).
  4. **Anchor discrimination** — each final anchor token greps to exactly one region of
     `skills/aftermath/SKILL.md` (the new subsection); no new pin anchors any multiply-occurring
     token (`grep -icF 'ls-remote'` = 6 at base — banned as an anchor). No mandated `has()`
     command pin; the sole permitted `has()` addition is Task 1.1's **optional** pin on the
     restore command's `:refs/heads/` colon-refspec form, itself zero-hit in both SKILL and test
     at base (discriminating).
  5. **Lesson amended, same commit** —
     `grep -F 'not encoded anywhere' docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`
     returns no hits; the 2026-07-16 dated line's trailing clause now records the residual-set
     verification as encoded 2026-07-22 into `skills/aftermath/SKILL.md` Class-1, naming
     `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md`; one line stays one line;
     the third body paragraph (the mechanism record) and the `description` frontmatter are
     byte-untouched (zero MEMORY.md projection impact); `metadata.keywords` gains
     `residual-set hold-set` (nested under `metadata:`, retrieval-only); the commit touching the
     lesson **is** the commit touching `skills/aftermath/SKILL.md`;
     `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  6. **Both sweeps executed, grep + mandatory manual survey, results in the done-report** —
     stale-claim sweep: `grep -rn 'not encoded' docs/ skills/`, every match adjudicated, then
     hand-scan the same-scope siblings (the source lesson's full body; the 2026-07-16 spec's §1
     Context band and §9; the aftermath-adjacent lessons in both memory roots — local-root content
     referenced by already-public slug only, never body text or paths) for same-meaning phrasings
     ("standing warning", "stays unencoded", "this lesson's warning"); the 2026-07-16 spec's
     Context band is **deliberately left uncorrected** (dated spec Context bands record drift as of
     authoring time — [[spec-context-band-statement-of-drift-survives-code-changes-uncorrected]]).
     Anchor-uniqueness sweep: each candidate anchor grepped against the SKILL and the test file
     (zero pre-existing hits), then hand-scan the Class-1 prose and the block's comments for
     same-meaning near-collisions ("surviving refs", "what remains", "left behind"); stragglers
     from either survey listed as survey-derived corrections.
  7. **Frontmatter untouched** — structure-test criterion 2 (`disable-model-invocation` on
     aftermath only, both frontmatter forms) still passes; every SKILL edit is body-only.
  8. **Glossary entry live** — `CONTEXT.md` carries **residual-set verification** in the house
     entry style (bold term + colon, short body, `_Avoid_:` line), anchored immediately after the
     **stranded upstream** entry (closing the Class-1 cluster: acknowledged-stranded →
     patch-equivalence probe → stranded upstream → residual-set verification), stating: post-batch
     re-list + two-sided diff of survivors against the pre-batch snapshot's hold set (exact-name
     complement of the delete list); missing hold-set ref = data-loss row with snapshot SHA +
     restore command; surviving delete-list ref = failed-delete row; not clean until the diff is
     empty or fully reported. _Avoid_: trusting the delete loop's own exclusion filter; declaring a
     sweep clean on push success alone; auto-retrying a failed delete into a second unverified
     batch.
  9. **Full shell suite green** — the repo's anchored shell-suite sweep (`hooks/` + `skills/`,
     never a repo-root find) exits 0.
  10. **Release** — all four version slots bump in lock-step to the next free patch above the live
      integration base; `skills/war/assets/version-slots.test.mjs` is the arbiter.

## Build order (for /war)

- **Contention (verified 2026-07-22):** within this plan, Phase-1 tasks are file-disjoint
  (Task 1.1: SKILL + structure test + lesson; Task 1.2: `CONTEXT.md`). Across the campaign,
  `CONTEXT.md` and the release slots are the only shared files — cross-plan **serial** (whichever
  plan lands later rebases over predecessors' landed entries by named anchor, neither modifying nor
  duplicating them); no sibling spec names any other file in this footprint.
- **Why one content phase:** no cross-task symbol dependency — Task 1.2's entry references the new
  subsection by named construct (*defined-but-not-yet-emitted; produced in Task 1.1, same phase*),
  so Phase 1 runs as one wave, no `deps` edges. The SKILL subsection, its drift-guard pins, and the
  lesson's stale-claim amendment interlock and are forced into one task: the guard travels with the
  fact it guards (same task, same diff), and spec criterion 5 makes the lesson amendment
  **same-commit** with the SKILL edit — splitting it into a sibling task would make that criterion
  unsatisfiable by construction.

1. **Phase 1 — residual-verification subsection, drift pins, lesson amendment, glossary**
   (wave 1: Task 1.1 ∥ 1.2, file-disjoint; no waves)
2. **Phase 2 — Release** (four version slots, lands last per doctrine)

## Phase 1 — residual-verification subsection, drift pins, lesson amendment, glossary

### Task 1.1: SKILL subsection + structure-test pins + same-commit lesson amendment (coupled task)

- Files: `skills/aftermath/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`, `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`
- Plan slice: **All three files land in ONE commit** (spec criterion 5: the commit touching the
  lesson is the commit touching the SKILL; the drift guard travels with the prose it pins — make
  the task's content change a single commit and let the auditor verify it on the pinned SHA).
  - **The new subsection** (`skills/aftermath/SKILL.md`, body-only): insert
    `### Class-1 remote deletes — post-batch residual verification` after the
    `### Class-1 local branches — the stranded-upstream -d refusal` subsection and before
    `### Class-4 join rule`, carrying End-state-1 items (a)–(f) in the SKILL's one-line-paragraph
    bold-lead style. Reuse the ratified vocabulary where the subsection touches existing doctrine
    — "exact `refs/heads/<ref>` name — never substring", "`git ls-remote` truth" — rather than
    paraphrasing (one voice per surface; the exact-name rule is stated once). Wording cautions
    from spec §8: the report vocabulary says "missing vs. **pre-batch snapshot**" (concurrent
    remote activity is a normal confounder — a mid-run human delete reads as a data-loss row, and
    the print-only `--afk` restore posture is exactly why the restore is never automatic); the
    snapshot is "**retained**", never "retaken" (re-snapshotting between classification and batch
    would let the window swallow a discrepancy); the failed-delete row reads as routine reporting
    (permissions and protected-branch rules make survivors plausible) — only the hold-set side is
    a data-loss signal. The construction advisory is advisory (names the `comm`-style
    set-difference and the banned piped-`while read`-subshell exclusion idiom; mandates neither —
    the verification is the backstop for **any** construction bug). The gate cell, the C3
    paragraph, the four-class table, `docs/aftermath/known-stranded.tsv`, and the frontmatter are
    byte-untouched.
  - **The drift-guard pins** (`skills/war-machine/war-pipeline-structure.test.sh`): append inside
    the existing Class-1 gate-evidence block — after its two row-scoped checks, before the summary
    printf — a sub-comment citing
    `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md` (self-describing;
    the block's banner, its rationale comments, and its four assertions byte-untouched; nothing
    renumbered) and two `has_i()` pins on `"$AFTERMATH"`: the survivors-vs-hold-set diff rule
    (working anchor `hold set`) and the clean-verdict rule (working anchor
    `before declaring the run clean`). Anchors are prose (sentence-case class ⇒ `has_i`, per the
    helper's own doc comment); both verified zero-hit in SKILL and test at the authoring base —
    **re-verify at dispatch**. Anchor-fix order, explicit: **land the subsection sentences
    first**; then fix the final anchor tokens against the landed sentences (mid-sentence position
    required); then prove discrimination (each anchor greps to exactly one region of the SKILL —
    End state 4) plus the anchor-uniqueness sweep (End state 6); then temp-break-prove both
    (subsection reverted ⇒ both red; paste as the commit-body `Red-proof:` block). The two
    `has_i()` pins are the mandated criterion; `ls-remote` variants stay banned as anchors —
    multiply-occurring (6 hits at base), the recorded whole-file-pin-discriminates-nothing class.
    **OPTIONAL, worker latitude (strengthen-under-latitude, never a mandate):** a third
    case-sensitive `has()` pin on the restore command's `:refs/heads/` colon-refspec form —
    grill-verified zero-hit in both SKILL and test at the authoring base (2026-07-22), so it is
    discriminating and would mechanically cover the data-loss recovery row otherwise guarded only
    by the prose-read backstop; if taken, same cheap temp-break proof, same sub-comment.
  - **The lesson amendment**
    (`docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`): amend the
    trailing clause of the existing 2026-07-16 dated body line **in place** — replace
    "…is not encoded anywhere and stays this lesson's standing warning" with a clause recording
    that the residual-set verification was encoded 2026-07-22 into `skills/aftermath/SKILL.md`
    Class-1, citing `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md`. One line
    stays one line; no second dated line. The third body paragraph stands unmodified as the
    mechanism record; `description` frontmatter byte-untouched (projection budget — descriptions
    drive MEMORY.md bytes; zero re-render obligation); append `residual-set hold-set` to
    `metadata.keywords` (nested under `metadata:` — a top-level `keywords:` is silently not
    indexed). Check: `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  - **The stale-claim sweep** (End state 6): after the edits, `grep -rn 'not encoded' docs/ skills/`,
    adjudicate every match; then the mandatory hand-scan of the named same-scope siblings for
    same-meaning phrasings. Known adjudications carried from the spec: the 2026-07-16 spec's §1
    Context band stays uncorrected (deliberate — dated-Context-band convention); this lesson's
    dated line is corrected by this task's own amendment. Record sweep results and any
    survey-derived corrections in the done-report; local-root lessons are referenced by
    already-public slug only (body content and local paths never enter gh-mirrored surfaces).
- requiresTest: true (mapped evidence: the `war-pipeline-structure.test.sh` edit in this diff —
  matched by the test floor's unconditional `**/*.test.sh` arm; the gate stays `resolveGate`
  self-discovery, no gate edits)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: CONTEXT.md — the residual-set verification glossary entry

- Files: `CONTEXT.md`
- Plan slice: Add **residual-set verification** in the existing entry style (bold term + colon,
  short body, `_Avoid_:` line), anchored **immediately after the stranded upstream entry** (named
  construct, never a line number) — closing the Class-1 glossary cluster. Content per End state 8,
  wording basis spec §6. The entry references SKILL prose produced in Task 1.1 —
  *defined-but-not-yet-emitted; produced in Task 1.1 (same phase)*. Adds no `_polish` token
  (guarded by `skills/war/assets/war-config.test.mjs`'s `sweptSurfaces` assertion) and no
  `war-survey-corps`/`war-aftermath` token (the structure test's `lacks` guards scan CONTEXT.md).
  **Cross-plan rebase note:** all nine 2026-07-22 sibling specs name CONTEXT.md — on any context
  collision at land time, re-apply by the named anchor (the **stranded upstream** entry), never by
  offset, neither modifying nor duplicating sibling entries.
- requiresTest: false — prose-only glossary entry (docs tier; glossary entries are broadly
  unguarded repo-wide, the accepted residual the 2026-07-16 predecessor records); End state 8's
  review read is the guard
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan rewrites shipped skill prose (`skills/aftermath/SKILL.md`) and a shipped
  test asset (`war-pipeline-structure.test.sh`) — users only receive it via a release. Bump all
  four release slots together to the **next free patch above the live integration base at land
  time** (directive — never a resolved semver literal): `plugin.json` `version`,
  `marketplace.json` `metadata.version` **and** `plugins[0].version`, and the `README.md`
  `## Status` line (replace-in-place, never emptied, no badge). Expected integration base: the
  working tip after this plan's Phase 1 lands, itself stacked wherever the campaign roadmap
  queues this plan — resolve from the **live slots** at land time, never from any version literal
  in any plan of this campaign (N stacked unlanded releases = N-step baseline lag). Standalone
  fallback: a run of this plan through plain `/war` resolves the next free patch from the four
  slots itself. `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial
  bump is a red test. Release blurb describes the verification additively ("post-batch residual
  verification for Class-1 remote deletes"); it introduces no rename, and per the recorded
  release-blurb lessons it must not describe the guard as covering more than it does (the
  verification is Class-1-remote-batch-scoped prose, not a mechanized floor).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- **Throwaway-repo demonstration** (spec §10.8): a scripted temp repo with a `file://` remote
  carrying refs H (hold) and D (delete); a deliberately buggy piped `while read` exclusion filter
  batches both into `git push origin --delete`; the post-batch `git ls-remote --heads` diff flags
  H missing from the survivors; `git push origin <snapshot-sha>:refs/heads/H` restores it at the
  snapshot SHA · why deferred: it proves git semantics plus the procedure the prose teaches — a
  committed behavioral test of git's own semantics is a spec §9 non-goal, and aftermath has no
  test asset family (ADR 0027 named residual) · runner: **/red-team, as an executable-proof probe
  in this plan's verification pass** (never committed).
- **Prose truth beyond the two pins** (spec §10.3): the pins lock two tokens, not semantics —
  subsection completeness (snapshot retained-not-retaken, exact-name complement, construction
  advisory, two-sided diff with SHA-drift-informational, clean-verdict rule naming `--afk`,
  restore posture interactive-confirm-only / `--afk`-print-only, hygiene note) is a prose fact ·
  why deferred: the known ceiling of the grep-guard family
  ([[structure-test-check-f-locks-presence-anywhere]]) · runner: the /red-team prose read of spec
  §10.3 + the landing-PR review.
- **First live Class-1 execution with the verification**: the next `/aftermath` run that fires a
  batched remote delete retains the snapshot, runs the two-sided diff, reports any discrepancy
  rows, and withholds the clean verdict on a non-empty unreported diff — with zero autonomous
  restores under `--afk` · why deferred: Class-1 is Lead-executed prose over live git state; not
  fixture-able in CI · runner: operator, at the next `/aftermath` invocation on the released
  plugin.

## Notes / conscious deviations

- **AFK provenance (ADR 0014):** intent and backstops are AI-declared — the `## AI-Commander's
  Intent` and `## Deferred validations (backstops — AI-declared)` headings are the provenance
  markers; nothing here is operator-ratified. Ratification path: /red-team validates this plan
  before /war executes it.
- **One coupled task where the 2026-07-16 predecessor used three (conscious deviation from the
  exemplar decomposition):** the predecessor split SKILL+test / CONTEXT / lesson into three
  parallel tasks; this plan folds the lesson into Task 1.1 because spec criterion 5 requires the
  lesson amendment **in the same commit** as the SKILL edit — a sibling task lands as a separate
  merge by construction and could never satisfy it. Same-file-→-same-task is untouched; this is
  same-*commit*-→-same-task, one step stricter, spec-forced.
- **Tone/scope vs. the format exemplars:** intent block matches the 2026-07-21 tighten and
  2026-07-22 seed exemplars (Purpose / Method / numbered checkable End state; trailing Release
  phase in directive form). Divergence: this intent is AI-authored (heading + provenance note
  above), and End state items carry their own proof shapes inline, following the landed
  2026-07-16 aftermath predecessor this plan appends to — its End-state style is the closest
  precedent for these exact surfaces.
- **Spec imprecision, grill-verified (2026-07-22):** the spec's drift-guard row claims "the only
  new command literal is `ls-remote` variants" — imprecise. The restore command's `:refs/heads/`
  colon-refspec form (and prose `snapshot`) are zero-hit in both `skills/aftermath/SKILL.md` and
  `skills/war-machine/war-pipeline-structure.test.sh` at base — discriminating anchor candidates
  the spec overlooked. Folded in as Task 1.1's **optional** third `has()` pin (worker latitude;
  the two mandated `has_i` pins stay the criterion). The spec file stays uncorrected —
  point-in-time record; this plan carries the authoritative correction, per
  [[redteam-adjudication-is-authoritative-version-source]].
- **Working anchors are non-authoritative:** `hold set` and `before declaring the run clean` are
  the spec's working anchors, both verified zero-hit in SKILL and test at the authoring base
  (2026-07-22; `grep -icF` = 0 for each, while `ls-remote` = 6 stays banned). The worker fixes
  final mid-sentence tokens against the landed sentences, re-proves zero-hit-before /
  red-pre-fix, and temp-break-proves both — End states 2 and 4 are the binding checks, not these
  literals.
- **CONTEXT.md contention is campaign-wide, serial, and roadmap-visible:** all nine 2026-07-22
  sibling specs name CONTEXT.md. Within this plan it is single-task-owned (Task 1.2); across
  plans, later-landing plans rebase over earlier entries by named anchor. **Roadmap-author note:**
  the campaign roadmap's shared-file contention table must carry `CONTEXT.md → (all nine plans)`
  and the four release slots → every plan with a Release phase — recorded here because a plan
  cannot edit sibling plans.
- **No agent-prompt surface is touched (checked, not assumed):** aftermath is Lead-executed skill
  prose with no `agents/*.md` or `workflow-template.js` counterpart — the both-prompt-surface
  split rule does not bind this plan.
- **Fail-closed doctrine unchanged:** a discrepancy blocks the clean verdict and is reported; no
  autonomous second delete batch, no autonomous restore under `--afk` (an unattended sweep must
  not grow ref-*creation* authority to compensate for its own delete bug; a concurrent deliberate
  human delete must not be resurrected unreviewed). Every new error direction is noise-only.
- **Self-adjudicated (spec-optional) decisions:** (1) the optional `metadata.keywords` append is
  **taken** — zero projection cost, retrieval gain, and the keywords field weighs ~8× body in
  ranked recall; (2) the glossary anchor is **after the stranded upstream entry** — the spec fixes
  the entry but not its anchor; the Class-1 cluster (acknowledged-stranded → patch-equivalence
  probe → stranded upstream) is the obvious home and the predecessor's anchoring precedent;
  (3) sweep-scope reads of the local memory root are read-only and reported by already-public slug
  only (the predecessor's counts-only rule for not-yet-public local content governs).
- **Lesson lifecycle:** the `ENCODED (aftermath-class1-gate-evidence)` description prefix remains
  accurate for what it names (the 2026-07-16 encodings) and is deliberately not extended — spec §9
  bans the description edit on projection-budget grounds. The lesson stays hot; with the standing
  warning now encoded, any future archive candidacy is `/lessons-learned` housekeeping, not this
  plan's business.

## Open decisions

- None. The spec's design tree resolves every fork; the two spec-optional points and the glossary
  anchor are self-adjudicated in Notes (AFK — no operator to stall on). Worker latitude: the final
  anchor tokens and the subsection's exact sentence wording, bounded by End states 1–4.
