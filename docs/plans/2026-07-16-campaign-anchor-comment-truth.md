# Campaign anchor comment truth — the landed fail-open comments state the real bare-repo contract, and the hook suite asserts its own hermeticity

Plan file: `docs/plans/2026-07-16-campaign-anchor-comment-truth.md`
Source spec: [docs/specs/2026-07-16-campaign-anchor-comment-truth-design.md](../specs/2026-07-16-campaign-anchor-comment-truth-design.md)
Issues addressed: #927, #928
Stacks on: `docs/plans/2026-07-16-aftermath-class1-gate-evidence.md` — **queue position 5** in its campaign; expected integration base is the **working tip after aftermath-class1-gate-evidence lands, including its release bump** (ADR 0011 stack-and-plow), itself stacked on `learnings-recipe-drift-sweep` (3) on `structural-test-integrity` (2) on `land-failure-recovery` (1). Contention verified 2026-07-16, all four predecessor plans read in full:

- `hooks/inject-campaign-state.sh`, `hooks/inject-campaign-state.test.sh` — **no predecessor touches `hooks/` at all** (verified by Files-list sweep of all four plans). Independent lane.
- `skills/war-campaign/assets/campaign-ledger.mjs` — untouched by every predecessor. Plan 1 edits `skills/war-campaign/SKILL.md` (step-4 ordinal threading) — a **different file**; its header's speculative "campaign-anchor-comment-truth may share `skills/war-campaign/SKILL.md`" row is hereby **resolved: no overlap** — spec §9 explicitly excludes the SKILL.md composed one-liner illustration from this plan's scope. **Roadmap-author note:** the campaign roadmap's shared-file contention table needs no row for this plan beyond the serial release slots; plan 1's speculative row can be annotated resolved-disjoint (recorded here because a plan cannot edit a sibling plan).
- `docs/adr/0016-campaign-compaction-survival.md` — untouched by every predecessor (plan 1 authors a **new** ADR at the next free number; no plan amends 0016).
- `docs/learnings/` — file-disjoint from all lesson-touching predecessors: plan 2 edits `glob-literal-fools-…` and `pt-tagged-…`; plan 3 edits `process-recipe-lesson-body-…`; plan 4 edits `aftermath-remote-stranded-…`. This plan's two lessons (`git-common-dir-anchor-idiom-fail-open-gotchas.md`, `git-probing-hook-requires-fixtures-outside-any-git-repo.md`) appear in no predecessor's Files list. Plan 3's worked-example dry run and plan 4's inbound-wikilink check **read** `docs/learnings/` at their own earlier dispatch trees — read-only, before this plan edits anything; no interaction.
- `CONTEXT.md` — **not in this plan's footprint** (spec §6: no new domain terms — accepted, with one precision: "main checkout" and "fail-open" are in the glossary; "hermetic" is established in skill/test prose only, and a test-setup guard is not domain language). The plans-1/3/4 `CONTEXT.md` contention does not extend to this plan.
- `skills/war-machine/war-pipeline-structure.test.sh` — plan 4 **edits** it (new Class-1 criterion); this plan only **runs** it (End state 9). Read-only consumer of the post-plan-4 suite; no file contention.
- Release slots — all five campaign plans bump the four slots, **serial by stack order**, each resolved from the **live slots** at land time (never a plan literal).

