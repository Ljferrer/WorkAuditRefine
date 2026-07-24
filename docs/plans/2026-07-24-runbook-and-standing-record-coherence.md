# Runbook and standing-record coherence — ledger adjudications contract, land-failed prose truth, doctrine anchor restore, manifest finalization, and micro-strays

Source spec: `docs/specs/2026-07-24-runbook-and-standing-record-coherence-design.md` (survey
2026-07-24, group `runbook-and-standing-record-coherence`, issues #1016 #1039 #1053 #1078 #1084
#1085 #1087 — #1078 part 1 is overtaken per the spec; only its parts 2–3 are in scope).

## Commander's Intent

- **Purpose:** eight independently re-verified drifts between WAR's standing records (runbooks,
  contracts, glossary, roadmap, guard text, test-comment census) and the behavior those records
  describe — seven surveyed for this plan plus one **campaign carry-over** from plan 1
  (`2026-07-24-land-advance-exit-contract-truth`, Task 1.2), whose plan-mandated T2.9 census
  wording two auditor seats code-traced false and the operator ratified correcting here — none an
  engine defect, every one misleading exactly the reader the record exists for (a recovering Lead,
  a relaunch operator, a `/war-review` miner, an auditor seat hitting a deny message, a future
  reader trusting a test's own account of the routes it discriminates). Realign
  every record with the live truth, restore the orphaned "never mined from arbitrary prose"
  doctrine anchor and drift-lock it, and widen the run-manifest contract so `/war-review` can
  honestly source token/tool totals — while the manifest stays fail-open telemetry that no code
  reads back and ADR 0008's resume ordering is untouched.
- **Method:** a prose/contract/guard-text-only truth sweep — `skills/war/assets/workflow-template.js`,
  the status enums, `land-decision.mjs`, and every floor script byte-untouched (spec constraint 1;
  an auditor finding them unmodified is confirming the design, not catching an omission). Every
  edit anchors by named construct (heading, bolded term, bullet label — line numbers rot across
  the serial merge queue). Historical artifacts are corrected annotatively, never rewritten (the
  2026-07-22 spec gets a dated bracketed note; the campaign roadmap's two cells move as
  bookkeeping). Same-commit coherence pairs stay in one task: the manifest-contract widening lands
  in the same commit as the `/war-review` consumer rewrite; the surfaces citing the new ledger key
  ride `deps` wave edges so no citation ever dangles. Each spec token sweep is a floor, not a
  ceiling — grep, adjudicate every match, then hand-scan the same-scope prose and record
  survey-derived corrections in the done report; a straggler outside all task footprints is
  reported (`war-followup`), never edited. Wording latitude on the 4.2/4.7 replacement texts is
  the worker's within the named-element floors (both arms in 4.2; the `=-attached` literal and no
  blanket adjective in 4.7).