> **Adversarial-grill adjudication notice (2026-07-16, conversion + grill live probes, git 2.50.1):** three spec details are corrected by this plan, reality winning — validation criterion 8's allowlist (below); §3's single block-comment contract at the ledger site (superseded by End state 2's site-specific contract: bare there is a probe **success** returning an anchored absolute path — not fail-open); and §3's ADR-handling row + §7 (superseded by Q28's red-team reversal: appended dated amendment, ratified text byte-unchanged). **Spec validation criterion 8's sanctioned-carrier allowlist is incomplete against the live tree:** the correcting spec itself — `docs/specs/2026-07-16-campaign-anchor-comment-truth-design.md`, already committed (survey commit `docs(specs): survey 2026-07-16 …`) — carries the banned enumeration pairing on ~5 lines (its §1/§4/§10 quote the false text in order to correct it), and this plan file plus its anticipated `/red-team` report (`docs/red-team/2026-07-16-campaign-anchor-comment-truth.md`) will too once committed. The criterion as written fails on day one against its own paperwork. Corrected allowlist in End state 10. Precision notes, same criterion: of the spec's "two lesson files", only `git-common-dir-anchor-idiom-fail-open-gotchas.md` actually carries the pairing (`git-probing-hook-…`: zero hits — harmless overcount, stated exactly); `docs/red-team/2026-07-15-campaign-state-anchor.md` verified no-hit. The spec's live bare-repo facts verified true in-tree (probe exits 0 printing the bare git dir — **and a subdirectory of a bare repo resolves upward to it**; `--is-inside-work-tree` exits 0 printing `false` in a bare repo; non-repo probe exits 128 empty). The spec file stays uncorrected (point-in-time record; this plan + the grill record is the authoritative correction, per `redteam-adjudication-is-authoritative-version-source`).

## Commander's Intent

- **Purpose:** Phase 1 of campaign-state-anchor (landed 2026-07-15) put the ratified
  `git rev-parse --path-format=absolute --git-common-dir` main-checkout anchor into
  `hooks/inject-campaign-state.sh` and `resolveCampaignDir` in
  `skills/war-campaign/assets/campaign-ledger.mjs`, with ADR 0016's amendment recording the
  decision. Two follow-through gaps were memory-mined from that phase, and one verified fact
  drives both. (#927) All four comment spots at the three landed sites — the hook's anchor
  comment block above the `common=` capture line (its final FAIL-OPEN sentence is the hook's
  **only** "bare" carrier), `resolveCampaignDir`'s leading block comment *and* its catch-arm
  comment, and ADR 0016's "Amendment (2026-07-15)" decision parenthetical — enumerate "git
  absent / not a repo / bare" as probe-**failure** cases that leave the caller's root untouched.
  That is false for bare: the probe **succeeds** inside a bare repo (exit 0, prints the bare
  repo's own git dir — live-proved; bare never reaches the ledger's catch, ENOENT and exit-128
  do), so the success arm runs and the anchor reassigns the root to the bare git dir's parent.
  Today's consumers degrade harmlessly (no `.claude/campaigns` markers there — fail-open *one
  level down*), but the comments state the idiom's contract, and a future caller copying it into
  a context where a bare-dir resolution carries the expected marker inherits a real mis-anchor.
  (#928) Since the anchor landed, the hook git-probes **every** root it is handed, so every
  fixture in `hooks/inject-campaign-state.test.sh` is git-probed — yet the suite's hermeticity
  (its `mktemp -d` workspace landing outside any repo) is an accident nothing asserts: an
  enclosing repo would silently re-root the scan and injection-path cases would fail far from
  the cause (exactly which cases depends on what the enclosing repo's main checkout carries —
  illustrative, not a checkable list). Close both: state the true contract at the three
  code-comment spots — superseding the ADR's parenthetical with an appended dated amendment —
  and make the suite's hermeticity a fatal setup assertion built from **the hook's own
  probe** — which auto-covers bare ancestors exactly where `--is-inside-work-tree` reports
  confusingly (exit 0 printing `false` — verified) and auto-tolerates git-absent (probe failure
  *is* hermeticity).
- **Method:** **Zero behavior change** — the hook's probe line, `resolveCampaignDir`'s logic,
  `is_active`, and ADR 0016's decision are byte-untouched; #927 is comment/prose truth, #928 is
  test-harness-only, and every existing test case (1–18) keeps its assertions byte-unmodified.
  **One content task** (grill Q22 adjudication): six small edits across six files with zero
  cross-plan contention and no parallelism need — one worker, one commit, one coherent
  `Survey:`/probe trail; the test-file edit in that same diff satisfies the requiresTest floor
  for the whole task. The reword **states the true contract rather than deleting the word**
  (spec §3), split by site. The **hook's** anchor block: probe-failure cases (git absent, not a
  repo) leave the root untouched; a bare/exotic layout is a probe **success** that resolves to
  a dir carrying no `.claude/campaigns`, so the hook still behaves fail-open one level down —
  worker latitude on block-comment wording **within that three-part content contract**. The
  **ledger's** leading block takes End
  state 2's **site-specific contract** (red-team adjudication, 2026-07-16 — the spec's single
  shared contract is measured false at this site): probe failure (git absent, not a repo, empty
  output) returns the relative path **untouched** (genuine fail-open); bare/exotic is a probe
  **success** returning an anchored **absolute** path under the bare git dir's parent — **not**
  fail-open, merely harmless (no `.claude/campaigns` there); the hook's "fail-open one level
  down" rationale is never copied here — worker latitude within that contract. The catch-arm
  one-liner is **verbatim** (`// git absent / not a repo — today's cwd-relative behavior`).
  **The ADR 0016 fix is an appended dated amendment, never an in-place rewrite (red-team
  adjudication, 2026-07-16, reversing the draft):** append a new `## Amendment (<land-date>)`
  section (date resolved at land, 2026-07-16 or later — the lesson-note date rule) carrying the
  corrected bare-repo contract, leave **every byte of the ratified 2026-07-15 amendment
  unchanged** (dated point-in-time record, superseded by pointer), and repoint only the
  **Status** line at the new amendment — the PR #922 / cd915c0 shape, the tree's only amendment
  precedent (a pure append; no in-place-rewrite precedent exists in this tree). The
  per-sentence bound is retired with the in-place shape; no breadcrumb inside the ratified
  text. Reviewers and every check in this plan target the **claim** (bare listed as
  probe-failure), never the token — the corrected wording still legitimately contains "bare"
  (spec §8). **No standing wording guard** (spec §3): the 2026-07-15 plan's pairing wraps across
  a line break (live-confirmed two-line-wrap defeat) and sanctioned carriers exist; land-time
  grep **floors** + mandatory hand-scan instead, verbs pinned — `git grep -n -i` (tracked-only;
  a repo-root find/grep drags ~100 stale worktree duplicates, the CLAUDE.md trap) plus one
  multiline pass (`rg -U -i` or an equivalent two-line-window pass) for wrapped pairings. The
  hermeticity assertion is a **fatal setup guard** immediately after the `cd "$WORK"` line,
  before case 1, mirroring the suite's jq presence guard (fail-fast setup, never a numbered
  `ok`/`no` case): the **two-step capture form of the hook's exact probe** (capture `&&`
  non-empty — the idiom's own mandated form; a composed one-liner masks failure as `"."`), on
  success printing one FATAL message in **probe-result phrasing** naming `$WORK` and the
  resolved `$common` ("the hook's probe at $WORK resolves (…)" — never "is inside a git repo",
  which states a wrong cause under ambient `GIT_DIR`), then `exit 1`. One check on `$WORK`
  covers every fixture: all per-case roots (R1–R18, `GMAIN`, `GWT`, `FAKEBIN`) are direct
  children of `WORK`, the deliberate case-12/13 repos are created **after** the guard's
  position, and git discovery walks upward — children never re-root sibling probes; the
  pre-existing `trap 'rm -rf "$WORK"' EXIT` still cleans up on abort. **Ambient git env is
  deliberately not sanitized** (grill Q9, decision recorded): the guard is the hook's own probe,
  so `GIT_DIR`/`GIT_CEILING_DIRECTORIES` affect guard and hook **identically** — the guard
  asserts exactly what the hook will see, and unsetting would be a behavior-adjacent setup
  change against the zero-behavior-change posture. `GIT_CEILING_DIRECTORIES` as a *fix* is
  likewise rejected — it would mask an enclosing repo instead of asserting its absence. No new
  env knob, macOS bash 3.2, cwd-independent (`common` is unused elsewhere in the test file;
  assignment-inside-`if` + `[ -n ]` are 3.2-safe). The guard's RED path is CI-unexercisable **by
  design** (BSD `mktemp` ignores `TMPDIR`; an override knob is spec-rejected): it is RED-proved
  once at implementation under **both** ancestor classes — a working tree **and** a bare repo
  (grill-verified both fire) — plus the `fakebin` git-absent probe, all transcripts **verbatim
  in the done report** (uncommitted, SOFT at gate-audit per
  `deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold`). Both cited lessons gain
  dated **body-only** notes with pinned prefixes — `Corrected (#927, <date>):` and
  `Mechanized (#928, <date>):` — deliberately **never a `[RESOLVED]` literal** (the
  `/lessons-learned migrate` pass archives `[RESOLVED]` lessons; both rules must stay hot),
  descriptions byte-untouched. Explicit gate duty rides the task: the refiner-dispatched gate is
  JS-only here (`refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind`), so the
  four checks are named commands, never assumed discovery.