- **End state:**
  1. Ledger contract closes the loop: the `## ledger.json — run state` jsonc block in
     `skills/war/references/schemas.md` names a top-level `adjudications` key (sibling of
     `phases` / `pr_url?`, run-long accumulation semantics) documented as carrying the rows
     **verbatim as threaded** — either args-contract row shape, preformatted string or
     `{ adjudicated|value, supersedes }` object — so the full re-thread is lossless by
     construction; the `Optional adjudications (array|null)` args-contract paragraph in the same
     file and `skills/war/SKILL.md` step 5's "record each row in the run ledger" both carry the
     parenthetical citation to that key (grep `adjudications` over both files shows the
     citations; each match adjudicated per spec §4.1).
  2. Two-path `held:land-failed` prose: the `held:land-failed` Outcome-handling bullet in
     `skills/war/SKILL.md` — located by its **2-space-indented, token-only** prefix
     `/^ {2}- \*\*`held:land-failed`/` and terminated at the next **same-indent** `/^ {2}- \*\*/`
     sibling, the construct `land-decision.test.mjs` already uses (the compact
     `` - **`held:land-failed`** `` wrap has **zero** occurrences in `SKILL.md`; it is
     *schemas.md*'s header form, never this file's) — carries both arms — a primary-land arm (retry spent: the bounded
     fresh-env re-land came back `environment`-classified a second time; expect a persistent
     environment, inspect before re-running) and a baseline-proceed arm (retry never dispatched —
     no chaining, deliberate — so the first manual re-run is genuinely the first fresh attempt) —
     both arms scoped, as the current sentence already is, to **gate-time `environment`-classified
     entries only** (the hold's other producers — `introduced`/`error` re-land arms, the primary
     `error`/`gate_failed` route, the dead/unrouted terminal else — are covered by the bullet's
     existing root-cause prose and stay untouched). No surface in `skills/war/` or `agents/`
     still states the unconditional **environment-retry** "already spent" claim: the
     `already spent` grep + same-scope hand-scan record is in the done report, with the two known
     keeps adjudicated (the sibling `environment` bullet's "the retry provably spent" — correct
     for the exhaustion path it describes; `workflow-template.js`'s ace-demotion string "the
     single ace attempt is already spent" — a different retry budget entirely). **This absence is
     mechanically guarded, not merely swept:** Task 1.3's new lock **(c)** (End state 6) asserts
     the extracted `held:land-failed` bullet carries **both arms** — so leaving the single
     unconditional sentence in place reds the gate. It is a **presence** key, not a
     `/already\s+spent/i` absence key: the sanctioned two-path text keeps "already spent" inside
     the *conditional* primary-land arm, so an absence key would red the correct text and pass
     the wrong one. The grep and the Lead's integrated-tip backstop sweep are the breadth layer
     over the rest of `skills/war/` + `agents/`; the lock is the depth layer on the one bullet
     this plan rewrites.
  3. Shared-mechanics duty present: the `### Recovery relaunch` section's **Shared mechanics
     (both entry points)** list contains a fourth, **Adjudication continuity** bullet — re-thread
     the full accumulated `args.adjudications` set from the ledger record (the `ledger.json`
     top-level `adjudications` key, citing `references/schemas.md`) alongside `args.recovery`,
     the same duty as the held-partial-phase runbook's step 4 — so both entry points inherit it.
  4. Manifest round-trip coherence: `skills/war/references/schemas.md`'s `## Run manifest` block
     documents a per-phase `envelope` aggregate (`totalTokens` / `totalToolCalls` / `agentCount`,
     each number-or-null, whole object nullable) on the MUST-carry list (binding-to-attempt,
     null-tolerated — the `workflowRunId` posture); `skills/war/SKILL.md`'s **On phase return**
     stamp list includes the envelope aggregates sourced from the Workflow task-completion
     envelope (unsurfaced ⇒ `null`) and `## Checkpoint` carries a **Manifest stamp (telemetry,
     fail-open)** bullet placed before the issue-lifecycle floor bullet; `skills/war-review/SKILL.md`
     contains no "manifest never carries them" claim (grep `never carries` over that file is
     empty); its §3 **total tool calls** row's Source cell reads "manifest `phases[].envelope`,
     else mined (transcripts)", and — because §3 today carries a **single combined row** whose
     metric label *is* the split (`total tokens — input / output / cache (split when
     available)`), which cannot simultaneously source from the envelope and stay mined — that
     one row is **split into two**: `total tokens` with Source "manifest `phases[].envelope`,
     else mined (transcripts)", and `token split — input / output / cache` with Source "mined
     (transcripts), `n/a` when unsourceable". §4 lists the **unfinalized phase record** friction
     signal (a phase record lacking `endedAt`, `tasks`, or `land` although the run ended or a
     later phase started). Sweep record (grep `manifest` over `skills/war-review/SKILL.md` +
     hand-scan of the §3 table and `## Scavenge`) in the done report.
     **Envelope provenance (attested, not assumed).** The three aggregate names are the
     harness's real task-completion envelope fields, observed on this campaign's own runs — WAR
     plan 1 phase 1 (`agentCount` 18 / `totalTokens` 1898609 / `totalToolCalls` 409), plan 1
     phase 2 (7 / 554519 / 159), and this plan's `/red-team` run (27 / 2108110 / 508). They are
     recorded here because nothing in the repo tree evidences the envelope shape, so a reader
     (or an auditor seat) cannot otherwise tell an observed field from an invented one; the
     null-tolerated posture stays, but it is a tolerance, not a cover for an unsourceable field.
     **Charter unchanged (the Purpose's "stays fail-open telemetry that no code reads back and
     ADR 0008's resume ordering is untouched" clause, made checkable here rather than left as
     unverifiable Purpose prose):** the `## Run manifest` block's fail-open / never-resume-input
     charter sentences are **byte-unchanged** by this plan — the widening ADDS the `envelope`
     aggregate to the MUST-carry list and edits nothing that describes what the manifest is for —
     and **no ADR 0008 surface is edited** (`git diff --name-only` for the phase contains no
     `docs/adr/0008-*` path). A grep for readers of `.claude/war/runs/*.json` across the repo
     returns no code reader, so the widening stays telemetry, never resume input.
  5. Doctrine anchor restored and cited: a **wrap-tolerant** repo-wide census of the phrase
     (whitespace-tolerant between tokens — at least one occurrence is wrapped across a line
     break, so a single-line grep silently drops it, exactly the defect class the
     misattribution-pairing lesson records; the census **enumerates every hit** rather than
     matching a pre-declared count, because a hardcoded count rots the moment any surface
     rewraps) finds it at exactly the expected homes — the `CONTEXT.md` `**Adjudication**:`
     term's `_Avoid_` line, `skills/war/SKILL.md` step 5's Provenance-discipline sentence
     (which Task 1.2 (e) writes carrying the **literal** phrase — see that slice's floor), the
     2026-07-22 spec's dated correction note, the learnings lesson bodies (left as records —
     note `spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong.md` carries **multiple**
     occurrences, two of them wrapped), **this plan and its source spec**
     (`docs/plans/2026-07-24-runbook-and-standing-record-coherence.md`,
     `docs/specs/2026-07-24-runbook-and-standing-record-coherence-design.md` — planning
     artifacts that quote the doctrine to specify it; **leave**), and the new test lock — and
     nowhere else unexpected (classification record, enumerating every hit with its ruling, in
     the done report).
  6. New locks green and red-provable: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
     passes with **three** new construct-anchored locks — (a) the `CONTEXT.md` `**Adjudication**:`
     block (extracted from the bolded term to the next bolded glossary term) matches the doctrine
     phrase with `\s+` between tokens, case-insensitive (wrap-tolerant — Task 1.3's regex floor);
     (b) the `## ledger.json — run state` jsonc block of
     `skills/war/references/schemas.md` names `adjudications`; **(c) a BOTH-ARMS PRESENCE key —
     the `held:land-failed` Outcome-handling bullet extracted from `skills/war/SKILL.md`
     (located by the 2-space token-only prefix `/^ {2}- \*\*`held:land-failed`/`, terminated at
     the next SAME-INDENT `/^ {2}- \*\*/` sibling — the in-repo precedent at
     `land-decision.test.mjs`) matches BOTH a primary-land-arm marker AND a
     baseline-proceed-arm marker** — the committed mechanical guard backing End state 2. It is
     deliberately **not** a bare `/already\s+spent/i` absence key: the spec's own sanctioned
     replacement text keeps "already spent" **inside the conditional primary-land arm**, so an
     absence key would red the *correct* two-path text and green the *unconditional* one only by
     accident. The defect End state 2 targets is the **unconditional framing**, not the token —
     so the lock asserts the two-path shape positively. Temporarily collapsing the bullet back to
     the single unconditional sentence reds exactly (c); temporarily removing either other
     referent reds exactly its lock (red-proofs recorded in the commit body, the file's house
     style). D18 and every existing row pass with their extraction constructs untouched.
  7. Guard text truth: `bash hooks/validate-auditor-git.test.sh` passes with zero
     assertion/expectation edits — J16 still finds the literal `=-attached` in the space-form
     deny stderr and every J-series `git branch` allow/deny outcome is unchanged. Absence floor
     (a **string set**, not one literal — the two corrected surfaces word the same blanket claim
     differently, so a deny-only grep would come back empty while the header comment's blanket
     wording survives verbatim). Each key must be **non-vacuous at the base**: it MUST match
     today, before any edit, or it can never discriminate a corrected surface from an untouched
     one. Both keys are **case-insensitive** (`grep -rin`) — the deny reword's likeliest shape is
     a sentence-initial recasing (`Takes only =-attached …`), which a case-sensitive grep would
     wave through — and the header key is **line-local by construction**, because the live header
     comment wraps mid-phrase across two lines with a `# ` continuation marker sitting inside it
     (`… With arguments, EVERY token` / `# must be an enumerated read flag with =-attached
     values`), so `EVERY token must be an enumerated read flag` matches **zero** times at the base
     and is a vacuous key — the exact wrap-blindness this plan calls out for the doctrine census
     in End state 5. The two keys, over `hooks/`, both returning nothing after the edit:
     (1) `grep -rin 'takes only =-attached' hooks/` — pre-change hit count **1** (the deny
     string); (2) `grep -rin 'an enumerated read flag with =-attached values' hooks/` —
     pre-change hit count **1** (line-resident on the header comment's second line). Record both
     pre-change counts in the done report so each floor is provably red-provable, not vacuous.
     Presence floor (the
     discriminating proof the reword actually landed — J16's surviving-substring pin alone cannot
     show it): the deny-message line greps positive for both shape classes — at least one
     `=-attached` value-flag form (`--contains=<rev>`) **and** at least one enumerated bare flag
     (`--list`) — with no blanket adjective covering the bare set, and the done report quotes the
     new deny string and header comment verbatim. The adjacent header comment states the same
     mixed-shape truth.
  8. Roadmap record honest: in `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md`,
     row 6's Files-owned cell lists `CONTEXT.md` and the shared-file contention `CONTEXT.md` row
     reads `2, 3, 4, 5, 6, 7`; nothing else in the file moves.
  9. Zero collateral drift: `node --test 'skills/**/*.test.mjs'` and the anchored shell-test
     sweep over `hooks/` and `skills/` green at the tip carrying all changes; the phase's
     `git diff --name-only <frozen phase base>...<integrated tip>` file list is a **subset** of
     the Phase-1 `Files:` union of this plan — **no file outside the union**, which is the
     collateral-drift property this condition exists to prove — and its **only** permitted
     absentee is `hooks/validate-auditor-git.test.sh`, Task 1.5's declared straggler-home slot,
     which is expected byte-untouched and therefore expected NOT to appear in the diff (each
     worker threads its task's name-only diff into its done report; gate-audit re-derives the
     union at the integrated tip and applies exactly this subset-plus-named-absentee predicate).
     Equality is deliberately NOT the predicate: `hooks/validate-auditor-git.test.sh` is in the
     union only so a survey-found straggler comment has an in-footprint home, so on the plan's
     own expected path (no straggler) an equality check would red the phase on a non-defect.
     The expected-untouched surfaces stay byte-identical unless a survey finds a straggler:
     `workflow-template.js`, `land-decision.mjs`, every floor script, and
     `hooks/validate-auditor-git.test.sh`.
  10. Release lands last: all four version slots in lock-step at the next free patch above the
      live integration base; `version-slots.test.mjs` green.
  11. T2.9 census accuracy (campaign carry-over from plan 1): in
      `skills/war/assets/provision-worktrees.test.sh`, the T2.9 block-comment census no longer
      asserts a uniqueness/universality claim about exit-3 routes — the strings `only SILENT`
      and `every one of which` both grep empty from that comment — while the paragraph stays
      **count-free** and still greps **zero** for `T2\.` (plan 1's End-state-4 floor, preserved),
      the `(b)`/`(c)`/`(d)` detail lines and all assertion code are **byte-unchanged**, and the
      replacement sentence remains truthful against `cmd_land_advance` as written (which has two
      silent bare-`exit 3` arms: the push-error branch and the post-push origin-readback
      mismatch). `bash skills/war/assets/provision-worktrees.test.sh` stays green.

## Build order (for /war)

1. **Phase 1 — Standing-record truth sweep + doctrine locks** (waves: 1.1 ∥ 1.4 ∥ 1.5 ∥ 1.6,
   then 1.2 (`deps: [1.1]`), then 1.3 (`deps: [1.1, 1.2]`) — all six tasks file-disjoint.
   1.3 is its own third wave because its both-arms presence lock (c) asserts against the
   `skills/war/SKILL.md` bullet 1.2 rewrites; run in the same wave as 1.2 it would be born RED)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Standing-record truth sweep + doctrine locks

### Task 1.1: Contract + consumer coherence — ledger `adjudications` key, manifest `envelope` aggregates, `/war-review` sourcing truth (#1016, #1078 parts 2–3)

- Files: `skills/war/references/schemas.md`, `skills/war-review/SKILL.md`
- Plan slice: **Ledger contract (spec §4.1, one shape correction — see Notes).** In the
  `## ledger.json — run state` jsonc block, add one top-level key, sibling of `phases` /
  `pr_url?`: `adjudications?` — an array carrying the rows **verbatim as threaded** in either
  args-contract shape (preformatted string or `{ adjudicated|value, supersedes }` object; the
  spec's jsonc sketch says "row strings", but its own parenthetical — "the same rows threaded as
  `args.adjudications`" — and the args contract's two admitted shapes are the checkable pair, and
  a strings-only record would make the "re-threaded in full" promise unmechanizable for object
  rows); commented as the run-long accumulated adjudication set (spec D8) that the recovery
  relaunch re-threads `args.adjudications` from; absent ⇒ none recorded. In the `## Workflow
  per-phase args contract` section's `Optional adjudications (array|null)` paragraph, extend
  "re-threaded in full — from the run-ledger record" with the citation "(the `ledger.json`
  top-level `adjudications` key above)". Row shapes and threading behavior unchanged — doc only.
  **Manifest contract (spec §4.4).** In the `## Run manifest` block's per-phase record, add
  `envelope: { totalTokens, totalToolCalls, agentCount } | null` — the Workflow task-completion
  envelope's aggregates, stamped at phase return; any field (or the whole object) the Lead cannot
  source is `null`, never transcript-derived (transcripts undercount ~20×, the incident's own
  finding). Add the envelope aggregates to the MUST-carry list with the binding-to-attempt,
  null-tolerated posture (`workflowRunId`'s). The manifest's fail-open / never-resume-input
  charter sentences are untouched.
  **Consumer (`skills/war-review/SKILL.md`, same commit as the contract widening — spec §8
  coherence pair (a)).** Three edits: (1) §2 (Mine the transcripts): replace the parenthetical
  "(do not fall back to the manifest for token counts — the manifest never carries them)" with
  the new rule — prefer the manifest's per-phase `envelope` aggregates for **totals** when
  present (the authoritative non-transcript source); the input/output/cache **split** remains
  transcript-mined and renders `n/a` when unsourceable, **and the rewritten sentence labels
  transcript-derived split values best-effort/possibly-undercounting** (the incident's own
  calibration: transcripts undercount tool calls ~20× against the envelope — a split presented
  unqualified beside envelope totals would invite exactly the false cross-sum the never-fabricate
  rule exists to prevent). (2) §3 (Tally) — **read End state 4 before editing; §3 has NO
  `total tokens` row today and this edit is a row SPLIT, not two cell rewrites.** The live table
  carries `| total tool calls | mined (transcripts) |` and ONE combined row whose metric label
  *is* the split: `| total tokens — input / output / cache (split when available) | mined
  (transcripts) |` (quote that label verbatim as your anchor). Do two things: set the **total
  tool calls** row's Source cell to "manifest `phases[].envelope`, else mined (transcripts)";
  and **split the combined row into two** — `| total tokens | manifest `phases[].envelope`, else
  mined (transcripts) |` and `| token split — input / output / cache | mined (transcripts),
  `n/a` when unsourceable |`. Rewriting the combined row's Source cell in place instead would
  claim envelope sourcing for a split the spec pins as transcript-mined-only, and End state 4's
  required second row would never exist — nothing else catches it (`requiresTest:false`, no
  `/war-review` prose lock, and the `manifest` keyword backstop is satisfied by the drifted row).
  (3) §4 (Friction): add one signal class — **unfinalized phase record**: a
  phase whose record lacks `endedAt`, `tasks`, or `land` **although the run ended or a later
  phase started** — evidence the phase-close stamp was skipped. That conditional clause is the
  deliberate killed-run discriminator: a run that died mid-phase leaves run `endedAt` null and no
  later phase, so the signal stays silent (the death already surfaces through the `held:*` /
  dropped-return signal classes); only a Lead that demonstrably outlived the phase and still
  skipped the stamp fires it. Never-fabricate discipline holds throughout: `n/a` whenever
  unsourceable, never an invented total. **Token sweep (floor, not ceiling):** grep `manifest` across `skills/war-review/SKILL.md`
  and reconcile every claim about what the manifest carries with the widened contract; then
  hand-scan the §3 tally rows and the `## Scavenge` section for indirect "never carries"
  paraphrases the keyword grep misses, listing each straggler as a survey-derived correction in
  the done report. **`land-decision.test.mjs` reads `schemas.md` at FIVE sites, not two — run
  `node --test 'skills/**/*.test.mjs'` locally before you commit and do not assume this file is
  out of scope.** Two are the doc-parity extractions (the `landDecision` enum line and the
  per-value bullets — genuinely untouched here), but three more reach the blocks this task edits:
  a second `landDecision` enum-line read in the D9 helper, a **task-status enum anchor that sits
  INSIDE the `## ledger.json — run state` jsonc block you are editing**, and D9's enum-leak
  detector, which is fed the **entire file**. So both edited blocks are in D9's scan scope: keep
  the new `adjudications` / `envelope` prose free of equality-shaped or label-shaped examples
  (`status: "landed"`, `landDecision === 'merged'`) that would trip its patterns.
- requiresTest: false — docs-tier contract + consumer prose; the doc-contract lock guarding the
  new ledger key arrives with Task 1.3 (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: `skills/war/SKILL.md` runbook truth — ledger citation, two-path land-failed, adjudication continuity, manifest stamps, doctrine framing (#1016, #1039, #1084, #1078 part 2, #1087)

- Files: `skills/war/SKILL.md`
- Plan slice: all five of this spec's SKILL.md edits in one task (spec §8: one file, one task —
  file-disjoint within the phase). **(a) Step-5 ledger citation (spec §4.1).** In step 5 (the
  "Assemble, thread, and record the run's adjudication set" step), extend "record each row in the
  run ledger" with the parenthetical citation to the `ledger.json` top-level `adjudications` key
  in `references/schemas.md`. **(b) Two-path `held:land-failed` truth (spec §4.2).** In the
  `## Checkpoint` Outcome-handling list, locate the `- **`held:land-failed`**` bullet's sentence
  beginning "A **gate-time `environment` failure that reaches this hold has already spent…" and
  replace it with the two-path form — primary-land arm: retry spent (the bounded fresh-env
  re-land came back `environment`-classified a second time — see the `gate_failed` routing bullet
  below), so the manual re-run is the second line of defense (expect a genuinely persistent
  environment, inspect before re-running); baseline-proceed arm: retry **not** spent — that arm
  routes here directly with no chaining (deliberate, the no-chaining rule), so the first manual
  re-run there is genuinely the first fresh attempt. Exact prose is worker latitude; both arms
  are the checkable floor, and the rewrite keeps the existing "gate-time `environment` failure"
  scoping so the two-path claim never widens to the hold's non-environment producers (verified at
  drafting in `workflow-template.js`: the `introduced`/`error` re-land arms, the primary
  `error`/`gate_failed` route, and the dead/unrouted terminal else all route `held:land-failed`
  too — the bullet's existing root-cause (a)/(b)/(c) prose covers them and stays untouched).
  **Structural floor (two live extraction guards sit on or beside this bullet):** the rewrite is
  a sentence-level replacement inside the existing bullet — never new same-indent 2-space `- **`
  siblings and never a split of the bullet, because `land-decision.test.mjs`'s Task-1.2 guard
  extracts this exact region from the 2-space `- **`held:land-failed`` header to the next
  same-indent `- **` sibling and asserts the region still reaches root cause (c)'s "dead land
  agent" text and the line pairing `resumeFromRunId` with a negation — both of which this edit
  must leave intact (nested 4-space sub-bullets are tolerated by that extractor, but the lazy
  form is no new bullets at all). The sibling `- **`environment`**` bullet is D18-pinned and
  byte-untouched (its "the retry provably spent" is correct for the exhaustion path it
  describes); D18's extraction is construct-scoped to that bullet, so this edit cannot trip it.
  Run `node --test 'skills/**/*.test.mjs'` locally before hand-off — the same suites the
  engine-composed gate re-runs at merge — so both extraction guards are proven, not presumed.
  **(c) Shared-mechanics adjudication duty (spec §4.3).** Append a fourth bullet,
  **Adjudication continuity**, to the `### Recovery relaunch` section's **Shared mechanics (both
  entry points)** list: re-thread the full accumulated `args.adjudications` set from the ledger
  record (the `ledger.json` top-level `adjudications` key), alongside `args.recovery`, so
  relaunch seats are never adjudication-blind — the same duty as the held-partial-phase
  runbook's step 4. Every `references/schemas.md` citation this task adds uses the file's house
  link form — `[references/schemas.md](references/schemas.md)`, the exact form the `env-blocked`
  bullet already carries — never a bare-path or variant-link form (a deliberate per-file style
  direction, so a byte-convergence auditor reads it as canonical, not a rogue variant). **(d) Manifest stamps (spec §4.4).** In the `## Run
  manifest (telemetry)` section's **On phase return** bullet, add the envelope aggregates
  (`totalTokens` / `totalToolCalls` / `agentCount`) to the stamp list, sourced from the Workflow
  task-completion notification's envelope — the same harness-surfaced channel the **At phase
  launch** bullet already reads `workflowRunId`/`transcriptDir` from; unsurfaced ⇒ `null`,
  `/war-review` renders `n/a`. The stamp applies on **every** phase return — `held:*` included
  (the record's `land` field already carries the hold; a held phase without its stamp is exactly
  the unfinalized record the friction signal exists to catch). The envelope field names
  (`totalTokens` / `totalToolCalls` / `agentCount`) are the incident run's observed
  task-completion envelope aggregates (#1078's own calibration evidence), not invented — the
  null-tolerated posture covers a future harness renaming them. In `## Checkpoint`, add one
  short bullet inserted **immediately before** the `- **Issue-lifecycle floor — gate the DAG
  advance (§4.1).**` bullet (making it the Checkpoint list's first bullet; verified at drafting
  that no doc-contract row anchors on Checkpoint bullet *sequence* — D10/D13/D14 all extract by
  construct marker): **Manifest stamp (telemetry, fail-open)** — before posting
  the phase report, complete the Run-manifest section's on-phase-return stamp (`endedAt`,
  dispatch counts, task terminal statuses, `land`, envelope aggregates); a skipped stamp is the
  "unfinalized phase record" friction row `/war-review` reports; fail-open discipline unchanged
  (a failed write logs one line and never blocks the advance). **(e) Doctrine framing
  (spec §4.5).** In step 5's **Provenance discipline** sentence, after "the Lead never
  synthesizes a row to smooth over an unruled delta (spec constraint 6)", add — **verbatim, the
  literal phrasing is load-bearing** — "and a row is **never mined from arbitrary prose** — rows
  come only from the two producers above". Do NOT paraphrase it as "never mines one from
  arbitrary prose": End state 5's wrap-tolerant census, Task 1.3's classification list, and spec
  §3's "same literal framing" row all key on the literal token `mined from arbitrary prose`, and
  the paraphrase contains `mines one from` instead — which would make this expected census home
  return **zero** hits under every form (single-line, case-insensitive, and `\s+`-tolerant
  alike), silently falsifying End state 5 while every other check stayed green. **Token sweep (floor,
  not ceiling):** grep `already spent` across `skills/war/` and `agents/` and adjudicate every
  match against the two-path truth — known matches at drafting: the target sentence (fixed
  here); `workflow-template.js`'s ace-demotion string "the single ace attempt is already spent"
  (a different retry budget — leave, and the engine file is out of footprint regardless); the
  `environment` bullet's "the retry provably spent" (correct — keep). Then hand-scan the full
  Outcome-handling list and the `### Recovery relaunch` / runbook subsections for paraphrase
  echoes of the unconditional claim the grep cannot catch, adjudicating each and listing every
  straggler edited as a survey-derived correction in the done report. A straggler in a file
  outside this task's footprint (e.g. `agents/*.md`) is REPORTED (`war-followup`), never edited.
- requiresTest: false — docs-tier runbook prose; the existing doc-contract suite (D10/D18 rows)
  is the drift guard and must pass byte-untouched
- requiresPackaging: false
- deps: [1.1] — (a), (c), and (d) cite the ledger `adjudications` key and the `envelope`
  contract Task 1.1 documents; the wave edge makes the worker's first act a rebase onto the
  integration tip carrying them, so no citation dangles (dependency ⇒ wave edge, same phase)
- target repo: superproject

### Task 1.3: Doctrine anchor restore + drift locks — CONTEXT.md, historical-spec correction, doc-contract locks (#1087 + the #1016 lock)

- Files: `CONTEXT.md`, `docs/specs/2026-07-22-audit-adjudication-threading-design.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **Anchor restore (spec §4.5).** In the `CONTEXT.md` `**Adjudication**:` glossary
  term, extend the `_Avoid_` line so it regains the literal phrase: "…it never waives a gate,
  floor, or backstop (ADR 0017), and a row is **never mined from arbitrary prose** — rows come
  only from the two named producers." **Historical-spec correction (annotative, never a
  rewrite).** In `docs/specs/2026-07-22-audit-adjudication-threading-design.md`, at the non-goals
  sentence citing "the existing `lenses.md` 'never mined from arbitrary prose' doctrine" (anchor
  by the quoted sentence, never a line number), append a dated bracketed correction note: the
  citation was false (the lenses reference never carried the phrase; the CONTEXT.md term was the
  sole live home — code-verified), the plan-faithful rewrite therefore orphaned the doctrine, and
  the anchor is restored per this plan's source spec / #1087 — citing
  `docs/learnings/spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong.md`. (Verified at
  drafting: no test or red-team structure check reads that spec's bytes — the doc-contract
  spec-truth rows pin only the 2026-06-25 and 2026-07-12 specs — so the annotative note cannot
  red anything; re-confirm with a cheap grep for the spec's filename over `skills/` and `hooks/`
  test files before commit.) **Drift locks
  (two new tests in `skill-doc-contracts.test.mjs`, house style: construct-anchored extraction,
  root resolved from `import.meta.url` never `process.cwd()`, maintenance-rule header
  respected).** (a) Read `CONTEXT.md` (repo root, resolved relative to the test file the same way
  the existing spec-truth reads resolve `docs/specs/`), extract the `**Adjudication**:` block by
  construct — from the bolded term to the next bolded glossary term — and assert the phrase with
  **`\s+` between tokens, never literal spaces** (`never\s+mined\s+from\s+arbitrary\s+prose`,
  case-insensitive): CONTEXT.md wraps near 100 columns, so the extended `_Avoid_` line may
  legitimately wrap mid-phrase, and D18's first absence key is the in-file precedent ("per the
  two-line-pairing lesson, strictly widens it across a wrap"). A failed extraction is its own
  loud assertion (the existing rows' could-not-locate pattern). (b) Sibling lock guarding
  Task 1.1's contract fix:
  extract the `## ledger.json — run state` jsonc block from `skills/war/references/schemas.md`
  (heading to the block's closing fence) and assert it names `adjudications`. Prove both locks
  red by temporarily removing each referent (red-proof recorded in the commit body, matching the
  file's house style; per End state 3-style done-report threading, quote the failing output).
  Every existing row — D10, D18, the spec-truth reads — passes with extraction constructs
  untouched. **Token sweep (floor, not ceiling — wrap-tolerant):** census the phrase repo-wide
  with a whitespace-tolerant form that crosses line breaks (e.g. per file
  `tr '\n' ' ' | grep -c 'mined from arbitrary prose'`, or a `\s+`-separated multiline match) —
  the lesson body carries one occurrence wrapped across a line break that a single-line grep
  silently drops, the misattribution-pairing defect class exactly. Classify every hit —
  CONTEXT.md term (standing home, this task's edit),
  `skills/war/SKILL.md` step 5 (standing home, Task 1.2's edit — adjudicate fixed-in-flight by
  the sibling, same phase), the 2026-07-22 spec (this task's correction-note site), the learnings
  lesson (leave — lesson bodies are records), the new locks themselves (own). Then hand-scan the
  CONTEXT.md `Adjudication` term body and SKILL.md step 5 for paraphrase echoes ("synthesizes a
  row", "ruling already made and routed") to confirm the restored clause composes with rather
  than duplicates them, listing any straggler adjusted as a survey-derived correction.
  **(c) BOTH-ARMS PRESENCE lock backing End state 2 (the plan's only committed guard for it).**
  Extract the `held:land-failed` Outcome-handling bullet from `skills/war/SKILL.md` **exactly the
  way the live guard already does it** — copy the construct at `land-decision.test.mjs`: locate
  with `/^ {2}- \*\*`held:land-failed`/` (a **2-space-indented, token-only prefix**; the live
  header is a phrase-wrapping bold — ``  - **`held:land-failed` — root-cause-branched
  auto-recover, else hold.**`` — so the compact `` - **`held:land-failed`** `` form has **zero**
  occurrences in `SKILL.md`; that compact wrap is *schemas.md*'s header form, never anchor on it
  here) and terminate at the next **SAME-INDENT** `/^ {2}- \*\*/` sibling, never a top-level
  `/^- \*\*/` one (a top-level terminator over-extends past four sub-bullets and the entire
  `- **Escalation-completion land …**` sibling). Then assert the extracted region matches **both**
  arm markers — a primary-land arm and a baseline-proceed arm — per End state 2's two-path
  requirement.
  **Do NOT write this as a `/already\s+spent/i` absence key.** The spec's own sanctioned §4.2
  replacement text keeps "already spent" inside the *conditional* primary-land arm (the retry
  spent because the bounded fresh-env re-land came back `environment`-classified a second time),
  so an absence key would go RED on the correct two-path text and could pass only by the worker
  dropping sanctioned prose. The defect End state 2 targets is the **unconditional framing**, not
  the token — so the lock asserts the two-path shape positively.
  Red-proof: temporarily collapse the bullet back to the single unconditional sentence and
  confirm exactly (c) reds.
  Rationale for living here rather than in Task 1.2: `skill-doc-contracts.test.mjs` is this
  task's file, and putting the lock in 1.2 would make two tasks edit one file — the same-file
  collision the decomposition rule forbids (never a deps/wave dodge; this is a genuine
  cross-file dependency).
- requiresTest: true — the deliverable includes the three new locks; the diff touches
  `skill-doc-contracts.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: [1.1, 1.2] — lock (b) asserts the `adjudications` key Task 1.1 writes into `schemas.md`,
  and lock (c) asserts **both arms are PRESENT** in the `held:land-failed` bullet Task 1.2
  rewrites in `skills/war/SKILL.md`; both wave edges rebase this worker onto the tip carrying
  those edits, so each lock is born green off its own dispatch base (a conscious placement
  deviation — see Notes). Without the 1.2 edge, lock (c) would be born RED — the pre-1.2 bullet
  carries only the single unconditional sentence, so the baseline-proceed arm it requires does
  not exist yet.
- target repo: superproject

### Task 1.4: Campaign roadmap record — row 6 Files cell + CONTEXT.md contention row (#1053)

- Files: `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md`
- Plan slice: two cell edits, nothing else in the file moves (the roadmap is a record, not the
  live queue — the campaign ledger is). Row 6 (`war-memory-hardening`): append `CONTEXT.md` to
  the Files-owned cell. Shared-file contention table, `CONTEXT.md` row: plan list
  `2, 3, 4, 5, 7` → `2, 3, 4, 5, 6, 7`. Bookkeeping only — the source issue itself records there
  is no landing hazard; this keeps the roadmap honest as a record of what red-team round 1
  actually did.
- requiresTest: false — docs-tier record correction
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.5: Auditor git-branch guard deny-string truth (#1085)

- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`
- Plan slice: message/comment text only — case arms, allow/deny behavior, and every other arm of
  the guard byte-untouched (no flag added to or removed from the branch arm's accepted set). In
  the READ-FORM branch-enforcement arm (the `if [ "$subcmd" = "branch" ]` block):
  **Deny message** — replace the "takes only =-attached read flags" blanket characterization with
  one matching the enumeration's mixed shapes: value-carrying flags must be `=-attached`
  (`--contains=<rev>`, `--merged=<rev>`, `--points-at=<rev>`) and bare read flags are enumerated
  (`--list`, `-a`, `-r`, `--show-current`, `-v`); the offending token is named; space-form values
  and write flags deny. Wording is worker latitude within three floors, and the floors are the
  audit rubric (the plan-faithfulness seat judges against them; latitude beyond is the worker's,
  never re-adjudicated as drift): the literal `=-attached` survives (it is J16's pinned
  micro-teach and stays accurate for the value-carrying flags); no blanket adjective covers the
  bare-flag set; and the message stays **one line, no embedded newlines** — `deny()` echoes a
  single stderr line and the J-series substring greps assume line-local text (length itself is
  unconstrained; a longer honest line beats a short false one). **Header comment** — correct
  "EVERY token must
  be an enumerated read flag with =-attached values" to the mixed-shape truth (value-carrying
  flags `=-attached`; bare read flags enumerated exactly). **Token sweep (floor, not ceiling):**
  grep `=-attached` across `hooks/` and adjudicate every match — the deny string (reworded
  here), the header comment (corrected here), and the test file's J7/J16 comments (verified
  accurate at drafting: they describe genuinely `=-attached` flags — leave). Then hand-scan the
  full J-series `git branch` block of `hooks/validate-auditor-git.test.sh` and the branch-arm
  comment block for other blanket characterizations of the flag set the grep cannot catch.
  `hooks/validate-auditor-git.test.sh` is **expected byte-untouched** (End state 7: zero
  assertion/expectation edits; J16's `=-attached` pin keeps passing) — it is in this task's
  Files only so a survey-found straggler **comment** has an in-footprint home; any such edit is
  comment-only and listed as a survey-derived correction. Verify by running
  `bash hooks/validate-auditor-git.test.sh` locally: every allow/deny outcome unchanged.
- requiresTest: false — guard text only; the existing J-series suite passing with zero
  assertion edits is the check (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.6: T2.9 census accuracy — drop the uniqueness overclaim (campaign carry-over from plan 1)

- Files: `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: **comment text only** — every assertion, fixture, and case in the file is
  byte-untouched; this task adds and removes no test. Campaign carry-over: plan 1
  (`2026-07-24-land-advance-exit-contract-truth`, Task 1.2) rewrote T2.9's block-comment census
  count-free, and the mandated replacement wording asserted that the push-error branch is
  "the **only** SILENT exit-3 route", with a universal lead-in that "every one of which dies
  LOUDLY with route-naming text". Two auditor seats independently code-traced both claims FALSE
  and dispositioned them `note` (not `absorb`) solely because the wording was plan-mandated; the
  operator ratified routing the correction here. **The defect:** `cmd_land_advance` has a
  **second** silent bare-`exit 3` arm — the post-push origin-readback mismatch
  (`[ "$actual" = "$new_sha" ] || exit 3`, on the push-**success** path) — distinct from the
  push-error branch on the push-failure path. Neither "every … dies LOUDLY" nor "the only SILENT"
  is true. **The fix:** in the T2.9 census block comment (anchor: the block comment immediately
  above the `PAIR9="$(setup_origin_pair)"` fixture line — anchor by that named construct, never a
  line number), replace the invariant sentence with a truthful, still-count-free one. Auditor-
  suggested shape, and worker latitude within the floors below: *"Exit 3 is reached by several
  routes; the push-path silent ones (the push-error branch and the post-push origin-readback
  mismatch) print nothing, while the rest die LOUDLY with route-naming text — so route identity
  rests on (b)+(c)+(d) TOGETHER:"*. **Floors (the audit rubric — latitude beyond them is the
  worker's, never re-adjudicated as drift):** (i) the replacement paragraph greps **zero** for
  `T2\.` (plan 1's End-state-4 count-free floor is preserved, not regressed); (ii) the claims are
  gone under a **case-insensitive, wrap-tolerant** check — normalize the comment first
  (`tr '\n' ' ' | tr -s ' '`, so a re-wrap cannot hide a surviving claim the way it does for the
  `hooks/` header comment in End state 7) and then `grep -i` for **both** `only silent` **and**
  `every one of which`, plus a universality scan for an `every … dies loudly`-shaped adjective
  that a re-phrasing could reintroduce under different words. A line-local, case-sensitive pair
  of greps is NOT sufficient: sentence-initial recasing or a re-wrap would report PASS on a
  paragraph that still carries both false claims; (iii) the `(b)`, `(c)`,
  `(d)` detail lines and **all** assertion code are byte-unchanged; (iv) the sentence is truthful
  against `cmd_land_advance` **as written at your base** — re-read the function and confirm the
  two silent arms before writing, rather than trusting this slice's summary (that is precisely the
  failure mode this task exists to correct); (v) no numeric count of exit-3 routes appears
  (count-free means no "two"/"three" either — the file must not re-acquire a number that rots).
  Also hand-scan the rest of the T2.9 comment block for any other universality claim the two greps
  in (ii) miss. Verify: `bash skills/war/assets/provision-worktrees.test.sh` green (it must be —
  no assertion moved). End state 11.
- requiresTest: false — comment-only; the existing T2.x suite passing with zero assertion edits
  is the check (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: this plan changes plugin-shipped surfaces (`skills/war/SKILL.md`,
  `skills/war-review/SKILL.md`, `skills/war/references/schemas.md`, `CONTEXT.md`,
  `hooks/validate-auditor-git.sh`, and a shipped test asset) — users receive them only via a
  release. Bump all four release slots together to the **next free patch above the live
  integration base at land time** (never a resolved semver literal, per the /war-strategy §2
  next-free-patch convention; version literals in plans are non-authoritative): `plugin.json`
  `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`, and the
  `README.md` `## Status` line (replace-in-place, never emptied, no badge).
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End state 10). Expected integration base: the campaign working branch tip after plan 1
  of this campaign (`docs/plans/2026-07-24-land-advance-exit-contract-truth.md`, including its
  own trailing release bump) and this plan's Phase 1 have landed — resolve the next free patch
  from the four slots **as they stand at land time**, never from any plan literal, so the
  stacked-release lag is absorbed by construction. Standalone fallback: a run through plain
  `/war` (outside the campaign) resolves the next free patch from the four slots itself.
  Release blurb describes the change additively and precisely: standing records realigned with
  live behavior (ledger adjudications contract documented; two-path `held:land-failed` prose;
  recovery-relaunch adjudication-continuity duty; run-manifest `envelope` aggregates +
  finalization stamp + `/war-review` sourcing; doctrine anchor restored and drift-locked;
  auditor `git branch` deny text corrected) — never a claim that any engine or guard *behavior*
  changed (`workflow-template.js`, `land-decision.mjs`, all floors, and every guard case arm are
  byte-untouched).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Integrated-tip sweep re-check — re-run the **five** token sweeps once on the landed Phase-1
  tip. **Every key is case-insensitive (`grep -i`), and every key over a wrapped-prose surface is
  wrap-tolerant (normalize with `tr '\n' ' ' | tr -s ' '` first) — a line-local case-sensitive
  grep is vacuous against a re-wrap or a sentence-initial recasing, which is the same
  wrap-blindness this plan corrects in End states 5 and 7.** The five: (1) `already spent` over
  `skills/war/` + `agents/`; (2) `manifest` over `skills/war-review/SKILL.md`; (3) the
  wrap-tolerant doctrine-phrase census repo-wide; (4) over `hooks/`, both absence keys
  `takes only =-attached` **and** the line-resident `an enumerated read flag with =-attached
  values` (**not** `EVERY token must be an enumerated read flag` — that phrase wraps mid-sentence
  across the live header comment's two lines with a `# ` continuation marker inside it, so it
  matches zero times even before any edit and can never discriminate); and (5) `only silent` /
  `every one of which` / `T2\.` over `skills/war/assets/provision-worktrees.test.sh`. Confirm
  End states 2, 4, 5, 7, **11** hold after the serial merge · why
  deferred: sweep completeness is a whole-repo property spanning **six** parallel tasks that each
  adjudicate at their own frozen base — the cross-task fixed-in-flight rulings (Task 1.3
  classifying Task 1.2's step-5 edit) are only provable on the integrated union, and Task 1.6's
  absence floors can be re-broken by any later-landing sibling that re-enters
  `provision-worktrees.test.sh` · runner: the Lead at Phase-1 land, before dispatching Phase 2.
- "Unfinalized phase record" friction signal fires in practice — a future run whose Lead skips
  the phase-close stamp shows the new §4 row in its review · why deferred: the signal's trigger
  is a *future* run's manifest, unreachable from this plan's tree; the in-phase checkable floor
  is the signal's presence in `skills/war-review/SKILL.md` (End state 4) · runner: the next
  `/war-review` over a post-change run.

## Notes / conscious deviations

- **Decomposition:** six Phase-1 tasks, pairwise file-disjoint. The **three** `deps` edges
  (1.2 ← 1.1, 1.3 ← 1.1, **1.3 ← 1.2**) are real cross-file dependencies — prose citations and
  test locks naming constructs Task 1.1 writes, plus the **lock-(c) ordering edge**: 1.3's
  both-arms presence lock asserts against the `skills/war/SKILL.md` bullet 1.2 rewrites, so 1.3
  is its own third wave and would be born RED if run alongside 1.2 —
  never a same-file dodge (the shared-file rule: all five
  SKILL.md edits are one task, all schemas.md edits another). Task **1.6** is the plan-1 campaign
  carry-over; it is `deps: []` and owns `skills/war/assets/provision-worktrees.test.sh`, a file no
  other task in this plan touches, so it rides the first wave alongside 1.1 ∥ 1.4 ∥ 1.5 with no
  rebase-conflict surface. Release is its own trailing phase
  per the rule. Tasks are carved on **file boundaries, not issue boundaries** — deliberately:
  issue-per-task would put five issues' edits in the same two files and guarantee serial-merge
  rebase conflicts. Issue → task closure map (so the Lead's Checkpoint duty and the campaign
  close stay mechanical — the run's own epic/task issues close per the phase-land floor and the
  close-each-task-issue rule; the seven **source** issues close against this map when the
  campaign PR lands): #1016 → 1.1 + 1.2 (+ 1.3's lock (b)); #1039 → 1.2; #1053 → 1.4;
  #1078 parts 2–3 → 1.1 + 1.2 (part 1 overtaken, no task — closes on the spec's
  overtaken-by-v0.14.49 rationale); #1084 → 1.2; **#1085 → 1.5 PARTIAL — DO NOT CLOSE on this
  plan's PR**; #1087 → 1.2 + 1.3.
  **#1085 partial-closure note (red-team finding, adjudicated — corrected in round 2).** The same
  blanket "`=`-attached read flags only" characterization is live on **three** surfaces, and Task
  1.5 corrects only one: `hooks/validate-auditor-git.sh` (this plan). The other two —
  `agents/war-auditor.md`'s standing `` **`branch` takes `=`-attached read flags only** `` bullet
  and the mirrored `READ-ONLY GIT GUARD CONTRACT` clause in `workflow-template.js`'s dispatched
  auditor prompt — are **out of footprint here** (spec constraint 1 pins `workflow-template.js`
  byte-untouched). **They are NOT picked up by campaign plan 4 either.** Plan 4
  (`docs/plans/2026-07-24-drift-guard-and-floor-diagnostic-hardening.md`) explicitly disclaims
  them: its design row 7 is spec-ratified that the hook deny string and both mirrors must move
  together, it owns neither the hook nor that sentence family, and its End state 5 pins **no**
  `workflow-template.js` edit. Its named vehicle is a **Lead-filed `war-followup` issue at its
  Phase-1 close**, naming `agents/war-auditor.md` and the `workflow-template.js` dispatched
  clause. So **#1085 closes on NEITHER plan's PR** — it stays open behind that follow-up. (The
  two mirrors travel together in one commit per the standing split rule: a change to auditor
  behavior updates the standing `agents/*.md` doc and the string-built dispatched prompt in the
  same commit, or they drift silently.) This plan's PR body cites #1085 as partially addressed
  and must **not** use a closing keyword for it.
- **Ledger row-shape correction (conscious deviation from the spec's jsonc sketch):** spec §4.1
  sketches the `adjudications` key as "preformatted row strings", but the args contract it cites
  admits string **or** `{ adjudicated|value, supersedes }` object rows, and the spec's own
  parenthetical says "the same rows threaded as `args.adjudications`". A strings-only record
  would make the promised full re-thread unmechanizable for object rows — the exact #1016 gap
  reappearing one layer down. Resolved toward the checkable pair (the args contract + the
  re-thread promise): the ledger key documents rows verbatim-as-threaded in either shape.
- **No `/war-review` prose lock (self-decided, grill):** the §2/§3/§4 edits stay grep-checked
  (End state 4) rather than test-locked — the spec's design tree deliberately chose exactly two
  new locks, a third would add contention on `skill-doc-contracts.test.mjs` (which a sibling
  campaign spec also edits) for a low-blast-radius prose surface no test has ever pinned, and
  the integrated-tip backstop re-checks the greps at land.
- **Split stays transcript-mined but caveated (self-decided, grill):** spec constraint 3 pins
  the split as transcript-mined-or-`n/a`; the plan adds the best-effort/undercount label to the
  rewritten §2 sentence (from #1078's own 13-vs-265 calibration) so the split is never read as
  cross-summable against envelope totals — a coherence polish inside the 4.4 edit's latitude,
  not a contract change.
- **Lock placement (conscious deviation):** lock (b) guards Task 1.1's `schemas.md` key but
  lives in Task 1.3's test file — the guard cannot travel in the guarded task because
  `skill-doc-contracts.test.mjs` is a single file already owned by 1.3 (same-file → same-task
  beats guard-travels-with-fact here). The `deps: [1.1]` wave edge closes the gap: the lock is
  authored against a base already carrying the key, and both land in the same phase.
- **Campaign stacking (plan 2 of 6, ADR 0011 stack-and-plow):** Phase-1 footprints **intersect on
  exactly one file, by design**: `skills/war/assets/provision-worktrees.test.sh`, which plan 1's
  Task 1.2 edited and this plan's **Task 1.6** re-enters to correct the T2.9 census wording plan 1
  landed there. The intersection is **sequential, never concurrent** — plan 1 is fully landed at
  this plan's base (phase merges `09e4969` and `9cd713f`, release `441855c`, Gate-2 `f9fc4a4`), so
  Task 1.6 dispatches off a tree that already carries the strings its floors delete. That ordering
  is load-bearing: dispatched off any base predating plan 1's land, Task 1.6's floor (ii)
  (`only SILENT` / `every one of which` grep empty) would be **vacuously true** and the task would
  land having corrected nothing. The rest of plan 1's Phase-1 footprint
  (`docs/learnings/land-advance-push-first-cas-rejected-token.md`, `docs/seed/seed-manifest.json`,
  `docs/seed/seed.tar.gz`, `docs/adr/0023-land-asserts-git-ground-truth.md`) is untouched here.
  The other overlap is the trailing release phase's four slots (`plugin.json`,
  `marketplace.json` ×2, `README.md ## Status`) — expected and fine: both plans use the
  directive form, so each resolves its patch from the slots as they stand at its own land time.
- **Cross-plan contention for the roadmap table:** this plan claims **stack position 2** (after
  `2026-07-24-land-advance-exit-contract-truth`). The sibling spec
  `docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md` also touches
  `skills/war/assets/skill-doc-contracts.test.mjs` (the D18 companion loop) and concurrent
  campaign plans touch `skills/war/SKILL.md` and `CONTEXT.md` — surface-contention ordering
  only, no design dependency either way (spec constraint 5). The rebase-by-named-anchor burden
  falls on the **later lander** (ADR 0011 stack-and-plow): whichever sibling plan stacks after
  this one rebases over these construct-anchored edits, and every edit here anchors by named
  construct precisely so that rebase is mechanical — the roadmap contention table should cite
  both shared files against both plans.
- **D18 safety (spec constraint 5):** the 4.2 rewrite edits the `held:land-failed` bullet; D18's
  extraction is construct-scoped to the sibling `environment` bullet, so the edit cannot trip
  it — Task 1.2 still runs the doc-contract suite locally before hand-off, the cheap proof.
- **Historical artifacts stay annotative (spec constraint 6):** the 2026-07-22 spec gets a dated
  bracketed correction note at the citing sentence, never a silent rewrite; the roadmap's two
  cells are bookkeeping on a record, not a regeneration. No edits to lesson bodies
  (`docs/learnings/`) — their issues close by fixing the surfaces they name.
- **No engine changes (spec constraint 1):** `workflow-template.js`, the status enums,
  `land-decision.mjs`, and all floor scripts are expected byte-untouched — an auditor finding
  them unmodified is confirming the design. The manifest remains Lead-side fail-open prose
  bookkeeping that no code reads back (no mechanized writer/finalizer — detection via the
  friction signal, not enforcement); ADR 0008's git > labels > ledger ordering is untouched.
- **Known `already spent` keeps (pre-adjudicated for Task 1.2's sweep):** the `environment`
  bullet's "the retry provably spent" (correct for its exhaustion path) and
  `workflow-template.js`'s ace-demotion string (a different budget; engine file out of
  footprint). Any *new* live straggler outside a task footprint is reported (`war-followup`),
  never edited — footprint discipline over sweep zeal (ADR 0017; the Lead files it at phase
  close).
- **`requiresPackaging: false` throughout** — no packaging surface in this repo (the packaging
  floor is a no-op without a Dockerfile).
- **Redaction:** no absolute home paths, emails, or handles anywhere in this plan, the edited
  prose, the correction note, or the release blurb. Pre-flighted at drafting: the planned
  strings (`adjudications`, `envelope` aggregates, the deny-message reword, the doctrine phrase)
  carry none of the lint's fail-closed shapes.
- **Gate provability:** no gate directive in this plan enumerates `*.test.sh` suites or states a
  suite count (§2 rule). End states 6, 7, and 9 are HARD-checkable from the captured gate
  artifact because the refiner-dispatched gate is engine-composed through `resolveGate`
  (ADR 0036 — the GATE COMPOSITION POINT normalizes `plan.gate` before every gate-bearing
  dispatch), appending the repo-wide shell-suite discovery loop; the per-suite
  `== gate(bash): … ==` banner names the auditor-guard suite's path without this plan ever
  listing it.

## Open decisions

None — the spec's design tree resolved every decision; remaining latitude (4.2's exact two-arm
phrasing, 4.7's exact deny wording, the correction note's sentence shape) is the worker's within
the named-element floors stated per task.