- **End state:**
  1. **Hook anchor comment true** — in `hooks/inject-campaign-state.sh`, the anchor comment
     block above the `common=` capture line ends with corrected FAIL-OPEN prose: git absent /
     not a repo → probe fails, `$root` left exactly as resolved above; a bare/exotic layout is
     **not** a failure — the probe succeeds and resolves `$root` to the bare git dir's parent,
     which carries no `.claude/campaigns`, still fail-open one level down. The block's two-step
     capture-form mandate sentences are untouched. Post-fix,
     `git grep -n -i bare -- hooks/inject-campaign-state.sh` returns **only** the corrected
     success-case prose (the replaced sentence was the file's only carrier — verified). Executor:
     worker (read + grep, `Survey:` block); semantics per backstop 1.
  2. **Ledger comments true — site-specific contract** — `resolveCampaignDir`'s leading block
     comment states this site's **actual** contract (its "The probe FAILS OPEN: on any failure
     (…) …" sentence corrected, worker latitude within the contract): probe **failure** (git
     absent, not a repo, empty output) → the relative path is returned **untouched** (genuine
     fail-open); a bare/exotic layout → the probe **succeeds** and the dir resolves to an
     anchored **absolute** path under the bare git dir's parent — **not** fail-open, merely
     harmless (that dir carries no `.claude/campaigns`); the hook's "still fail-open one level
     down" rationale must **not** be copied here; the catch-arm comment is **verbatim**
     `// git absent / not a repo — today's cwd-relative behavior` (bare removed — it never
     reaches the catch; ENOENT and exit-128 do); the
     `// empty output — fail open to cwd-relative` line is untouched (no false claim). The
     bare-claim check on this file is **region-scoped to `resolveCampaignDir`'s comments** —
     the file's ~14 other `bare` tokens are the unrelated Files-extraction sense ("bare
     `- Files:`", "bare-path form", "bare ENOENT", "bare numbered-list",
     the `const bare` list-item match variable), pre-declared benign and out of scope (grill
     Q3). Executor: worker; semantics per backstop 1.
  3. **ADR 0016 corrected by an appended dated amendment — ratified text byte-unchanged** —
     `docs/adr/0016-campaign-compaction-survival.md` gains a new `## Amendment (<land-date>)`
     section (date resolved at land, 2026-07-16 or later — the lesson-note date rule) stating
     the corrected bare-repo contract: git absent / not a repo are the probe-failure cases that
     leave the scan root untouched; a bare/exotic layout is a probe **success** resolving to
     the bare git dir's parent, which carries no `.claude/campaigns` — fail-open one level
     down. Every byte of the ratified "Amendment (2026-07-15): campaign state anchors at the
     main checkout" section stays **unchanged** (dated point-in-time record, superseded by
     pointer — its parenthetical enumeration survives verbatim by design); only the **Status**
     line is additionally repointed at the new amendment (the PR #922 / cd915c0 append shape —
     the tree's only amendment precedent). Check: the landed diff on the ADR shows exactly the
     appended section plus the Status-line edit and nothing else. Executor: worker +
     landing-PR review.
  4. **Comment-only diffs** — the hunks touching `hooks/inject-campaign-state.sh`,
     `skills/war-campaign/assets/campaign-ledger.mjs`, and
     `docs/adr/0016-campaign-compaction-survival.md` contain **no executable-line changes**: the
     hook's `common=` probe line, all of `resolveCampaignDir`'s code, and `is_active` are
     byte-identical. Executor: refiner + gate-audit execution-evidence lens + landing-PR review.
  5. **Bare-claim sweep clean (floor + hand-scan, mechanically scoped)** —
     `git grep -n -i bare` over the hook, over the ADR's **new `## Amendment (<land-date>)`
     section only** (the ratified 2026-07-15 amendment's parenthetical survives byte-unchanged
     **by design** — End state 3's mandate; it is a sanctioned carrier in End state 10's
     allowlist, never a sweep failure), plus the region-scoped read of
     `resolveCampaignDir`'s comments (End state 2's scoping), yields no line — and, because the
     enumeration is known to wrap, no *sentence* — listing bare among the probe-failure /
     left-untouched cases. **Grep is a completeness floor, not a ceiling**: hand-scan each
     file's full anchor-block / `resolveCampaignDir`-comment / amendment-paragraph scope for
     same-meaning stragglers phrased without the token; list each found as a survey-derived
     correction. Executor: worker, recorded as a `Survey:` block in the commit body.
  6. **Hermeticity guard live, placed, form-exact** — `hooks/inject-campaign-state.test.sh`
     carries the fatal guard immediately after the `cd "$WORK"` line in the "Fresh hermetic
     workspace" setup block, before case 1: the two-step capture form of the hook's exact probe
     against `$WORK`; on probe success prints one FATAL message in **probe-result phrasing**
     naming both `$WORK` and the resolved common dir (never "inside a git repo" — wrong cause
     under ambient `GIT_DIR`), then `exit 1`; adds **no** numbered `ok`/`no` case (the final
     `N/N cases passed` count equals the pre-edit count at the dispatch base — 54/54 at
     authoring, non-authoritative snapshot); performs **no ambient-env unsets** (Q9 decision —
     the guard-equals-hook coupling self-tracks ambient env, stated in its comment); its comment
     states the coupling (the hook now git-probes every root; probe failure including git-absent
     IS hermeticity; cases 12–13 build repos *inside* `WORK` deliberately — children never
     affect upward discovery). The header `HERMETIC:` comment edit is **additive**: it gains the
     guarantee-is-now-asserted-not-assumed sentence while the existing
     `[[bsd-mktemp-ignores-tmpdir-gnu-only]]` citation and the TMPDIR rationale survive
     **intact** (that wikilink is a pre-existing local-root-only residual — do not "fix" or drop
     it). Executor: worker + suite run.
  7. **Guard REDs on violation — both ancestor classes (one-time implementation probes, soft
     by design)** — with `WORK` temporarily pointed at a directory inside (a) a git **working
     tree** and (b) a **bare repo** (grill-verified: a bare subdir resolves upward, the exact
     case `--is-inside-work-tree` cannot flag), the suite aborts before printing `ok 1`;
     restored, it passes. **Both probe transcripts recorded verbatim in the done report**;
     uncommitted by design (spec §8) — gate-audit treats the resulting cannot-confirm as SOFT,
     never a hold. Executor: Task 1.1 worker in-task (done report); /red-team's verification
     pass independently re-proves in throwaway sandboxes as its normal spine.
  8. **The guard adds no new git dependency before case 1** — phrased exactly so (grill Q8: the
     suite as a whole can never pass gitless — cases 12–13 hard-require real git — so
     suite-level gitless green is **not** claimed anywhere). Proof probe: a manual one-liner at
     implementation runs the guard's probe against `$WORK` with the suite's case-14 `fakebin`
     shim prepended to PATH — the probe fails (shim exits 127 → capture fails) and the guard
     passes: probe-failure-is-hermeticity. **Transcript recorded verbatim in the done report**
     alongside End state 7's. Executor: worker in-task (done report).
  9. **Suites green, assertions byte-unmodified — explicit gate list** — the task's gate duty
     runs, by name: `bash hooks/inject-campaign-state.test.sh` (green; every case-1–18 assertion
     block byte-unmodified), `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
     (green; **empty diff** on the test file — its `resolveCampaignDir` coverage (the "CLI
     `--campaign` anchoring" section drives the resolver end-to-end via the CLI in a real
     repo + linked worktree) is **behavioral**, and this plan changes no behavior; the suite's
     only text-level scan over this file is the bundled-routine token sweep
     (`ecc:`/`strategic-compact` tokens), which comment-only rewording must not — and does
     not — introduce; no test asserts on the comments' wording), `bash
     skills/war-machine/war-pipeline-structure.test.sh` (green **unmodified** — criteria 9/9b
     `has()` only `--git-common-dir` presence in SKILL files, untripable here; the suite at the
     dispatch base additionally carries plan 4's new Class-1 criterion, read-only here), and
     `node skills/_shared/war-memory.mjs lint docs/learnings/` (exit 0). The full JS suite at the
     refine gate subsumes the ledger suite; the explicit list exists because the
     refiner-dispatched gate is JS-only (never `resolveGate`-composed shell discovery).
     Executor: worker gate duty + refiner gate at the integrated tip.
  10. **Repo-wide carrier audit (floor + hand-scan, verbs pinned)** —
      `git grep -n -i 'not a repo'` (tracked-only — never a repo-root find/grep, which drags
      ~100 stale duplicates under `.claude/worktrees/`) **plus one multiline pass** for wrapped
      pairings (`rg -U -i` across the tracked tree, or an equivalent two-line-window pass), each
      hit classified for the bare-as-probe-failure **claim**, matches only: (a) the **corrected
      sites** (End states 1–2 — post-fix the hook and the ledger no longer carry the claim; the
      ADR is corrected by **supersession**, not removal — see (b)); (b) the **sanctioned
      carriers** per the adjudicated allowlist —
      `docs/adr/0016-campaign-compaction-survival.md` §"Amendment (2026-07-15)" (ratified dated
      record, byte-unchanged by End state 3's mandate, superseded by the appended
      `## Amendment (<land-date>)`),
      `docs/learnings/git-common-dir-anchor-idiom-fail-open-gotchas.md` (quotes the false text to
      correct it), `docs/specs/2026-07-15-campaign-state-anchor-design.md` §3 (variant "git
      missing, not a repo, bare" — still a match) and `docs/plans/2026-07-15-campaign-state-anchor.md`
      (dated point-in-time records; the plan's pairing **wraps across a line break** — the
      multiline pass exists for it), `docs/specs/2026-07-16-campaign-anchor-comment-truth-design.md`,
      this plan file, and `docs/red-team/2026-07-16-campaign-anchor-comment-truth.md` when it
      exists (correcting records); and (c) benign non-pairing uses carrying no bare claim
      (verified classes at authoring: "not a repo learning/test" in
      `skills/war-campaign/assets/snap-shared-docs.sh`,
      `docs/plans/2026-07-08-github-issue-lifecycle-…`, and
      `docs/specs/2026-07-16-aftermath-class1-…` (its hit is "not a repo test."), "not a
      repo?" in `skills/red-team/assets/assert-no-repo-escape.sh`, "not a repo-root …" in
      `docs/red-team/2026-07-03-…` — its sole member). **Grep is a
      completeness floor, not a ceiling** — hand-scan grep-adjacent wrapped lines in every
      match's file before ruling it sanctioned/benign, and hand-scan for same-meaning token-free
      stragglers. Hit set re-derived at the dispatch base (authoring snapshot,
      non-authoritative). Executor: worker, `Survey:` block; any non-sanctioned straggler
      outside this plan's Files routes per backstop 2 (expected zero).
  11. **Lessons annotated, hot, lint-clean — prefixes pinned** —
      `git-common-dir-anchor-idiom-fail-open-gotchas.md` §1 gains a dated body note prefixed
      **`Corrected (#927, <date>):`** stating the hook's and the ledger's comments now state
      each site's true contract and ADR 0016 carries an appended dated amendment superseding
      its parenthetical (the gotcha itself stays — it binds every future copy of the idiom);
      `git-probing-hook-requires-fixtures-outside-any-git-repo.md` gains a dated body note
      prefixed **`Mechanized (#928, <date>):`** stating the latent coupling is now a structural
      guarantee in this suite (the fatal hermeticity guard after the `cd "$WORK"` line — named
      construct; the durable audit-fixtures rule stays). Date = 2026-07-16 or later; **never a
      `[RESOLVED]` literal** (the `/lessons-learned migrate` pass archives `[RESOLVED]` lessons;
      both keep-hot rules must stay out of archive candidacy — plans 3/4's
      Mechanized/ENCODED precedent). Body-only; `description` and `metadata.keywords`
      frontmatter byte-untouched (projection budget — no MEMORY.md re-render duty); neither
      lesson archived or retyped — inbound wikilinks verified at authoring across hot root
      **and** `archive/` (gotchas ← `servitor-verify-…` + the git-probing lesson ×2;
      git-probing ← `servitor-verify-…`; **zero archive inbounds**; MEMORY.md rows are a
      generated projection, never a straggler; re-verify at dispatch), so hub discipline keeps
      both hot and no link repair is due. `node skills/_shared/war-memory.mjs lint
      docs/learnings/` exits 0. Executor: worker + lint.
  12. **Release** — all four version slots bump in lock-step to the next free patch above the
      live integration base; `skills/war/assets/version-slots.test.mjs` is the arbiter.

## Build order (for /war)

- **Contention (verified):** queue position 5 — **zero file overlap with any predecessor** (no
  plan touches `hooks/`, `campaign-ledger.mjs`, ADR 0016, or this plan's two lessons; plan 1's
  `skills/war-campaign/SKILL.md` speculation is resolved disjoint; `CONTEXT.md` untouched). The
  only shared surface is the four release slots, serial by stack order.
- **Why one content task (grill Q22, adjudicated):** six small edits across six files, zero
  contention, no cross-task symbol dependencies, and nothing gains from parallelism — one
  worker produces one coherent diff, one `Survey:` block, one done report carrying every probe
  transcript, and the test-file edit in that same diff is the requiresTest floor evidence for
  the whole task. Splitting would buy per-surface tier routing at the cost of three audit/refine
  cycles and defined-but-not-yet-emitted annotations between the guard and the lesson notes
  (Q18: with one task, all references are same-commit). The revert unit is the whole semantic
  change — reverting the reword alone or the guard alone has no use case.

1. **Phase 1 — Comment truth at the three landed sites + hermeticity guard + lesson notes**
   (one wave, one task)
2. **Phase 2 — Release** (four version slots, lands last per doctrine)

## Phase 1 — Comment truth at the three landed sites + hermeticity guard + lesson notes

### Task 1.1: The #927 truth reword, the #928 hermeticity guard, and the two lesson notes (one coupled task)

- Files: `hooks/inject-campaign-state.sh`, `hooks/inject-campaign-state.test.sh`, `skills/war-campaign/assets/campaign-ledger.mjs`, `docs/adr/0016-campaign-compaction-survival.md`, `docs/learnings/git-common-dir-anchor-idiom-fail-open-gotchas.md`, `docs/learnings/git-probing-hook-requires-fixtures-outside-any-git-repo.md`
- Plan slice: **First act: rebase onto the integration tip** (four predecessors' landings are on
  it; none touches these files — expected clean, re-verify at dispatch). Then, per spec §4 —
  **reviewers target the claim, never the token** (spec §8: the corrected text legitimately
  contains "bare"; a token-absence check would false-fail the fix itself):
  - **Hook (`hooks/inject-campaign-state.sh`):** in the anchor comment block above the `common=`
    capture line, replace the final `FAIL-OPEN: git absent / not a repo / bare → …` sentence —
    the file's only "bare" carrier (verified) — with the two-part truth (End state 1); worker
    latitude on wording **within the three-part contract** (probe-failure cases named; bare as
    probe success; marker-less dir ⇒ fail-open one level down). The block's TWO-STEP /
    composed-one-liner mandate sentences stay byte-identical (gotchas lesson §2's separate,
    still-true concern). No executable line changes.
  - **Ledger (`skills/war-campaign/assets/campaign-ledger.mjs`, `resolveCampaignDir`):** the
    leading block comment's "The probe FAILS OPEN: on any failure (git absent, not a repo,
    bare) …" sentence is corrected to End state 2's **site-specific contract** (latitude
    within it): probe failure (git absent, not a repo, empty output) ⇒ the relative path is
    returned untouched (genuine fail-open); bare/exotic ⇒ probe **success** returning an
    anchored absolute path under the bare git dir's parent — not fail-open, merely harmless
    (no `.claude/campaigns` there); never the hook's "fail-open one level down" rationale; the
    catch-arm comment is replaced **verbatim** with
    `// git absent / not a repo — today's cwd-relative behavior` (a one-liner cannot honestly
    compress "succeeds but harmless" and must not re-assert the false failure claim; the block
    comment above carries the full bare story); the `// empty output — fail open to
    cwd-relative` line is untouched. Comment-only diff to this file; the file's ~14
    Files-extraction-sense `bare` tokens are out of scope (End state 2's region scoping).
  - **ADR (`docs/adr/0016-campaign-compaction-survival.md`):** append the dated amendment per
    End state 3 — a new `## Amendment (<land-date>)` section carrying the corrected bare-repo
    contract; **every byte of the ratified 2026-07-15 amendment stays unchanged**; repoint
    only the **Status** line at the new amendment (the PR #922 / cd915c0 append shape;
    red-team adjudication 2026-07-16 — Q28 reversed, superseding spec §3's ADR row and §7).
  - **The guard (`hooks/inject-campaign-state.test.sh`):** immediately after the `cd "$WORK"`
    line in the "Fresh hermetic workspace" setup block, before case 1 — the two-step capture
    form of the hook's exact probe (sketch; final wording worker latitude within End state 6):
    `if common="$(git -C "$WORK" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" && [ -n "$common" ]; then`
    → print one FATAL line in probe-result phrasing, e.g.
    `FATAL: the hook's probe at $WORK resolves ($common) — fixture root is not hermetic` →
    `exit 1; fi`. Bash-3.2-safe by shape (assignment-inside-`if` + `&&` + `[ -n ]`;
    byte-parallel to the hook's own line; `common` is unused elsewhere in the file; `set -u`
    safe). **No ambient-env unsets** (Q9 decision — guard=hook coupling self-tracks
    `GIT_DIR`/`GIT_CEILING_DIRECTORIES`; state this in the guard comment). The guard comment
    also names: the hook now git-probes every root (main-checkout anchor); probe failure —
    including git absent — IS hermeticity; cases 12–13 build repos INSIDE `WORK` deliberately,
    and children never affect upward discovery from `WORK`. Mirrors the jq presence guard:
    fail-fast setup, **no** numbered `ok`/`no` case (count preserved); the pre-existing
    `trap 'rm -rf "$WORK"' EXIT` cleans up on abort.
  - **Header comment, same file:** **additive** `HERMETIC:` update — add the
    guarantee-is-now-asserted sentence; the `[[bsd-mktemp-ignores-tmpdir-gnu-only]]` citation
    and TMPDIR rationale survive intact (pre-existing local-root-only wikilink residual — leave
    it; comments track code per `source-comment-lags-emitted-prompt-after-rewrite`).
  - **One-time probes (End states 7–8, uncommitted by design):** (a) RED, working-tree
    ancestor — point `WORK` inside a git working tree; observe the FATAL abort before `ok 1`;
    restore; observe full green. (b) RED, bare ancestor — same under a bare-repo layout
    (grill-verified: a bare subdir resolves upward; this is the `--is-inside-work-tree`
    discriminator case). (c) git-absent — run the guard's probe as a manual one-liner against
    `$WORK` with the case-14 `fakebin` shim prepended to PATH; probe fails ⇒ guard passes.
    **Record all three transcripts verbatim in the done report** — SOFT at gate-audit, never a
    hold (`deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold`).
  - **Lesson notes (both `docs/learnings/` files):** per End state 11 — pinned prefixes
    `Corrected (#927, <date>):` / `Mechanized (#928, <date>):`, body-only, frontmatter
    byte-untouched, never `[RESOLVED]`; cite the corrected sites and the guard by **named
    construct** (the anchor block above the `common=` capture line; `resolveCampaignDir`'s
    leading/catch comments; the "Amendment (2026-07-15)" paragraph; the fatal hermeticity guard
    after the `cd "$WORK"` line) — same-commit, so no defined-but-not-yet-emitted annotations
    are needed; never line numbers. Re-run the inbound-wikilink check (hot root **and**
    `archive/`) before editing; no home paths, emails, handles, or credential shapes in the
    notes.
  - **Sweeps (End states 5 + 10):** run the scoped bare-claim sweep and the repo-wide carrier
    audit exactly as the End states pin them — `git grep -n -i` floor + multiline pass +
    mandatory manual same-scope hand-scan (wrapped lines; token-free same-meaning stragglers) —
    the full outcome recorded as a `Survey:` block in the commit body; in-footprint stragglers
    corrected in-task, out-of-footprint ones routed per backstop 2 (expected zero at authoring).
  - **Gate duty (explicit — the refiner-dispatched gate is JS-only here, per
    `refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind`):** run all four
    End-state-9 commands by name before commit: `bash hooks/inject-campaign-state.test.sh`,
    `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`,
    `bash skills/war-machine/war-pipeline-structure.test.sh`,
    `node skills/_shared/war-memory.mjs lint docs/learnings/`.
- requiresTest: true (mapped evidence: this diff **includes** the
  `hooks/inject-campaign-state.test.sh` edit, matched by the test floor's unconditional
  `**/*.test.sh` arm — the routing plan 4 verified in `skills/war/assets/assert-test-in-diff.sh`)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan rewrites shipped hook/asset comments and a shipped test asset
  (`hooks/inject-campaign-state.test.sh`) — users only receive it via a release. Bump all four
  release slots together to the **next free patch above the live integration base at land time**
  (never a resolved semver literal, per the /war-strategy §2 next-free-patch convention):
  `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`,
  and the `README.md` `## Status` line (replace-in-place, never emptied, no badge). Expected
  integration base: the working tip after this plan's Phase 1 lands, which stacks on the tip
  left by aftermath-class1-gate-evidence **including its own release bump** (queue position 5) —
  resolve from the **live slots**, never from any version literal in any plan of this campaign
  (stacked-release lag lesson). Standalone fallback: a run of this plan through plain `/war`
  resolves the next free patch from the four slots itself (no behavioral change rides this plan,
  so standalone execution is order-independent apart from the slots).
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End state 12).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Prose truth beyond the token floors** (spec §10.1–10.2 / End states 1–3, 5): the greps lock
  tokens and scopes; that each corrected comment *states* the probe-succeeds-but-harmless
  contract (not merely drops a word) is a semantic fact no grep proves · why deferred: the known
  ceiling of the grep-guard family (`structure-test-check-f-locks-presence-anywhere`), and the
  spec expressly rejects a standing wording guard (sanctioned carriers exist; the corrected text
  legitimately contains "bare") · runner: **/red-team's prose read** of spec §10.1–10.2 in this
  plan's verification pass + the landing-PR review (plan-4 precedent; ADR 0017 named owners).
- **Out-of-footprint carrier stragglers** (End state 10): any non-sanctioned
  bare-as-probe-failure hit the carrier audit finds outside this plan's Files (expected zero at
  authoring — the live sweep found only the three sites being corrected, the sanctioned
  carriers, and the enumerated benign classes) · why deferred: editing it in-task would exceed
  the task's Files, and the 2026-07-15 spec/plan carriers are dated point-in-time records the
  repo convention leaves uncorrected · runner: **the Lead** files one follow-up issue per
  straggler at phase close, from the Task 1.1 `Survey:` block (ADR 0017 — named owner, never a
  prose waiver).

## Notes / conscious deviations

- **Grill dispositions (2026-07-16), Q1–Q33:**
  - **Q1 (settled, folded):** the hook's FAIL-OPEN sentence is its only `bare` carrier —
    replacement scope is that sentence; End state 1 pins the post-fix single-file grep result.
  - **Q2 (settled):** ledger quotes match modulo wrap; bare never reaches the catch (ENOENT /
    exit-128 do) — the verbatim catch-arm replacement is honest.
  - **Q3 (changed-plan):** End state 5's ledger arm is region-scoped to `resolveCampaignDir`'s
    comments with the ~14 Files-extraction-sense `bare` tokens pre-declared benign — the sweep
    is mechanically executable, not per-run worker judgment.
  - **Q4 (superseded by Q28's red-team reversal):** the per-sentence bound is retired with the
    in-place shape — no parenthetical is edited; the ADR correction is an appended dated
    amendment with the ratified 2026-07-15 text byte-unchanged (End state 3).
  - **Q5 (settled, folded):** every git-semantics claim re-proven live, including the
    bare-subdir upward resolution — which upgraded the bare-ancestor RED probe from latitude to
    a mandated arm (End state 7).
  - **Q6/Q7 (settled):** guard sketch mirrors the hook's line byte-parallel; one guard on
    `$WORK` covers all fixtures (children only, created after the guard's position; trap set
    before the guard; jq-guard fail-fast shape).
  - **Q8 (changed-plan):** End state 8 is phrased "the guard adds no new git dependency before
    case 1" — cases 12–13 hard-require git, so suite-level gitless green is claimed nowhere.
  - **Q9 (adjudicated, no unset):** ambient `GIT_DIR`/`GIT_WORK_TREE`/`GIT_CEILING_DIRECTORIES`
    are deliberately not sanitized — the guard is the hook's own probe, so ambient env affects
    both identically (the guard asserts exactly what the hook sees; an exported `GIT_DIR` fires
    the guard loudly at setup rather than failing cases far from the cause); unsets would be a
    behavior-adjacent setup change against the zero-behavior-change posture. The
    ambient-env-sanitization lesson's failure mode (an env convention *silently* activating a
    code path in unrelated fixtures) is answered by loud-at-setup, not by masking. Recorded in
    the guard comment.
  - **Q10 (changed-plan):** guard message uses probe-result phrasing naming `$WORK` and
    `$common` — "is inside a git repo" would state a wrong cause under ambient `GIT_DIR`.
  - **Q11 (changed-plan):** the header `HERMETIC:` edit is pinned **additive** — the
    `[[bsd-mktemp-ignores-tmpdir-gnu-only]]` citation (a pre-existing local-root-only wikilink
    residual) and the TMPDIR rationale must survive intact.
  - **Q12 (changed-plan):** the spec's failing-case list "(5–8, 10–11, 15–18)" is imprecise
    (case 16 keeps passing unless the ancestor carries an active campaign) — the Purpose drops
    the enumerated list; no checkable claim copies it.
  - **Q13 (changed-plan, header notice):** criterion 8's allowlist extended with the correcting
    records (the committed 2026-07-16 spec, this plan, the anticipated red-team report);
    precision — only the gotchas lesson carries the pairing; `docs/red-team/2026-07-15-…`
    verified no-hit.
  - **Q14 (changed-plan):** sweep verbs pinned — `git grep -n -i` tracked-only floor (a
    repo-root find/grep drags ~100 stale `.claude/worktrees/` duplicates, the CLAUDE.md trap) +
    one multiline pass (`rg -U -i` or equivalent two-line window) + hand-scan.
  - **Q15 (settled):** inbound wikilinks verified (gotchas ← servitor-verify + git-probing ×2;
    git-probing ← servitor-verify; zero archive inbounds; MEMORY.md is a projection) — both
    lessons stay hot.
  - **Q16 (changed-plan):** lesson-note prefixes pinned (`Corrected (#927, <date>):` /
    `Mechanized (#928, <date>):`), never a `[RESOLVED]` literal — `/lessons-learned migrate`
    archives `[RESOLVED]` lessons and both rules must stay hot (plans 3/4 precedent).
  - **Q17 (settled):** plan-2 shape (body-only notes, frontmatter untouched) is the matching
    precedent — both durable rules remain fully live; descriptions projection-budget-safe.
  - **Q18 (follows Q22):** one task ⇒ all cross-references are same-commit; no
    defined-but-not-yet-emitted annotations needed; the guard is still cited by named construct.
  - **Q19 (settled):** nothing commits a test of git's own semantics — the guard asserts an
    environment property through the hook's own probe; bare-repo facts stay throwaway probes;
    the no-standing-wording-guard decision is evidence-backed (wrap defeat; legitimate "bare"
    retention; allowlist churn).
  - **Q20 (changed-plan):** the done report records **all** probe transcripts verbatim (both RED
    arms + fakebin) — the gate-audit trail.
  - **Q21 (settled, folded):** guard shape bash-3.2-safe; `common` unused elsewhere; `set -u`
    safe.
  - **Q22/Q24 (adjudicated, one task):** six small edits, zero contention, no parallelism
    need — one worker, one commit, one Survey/probe trail; the in-diff `**/*.test.sh` edit
    satisfies the requiresTest floor for the whole task (requiresTest: true, honestly mapped).
    The forfeited alternative (three tasks with docs-tier routing for lessons/ADR) buys cheaper
    workers at the cost of three audit/refine cycles and cross-task annotations — rejected for
    this footprint. Revert unit = the whole semantic change.
  - **Q23 (settled — kept):** Phase 2 release in sibling form + the stacking header (queue
    position 5, base = plan 4's landed tip incl. its bump, ADR 0011); the spec's §5 omission is
    a campaign-convention gap, not a design decision.
  - **Q25 (changed-plan):** the gate list is explicit and named (four commands, End state 9) —
    the refiner-dispatched gate is JS-only and never discovers shell suites.
  - **Q26 (settled):** CONTEXT.md "None" accepted, with the precision that §6 slightly
    overstates ("hermetic" is skill/test prose, not glossary) — a test-setup guard is not domain
    language.
  - **Q27 (settled):** among `hooks/`, only `inject-campaign-state.sh` executes git against a
    caller-supplied root (`validate-auditor-git.sh` parses command text;
    `warn-bash-write-scope.sh`, `validate-worktree-scope.sh`, `validate-servitor-provenance.sh`
    execute no git; `is-inside-work-tree` appears nowhere under `hooks/`) — spec §3's "other
    hooks: no action" stands.
  - **Q28 (red-team-reversed, 2026-07-16):** the draft's in-place ADR fix is **reversed**. The
    claimed precedent was false: PR #922 / cd915c0 is a **pure append** — a new dated
    `## Amendment (2026-07-15)` section plus a Status-line pointer, zero ratified prose
    modified — i.e. precedent for exactly the dated-amendment shape; and landed plan 1 states
    the ratified-ADR convention (proposed dated amendment, never an in-task rewrite) three
    times on this very base. The correction therefore ships as an appended
    `## Amendment (<land-date>)` section, ratified text byte-unchanged, Status line repointed;
    still **no breadcrumb** inside the ratified text — the appended amendment is itself the
    correcting record.
  - **Q29 (adjudicated):** every spec §10 criterion has a named in-run executor —
    §10.1–10.2 → End states 1–3/5 (worker, `Survey:` block; semantics → backstop 1);
    §10.3 → End state 4 (refiner + gate-audit lens); §10.4 → End state 9 (worker gate duty +
    refiner); §10.5 → End state 6 (worker); §10.6–10.7 → End states 7–8 (worker, verbatim
    done-report transcripts, SOFT at gate-audit); §10.8 → End state 10 (worker; out-of-footprint
    stragglers → backstop 2); §10.9 → End state 11 (worker + lint). Backstops are therefore only
    the two rows whose runners are genuinely not in-run (red-team/PR prose read; Lead follow-up
    filing) — ADR 0017 named-owner form, nothing prose-waived. The probes are **not** backstop
    rows: the worker is the in-run executor; /red-team re-proving them in sandboxes is its
    normal verification spine, not a plan assignment.
  - **Q30 (changed-plan):** the task bullet carries latitude for the two block comments
    (hook: the three-part contract; ledger: End state 2's site-specific contract), the
    catch-arm replacement **verbatim**, and restates §8's target-the-claim-never-the-token
    rule.
  - **Q31 (settled):** every anchor resolves uniquely today (one `common=` line; one
    `resolveCampaignDir`; unique Amendment heading; unique "Fresh hermetic workspace" block +
    `cd "$WORK"` line; unique `HERMETIC:` header) — preserved, named-construct only.
  - **Q32 (settled):** #927/#928 open and matching; the source-spec line is kept (this header —
    /red-team greps it); standalone `/war` execution is order-independent apart from the release
    slots; /war files epics + task issues regardless.
  - **Q33 (settled):** no suite gap beyond the explicit list — the ADR has no test surface; the
    full JS suite subsumes the ledger suite; `war-pipeline-structure.test.sh` is untripable by
    these edits.
- **Conversion + grill live probes (2026-07-16, git 2.50.1), recorded:** bare repo →
  `git -C <bare> rev-parse --path-format=absolute --git-common-dir` exits 0 printing the bare
  git dir, and a **subdirectory** of the bare repo resolves upward to it; bare repo →
  `--is-inside-work-tree` exits 0 printing `false` (the rejected assertion form cannot
  discriminate by exit code); non-repo → the two-step probe exits 128, empty; fresh `mktemp -d`
  lands under `/var/folders` where the probe fails (hermetic today by construction). The suite
  passes 54/54 at the authoring base.
- **The guard adds no numbered case:** it mirrors the jq presence guard (fail-fast setup;
  aborting is the honest semantic — a non-hermetic workspace invalidates every case). End
  state 6 pins count-equality against the pre-edit dispatch base rather than the literal 54
  (literals rot — `plan-line-number-refs-stale-use-construct-locator` family).
- **Explicitly untouched surfaces (spec §9):** the hook's probe line and all executable code;
  `is_active`; `resolveCampaignDir` logic; every numbered test case's assertions; the
  `skills/war-campaign/SKILL.md` composed one-liner illustration (gotchas lesson §2's separate
  concern, correct in its always-in-repo Lead context — and the file plan 1 edits; keeping it
  out preserves the zero-contention footprint);
  `docs/specs/2026-07-15-campaign-state-anchor-design.md` and
  `docs/plans/2026-07-15-campaign-state-anchor.md` (dated point-in-time records — the parent
  spec's §3 false enumeration survives uncorrected per
  `spec-context-band-statement-of-drift-survives-code-changes-uncorrected`; this spec/plan pair
  is the correcting record); other hook suites (Q27); no `GIT_CEILING_DIRECTORIES` export
  (masking, not asserting); no standing banned-wording test; no ambient-env unsets in the suite
  (Q9).
- **requiresTest/tier routing:** Task 1.1 routes the base worker tier with its in-diff
  `**/*.test.sh` edit as mapped floor evidence (Q24); Task 2.1 is covered by
  `version-slots.test.mjs`; requiresPackaging false everywhere (meta-repo, no Dockerfile in the
  footprint).
- **Anchors by named construct throughout** — the anchor comment block above the `common=`
  capture line, `resolveCampaignDir`'s leading/catch comments, the "Amendment (2026-07-15)"
  heading, the "Fresh hermetic workspace" setup block and its `cd "$WORK"` line, the `HERMETIC:`
  header comment, the case-14 `fakebin` shim, lesson §1/§2 headings — never line numbers (they
  rot across the serial merge queue; every grep result and count in this plan is an
  authoring-base snapshot, re-verified at dispatch).

## Open decisions

- None — the Commander's Intent was ratified by the operator at the conversion volley
  (2026-07-16) with zero survivors (the grill marked no question operator-grade); the two
  drafter adjudications (Q9 no ambient-env unsets, Q22 one content task) and the red-team
  reversal (Q28: the ADR correction ships as an appended dated amendment, ratified text
  byte-unchanged) are recorded with rationale above, and the remaining latitudes
  (block-comment wording — hook within the three-part contract, ledger within End state 2's
  site-specific contract; guard message wording within End state 6's probe-result form) are
  worker-resolved within checkable End-state bounds.
