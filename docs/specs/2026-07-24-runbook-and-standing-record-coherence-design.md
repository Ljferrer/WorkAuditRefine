# Runbook and standing-record coherence — ledger adjudications contract, land-failed prose truth, doctrine anchor restore, manifest finalization, and micro-strays

**Issues addressed: #1016, #1039, #1053, #1078, #1084, #1085, #1087** (seven; #1078 part 1 is
overtaken — see Context — and only its parts 2–3 are in scope here).

## 1. Context — the gap / problem

Seven small, independently-verified drifts between WAR's standing records (runbooks, contracts,
glossary, roadmap, guard text) and the behavior those records describe. None is an engine defect;
every one misleads the reader the record exists for — a recovering Lead, a relaunch operator, a
`/war-review` miner, a future spec author, or an auditor seat hitting a deny message. All seven
were re-verified live on the current tree during spec authoring:

- **#1016 — ledger contract omits the promised `adjudications` record.** The
  `## Workflow per-phase args contract` section of `skills/war/references/schemas.md` (the
  `Optional adjudications (array|null)` paragraph) promises the adjudication set is "re-threaded in
  full — from the run-ledger record", and `skills/war/SKILL.md` step 5 instructs "record each row
  in the run ledger" — but the `## ledger.json — run state` jsonc contract block in the same
  schemas file enumerates no `adjudications` key at any level. The recovery re-thread — the exact
  missing link the adjudication-threading work exists to close — is unmechanizable from the
  contract as written.
- **#1039 — `held:land-failed` "retry already spent" is unconditionally false on one path.** The
  `held:land-failed` outcome bullet in `skills/war/SKILL.md` (`## Checkpoint`, Outcome handling)
  states any gate-time `environment` failure reaching the hold "has already spent its in-workflow
  `environment-proceed` retry". Verified in `skills/war/assets/workflow-template.js`: the
  **baseline-proceed re-land's** own environment arm routes `reason: 'env-blocked'` →
  `held:land-failed` directly, with no chaining (deliberate, per the no-chaining rule) — so a phase
  can reach the hold with the retry never dispatched. A Lead trusting the bullet expects a
  persistent environment and skips the first manual re-run.
- **#1084 — generic Recovery relaunch omits the adjudication re-thread duty.** The
  `### Recovery relaunch` section's **Shared mechanics** bullets in `skills/war/SKILL.md` cover
  owned-file continuity, kept commits, and the normal land path — but never the
  `args.adjudications` re-thread. Only the more specific `### Held-partial-phase recovery runbook`
  step 4 carries it, so a Lead entering through the generic section relaunches with
  adjudication-blind seats — the precise failure the duty prevents.
- **#1078 — run-manifest finalization + envelope aggregates (parts 2–3 only).** Part 1 (auditor
  guard-denial churn) is **overtaken**: the one-bare-git-verb-per-call contract landed on both
  auditor surfaces in v0.14.49, after the reported run's v0.14.48 plugin; only re-measurement on a
  ≥ 0.14.49 run remains, which is not spec work. Parts 2–3 are live: (2) a real run left a phase's
  manifest record unfinalized after a successful land (no `endedAt`, no task record) — the
  documented on-phase-return stamp duty exists in the `## Run manifest (telemetry)` section but the
  `## Checkpoint` sequence never references it and nothing detects the skip; (3) the workflow
  `agent-*.jsonl` transcripts undercount tool calls ~20× against the harness's own envelope, so
  `/war-review`'s documented mining path cannot honestly source token/tool totals — the
  task-completion envelope aggregates (`totalTokens`, `totalToolCalls`, `agentCount`) are the only
  trustworthy source, and neither the manifest contract nor `/war` records them.
- **#1087 — the "never mined from arbitrary prose" doctrine lost its only operative anchor.** The
  audit-adjudication-threading design spec's non-goal justified retiring the CONTEXT.md
  `Adjudication` term's clause by citing a duplicate home in the red-team lenses reference — a
  citation that was never true (code-verified: the phrase existed at exactly one live surface, the
  CONTEXT.md term itself). The plan-faithful rewrite then deleted that sole anchor. Substance
  echoes survive (the SKILL.md step-5 "never synthesizes a row" sentence; the CONTEXT.md `_Avoid_`
  line), but the grep-able framing has no standing home, so the doctrine can be neither cited nor
  drift-guarded.
- **#1053 — campaign roadmap record drift.** Red-team round 1 added `CONTEXT.md` to campaign
  plan 6 (war-memory-hardening), but
  `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md` predates the reversal: row 6's
  Files column omits `CONTEXT.md` and the shared-file contention row for `CONTEXT.md` lists
  plans 2, 3, 4, 5, 7 without 6. Bookkeeping only — the issue itself states there is no landing
  hazard; this keeps the roadmap honest as a record.
- **#1085 — auditor git-branch guard deny string contradicts its own enumeration.** The branch
  read-form arm of `hooks/validate-auditor-git.sh` denies with "git branch takes only =-attached
  read flags", then enumerates five bare flags (`--list, -a, -r, --show-current, -v`) in the same
  parenthetical. Guard behavior is correct (both flag shapes are accepted by the case arms); only
  the deny message and the adjacent header comment overclaim.

## 2. Pivotal constraints

1. **No engine changes.** Every fix is standing-record prose, contract documentation, or
   user-facing guard text. `skills/war/assets/workflow-template.js`, the status enums,
   `land-decision.mjs`, and all floor scripts are untouched. The run manifest remains Lead-side
   prose bookkeeping that no code reads back.
2. **The manifest stays fail-open telemetry, never resume input.** ADR 0008's ordering
   (git > issue labels > ledger) is untouched; a failed manifest write still logs one line and the
   run proceeds. Widening the manifest contract must not create a blocking duty.
3. **`/war-review`'s never-fabricate discipline holds.** Envelope aggregates render `n/a` whenever
   unsourceable — `null` in the manifest, never a transcript-derived or invented number. The
   input/output/cache **split** remains transcript-mined-or-`n/a`.
4. **J16 pins the `=-attached` micro-teach.** `hooks/validate-auditor-git.test.sh`'s
   `expect_deny_teach` for the space-form `git branch --contains abc123` asserts the literal
   substring `=-attached` in the deny stderr. The reworded message must keep that literal (it is
   the micro-teach, and it stays accurate for the value-carrying flags); only the blanket
   characterization goes.
5. **D18 extraction is by construct.** The doc-contract test `skill-doc-contracts.test.mjs` (D18)
   extracts the `- **\`environment\`** →` bullet of SKILL.md's `gate_failed` routing and pins its
   anchors. The #1039 edit targets the *sibling* `held:land-failed` bullet and must not disturb the
   `environment` bullet's construct or anchors. (Note: the same D18 companion loop is being
   hardened by the sibling spec `docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md`
   — surface-contention ordering only, no design dependency either way.)
6. **Historical artifacts are corrected annotatively, never rewritten.** The 2026-07-22
   audit-adjudication-threading spec is a ratified decision record: the false citation gets a
   dated bracketed correction note at the citing sentence, not a silent rewrite. The campaign
   roadmap is a record, not the live queue (the campaign ledger is) — its two-cell fix is
   bookkeeping.
7. **Anchor by named construct, never line number.** Several concurrent campaign plans touch
   `skills/war/SKILL.md` and `CONTEXT.md`; every edit below locates its target by heading, bolded
   term, or bullet label (line numbers rot across the serial merge queue).
8. **The doctrine restore changes no behavior.** Restoring "never mined from arbitrary prose" is a
   glossary/prose anchor restore; adjudication threading in the engine (row shapes, producers,
   back-compat byte-identity) is untouched.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where does the run ledger record adjudications? | A documented **top-level `adjudications` key** in the `## ledger.json` jsonc contract block of `skills/war/references/schemas.md` — an array of preformatted row strings (the same rows threaded as `args.adjudications`), absent ⇒ none recorded. Top-level because the set accumulates **run-long** across phases (spec D8), not per phase. |
| How do the promising surfaces cite it? | The args-contract `Optional adjudications` paragraph gains "(the `ledger.json` top-level `adjudications` key above)"; `skills/war/SKILL.md` step 5's "record each row in the run ledger" gains the same parenthetical citation. |
| How is the #1039 falsehood fixed? | Qualify, don't delete: the bullet distinguishes the **primary-land path** (retry spent — expect a persistent environment, inspect before re-running) from the **baseline-proceed path** (retry never dispatched — no chaining — so the first manual re-run is genuinely the first fresh attempt). |
| Where does the generic relaunch get the adjudication duty? | A fourth **Shared mechanics** bullet ("Adjudication continuity") mirroring runbook step 4: re-thread the full accumulated `args.adjudications` set from the ledger record, alongside `args.recovery`. Both entry points inherit it — that is the point of Shared mechanics. |
| How is manifest finalization made likely (and its skip visible)? | Two prose surfaces, no mechanization: (a) a short **Manifest stamp** bullet in `## Checkpoint` referencing the Run-manifest section's on-phase-return duty, placed where Leads actually execute phase close; (b) a new `/war-review` §4 friction signal — **unfinalized phase record** — so a skipped stamp becomes a reported friction row instead of a silent gap. |
| Where do token/tool totals come from? | A per-phase **`envelope` aggregate** (`totalTokens` / `totalToolCalls` / `agentCount`, each number-or-null) in the run-manifest contract, stamped at phase return from the Workflow task-completion envelope (the same harness surface the launch stamp already reads). Added to the MUST-carry list — binding to attempt, `null` when unsourceable. |
| How does `/war-review` consume it? | §2's "the manifest never carries them" sentence is replaced: prefer the manifest `envelope` aggregates for totals; transcripts remain the only source for the input/output/cache split (`n/a` when unsourceable). §3 tally sources updated to "manifest envelope, else mined". |
| Where does the doctrine anchor live again? | Its original sole home: the CONTEXT.md `**Adjudication**` term — the `_Avoid_` line regains the literal phrase "never mined from arbitrary prose". The SKILL.md step-5 provenance-discipline sentence gains the same literal framing as a second standing home. |
| Is the restored anchor drift-guarded? | Yes — one new lock in `skills/war/assets/skill-doc-contracts.test.mjs`: extract the CONTEXT.md `**Adjudication**` glossary block by construct and assert the phrase. A second cheap lock asserts the `## ledger.json` jsonc block names `adjudications` (guards the #1016 fix). |
| Is the old spec corrected? | Annotatively: a dated bracketed correction note at the §9 sentence citing "the existing `lenses.md` … doctrine" in `docs/specs/2026-07-22-audit-adjudication-threading-design.md`, stating the citation was false and pointing at the restored anchor and the learning. |
| How is the deny string fixed? | Recharacterize the mixed enumeration instead of blanket-labeling it: value-carrying flags are `=-attached` (`--contains=<rev>`, `--merged=<rev>`, `--points-at=<rev>`), bare read flags are enumerated exactly (`--list`, `-a`, `-r`, `--show-current`, `-v`). The literal `=-attached` survives (constraint 4). The adjacent header comment ("EVERY token must be an enumerated read flag with =-attached values") is corrected the same way. Case arms untouched. |
| Roadmap fix shape? | Two cell edits in `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md`: append `CONTEXT.md` to row 6's Files column; change the `CONTEXT.md` contention row's plan list from `2, 3, 4, 5, 7` to `2, 3, 4, 5, 6, 7`. |
| #1078 part 1? | Declared overtaken (v0.14.49 shipped the fix); scoped out. No spec work; re-measurement rides any future `/war-review` on a ≥ 0.14.49 run. |

## 4. Mechanics

### 4.1 Ledger adjudications contract (#1016 — `skills/war/references/schemas.md`, `skills/war/SKILL.md`)

In the `## ledger.json — run state` jsonc block, add one top-level key (sibling of `phases` /
`pr_url?`):

```jsonc
adjudications?: ["<preformatted row>"]   // run-long accumulated adjudication set (spec D8) —
                                         // the record the recovery relaunch re-threads
                                         // args.adjudications from; absent ⇒ none recorded
```

In the `## Workflow per-phase args contract` section's `Optional adjudications (array|null)`
paragraph, extend "re-threaded in full — from the run-ledger record" with the citation
"(the `ledger.json` top-level `adjudications` key above)". In `skills/war/SKILL.md` step 5
(the "Assemble, thread, and record" step), extend "record each row in the run ledger" with the
same parenthetical citation to `references/schemas.md`. Doc-only; row shapes and threading
behavior unchanged.

### 4.2 `held:land-failed` prose truth (#1039 — `skills/war/SKILL.md`)

In the `## Checkpoint` Outcome-handling list, locate the `- **\`held:land-failed\`**` bullet's
sentence beginning "A **gate-time `environment` failure that reaches this hold has already
spent…". Replace it with the two-path form (final wording is the plan's to polish; both arms are
required):

> A gate-time `environment` failure that reaches this hold **via the primary land** has already
> spent its in-workflow `environment-proceed` retry (the bounded fresh-env re-land came back
> `environment`-classified a second time — see the `gate_failed` routing bullet below), so the
> manual re-run below is the second line of defense: expect a genuinely persistent environment and
> inspect it before re-running. One that reaches it **from a baseline-proceed re-land has not** —
> that arm routes here directly with no chaining (deliberate, the no-chaining rule) — so the first
> manual re-run there is genuinely the first fresh attempt.

The sibling `- **\`environment\`** →` bullet (D18-pinned) is not touched; its "the retry provably
spent" claim is correct for the exhaustion path it describes.

**Token sweep (floor, not ceiling):** grep `already spent` across `skills/war/` and `agents/` and
handle every match against the two-path truth. Then **hand-scan the same-scope prose** — the full
Outcome-handling list and the `### Recovery relaunch` / runbook subsections — for paraphrase
echoes of the unconditional claim ("retry provably spent", "second line of defense") that the grep
cannot catch, adjudicating each (the `environment` bullet's claim is correct — keep) and listing
each straggler edited as a survey-derived correction in the task report.

### 4.3 Shared-mechanics adjudication duty (#1084 — `skills/war/SKILL.md`)

Append a fourth bullet to the `### Recovery relaunch` section's **Shared mechanics (both entry
points)** list:

> - **Adjudication continuity** — re-thread the **full accumulated `args.adjudications` set from
>   the ledger record** (the `ledger.json` top-level `adjudications` key,
>   [references/schemas.md](references/schemas.md)), alongside `args.recovery`, so relaunch seats
>   are never adjudication-blind — the same duty as the held-partial-phase runbook's step 4.

This cites the key 4.1 documents, so 4.1 lands with or before it (same plan, ordering only).

### 4.4 Manifest finalization + envelope aggregates (#1078 parts 2–3 — `skills/war/references/schemas.md`, `skills/war/SKILL.md`, `skills/war-review/SKILL.md`)

**Contract (`schemas.md`, `## Run manifest` block):** add to the per-phase record:

```jsonc
envelope: { totalTokens: 1234567, totalToolCalls: 265, agentCount: 22 } | null
// MUST — the Workflow task-completion envelope's aggregates, stamped at phase return;
// any field (or the whole object) the Lead cannot source is null — never transcript-derived
```

Add `envelope` aggregates to the MUST-carry list (binding-to-attempt, null-tolerated — same
posture as `workflowRunId`).

**Producer (`skills/war/SKILL.md`):** in the `## Run manifest (telemetry)` section's **On phase
return** bullet, add the envelope aggregates to the stamp list, sourcing them from the Workflow
task-completion notification's envelope — the same harness-surfaced channel the **At phase
launch** bullet already reads `workflowRunId`/`transcriptDir` from; unsurfaced ⇒ `null`,
`/war-review` renders `n/a`. In `## Checkpoint`, add one short bullet (before the issue-lifecycle
floor bullet):

> - **Manifest stamp (telemetry, fail-open).** Before posting the phase report, complete the Run
>   manifest section's on-phase-return stamp — `endedAt`, dispatch counts, task terminal statuses,
>   `land`, and the envelope aggregates. A skipped stamp is the "unfinalized phase record"
>   friction row `/war-review` reports; fail-open discipline unchanged (a failed write logs one
>   line and never blocks the advance).

**Consumer (`skills/war-review/SKILL.md`):** three coherence edits, same commit as the contract
change (constraint: the surfaces must never contradict):

1. §2 (Mine the transcripts): replace the parenthetical "(do not fall back to the manifest for
   token counts — the manifest never carries them)" with: prefer the manifest's per-phase
   `envelope` aggregates for **totals** when present (the authoritative non-transcript source);
   the input/output/cache **split** remains transcript-mined and renders `n/a` when unsourceable.
2. §3 (Tally): the "total tool calls" and "total tokens" rows' Source cells become "manifest
   `phases[].envelope`, else mined (transcripts)"; the split qualifier stays mined-only.
3. §4 (Friction): add one signal class — **unfinalized phase record**: a phase whose record lacks
   `endedAt`, `tasks`, or `land` although the run ended or a later phase started — evidence the
   phase-close stamp was skipped.

**Token sweep (floor, not ceiling):** grep `manifest` across `skills/war-review/SKILL.md` and
reconcile every claim about what the manifest carries with the widened contract. Then **hand-scan
the same-scope prose** — the §3 tally table rows and the `## Scavenge` section — for indirect
claims a keyword grep misses (e.g. source-column phrasing, "never carries" paraphrases), listing
each straggler corrected as a survey-derived correction.

### 4.5 Doctrine anchor restore (#1087 — `CONTEXT.md`, `skills/war/SKILL.md`, `docs/specs/2026-07-22-audit-adjudication-threading-design.md`, `skills/war/assets/skill-doc-contracts.test.mjs`)

- **CONTEXT.md** — in the `**Adjudication**:` glossary term, extend the `_Avoid_` line so it
  regains the literal phrase: "…it never waives a gate, floor, or backstop (ADR 0017), and a row
  is **never mined from arbitrary prose** — rows come only from the two named producers."
- **skills/war/SKILL.md** — in step 5's **Provenance discipline** sentence, after "the Lead never
  synthesizes a row to smooth over an unruled delta (spec constraint 6)", add "and never mines one
  from arbitrary prose — rows come only from the two producers above". Two standing homes, one
  grep-able framing.
- **Historical spec** — at the sentence in the 2026-07-22 spec citing "the existing `lenses.md`
  'never mined from arbitrary prose' doctrine", append a dated bracketed correction note: the
  citation was false (the lenses reference never carried the phrase; the CONTEXT.md term was the
  sole home), the removal orphaned the doctrine, and the anchor is restored per this spec / #1087
  — cite `docs/learnings/spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong.md`.
- **Drift lock** — new test in `skills/war/assets/skill-doc-contracts.test.mjs`: read `CONTEXT.md`
  (repo root relative to the test file), extract the `**Adjudication**:` block by construct (from
  the bolded term to the next bolded glossary term), assert `/never mined from arbitrary prose/i`.
  Prove red by temporarily removing the phrase (red-proof noted in the commit body, matching the
  file's house style). A sibling assertion locks the `## ledger.json` jsonc block containing
  `adjudications` (guards 4.1).

**Token sweep (floor, not ceiling):** grep `mined from arbitrary prose` repo-wide and classify
every hit — standing home (CONTEXT.md term, SKILL.md step 5: keep), historical spec (correction
note site), learnings file (leave — lesson bodies are records). Then **hand-scan the same-scope
prose** — the CONTEXT.md `Adjudication` term body and SKILL.md step 5 — for paraphrase echoes
("synthesizes a row", "ruling already made and routed") to confirm the restored clause composes
with rather than duplicates them, listing any straggler adjusted as a survey-derived correction.

### 4.6 Roadmap record (#1053 — `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md`)

Row 6 (`war-memory-hardening`): append `CONTEXT.md` to the Files-owned cell. Shared-file
contention table, `CONTEXT.md` row: `2, 3, 4, 5, 7` → `2, 3, 4, 5, 6, 7`. Nothing else in the
file moves; the roadmap remains a record, not the live queue.

### 4.7 Guard deny-string truth (#1085 — `hooks/validate-auditor-git.sh`)

In the READ-FORM branch-enforcement arm (the `if [ "$subcmd" = "branch" ]` block):

- **Deny message** — replace the "takes only =-attached read flags" characterization with one that
  matches the enumeration, e.g.: `git branch read flags only — value-carrying flags must be
  =-attached (--contains=<rev>, --merged=<rev>, --points-at=<rev>) and bare read flags are
  enumerated (--list, -a, -r, --show-current, -v); '<tok>' is not one — space-form values and
  write flags deny`. The plan may polish wording, but the literal `=-attached` must survive
  (constraint 4) and no blanket adjective may cover the bare-flag set.
- **Header comment** — correct "EVERY token must be an enumerated read flag with =-attached
  values" to the mixed-shape truth ("value-carrying flags =-attached; bare read flags enumerated
  exactly").
- Case arms, allow/deny behavior, and every other arm of the guard are untouched.

**Token sweep (floor, not ceiling):** grep `=-attached` across `hooks/` and adjudicate every
match — the deny string (reworded), the header comment (corrected), and the test file's J7/J16
comments (verified accurate as-is: they describe genuinely `=-attached` flags). Then **hand-scan
the same-scope tests and comments** — the full J-series `git branch` block of
`hooks/validate-auditor-git.test.sh` and the branch-arm comment block — for other blanket
characterizations of the flag set the grep cannot catch, listing each straggler as a
survey-derived correction.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/references/schemas.md` | `ledger.json` block: top-level `adjudications` key (4.1); args-contract paragraph citation (4.1); Run-manifest block: per-phase `envelope` aggregates + MUST-carry entry (4.4) |
| `skills/war/SKILL.md` | step-5 ledger citation (4.1); `held:land-failed` bullet two-path qualification (4.2); Shared-mechanics "Adjudication continuity" bullet (4.3); Run-manifest on-phase-return envelope stamp + Checkpoint "Manifest stamp" bullet (4.4); step-5 doctrine framing (4.5) |
| `skills/war-review/SKILL.md` | §2 manifest-fallback rewrite, §3 tally sources, §4 "unfinalized phase record" signal (4.4) |
| `CONTEXT.md` | `Adjudication` term `_Avoid_` line regains "never mined from arbitrary prose" (4.5) |
| `docs/specs/2026-07-22-audit-adjudication-threading-design.md` | dated bracketed correction note at the false `lenses.md` citation (4.5) |
| `skills/war/assets/skill-doc-contracts.test.mjs` | new locks: CONTEXT.md Adjudication-block phrase; `ledger.json` block `adjudications` key (4.5, 4.1) |
| `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md` | row-6 Files cell + `CONTEXT.md` contention row (4.6) |
| `hooks/validate-auditor-git.sh` | branch-arm deny string + header comment reword, behavior unchanged (4.7) |

`hooks/validate-auditor-git.test.sh` is expected untouched (J16's `=-attached` pin keeps passing);
it is edited only if the 4.7 survey finds a straggler comment.

## 6. New domain terms (CONTEXT.md)

None. The `Adjudication` term is amended (restored clause), not added; no new construct is named.

## 7. Recommended ADRs

None. No architectural decision changes: the manifest widening rides the existing "nesting may be
refined; the MUST-carry list is binding" clause of the manifest contract; the doctrine restore and
runbook fixes re-align records with already-ratified behavior (ADRs 0008, 0013, 0017 untouched).

## 8. Open risks / implementation notes

- **Envelope availability is harness-version-dependent.** The task-completion envelope's aggregate
  fields may be absent or renamed under a future harness; the contract's null-tolerated posture is
  the mitigation, and `/war-review` renders `n/a` — never fall back to inventing totals from
  transcripts (they undercount ~20×, the incident's own finding).
- **Same-commit coherence pairs.** (a) The `/war-review` "manifest never carries them" rewrite
  must land in the same commit as the manifest-contract widening; (b) the Shared-mechanics bullet
  cites the ledger key, so 4.1's contract addition lands with or before 4.3.
- **Concurrent SKILL.md/CONTEXT.md contention.** Sibling specs authored this survey round also
  touch `skills/war/SKILL.md` (and the drift-guard sibling touches
  `skills/war/assets/skill-doc-contracts.test.mjs` for the D18 loop). All edits here anchor by
  named construct; plan conversion should keep this spec's SKILL.md edits in one task to stay
  file-disjoint within its phase.
- **The 4.2 rewrite sits near D18-pinned text.** The doc-contract extraction is construct-scoped
  to the `environment` bullet, so editing the `held:land-failed` sibling cannot trip it — but run
  the doc-contract suite locally before merge anyway; it is the cheap proof.
- **Wording latitude.** 4.2's and 4.7's replacement texts are canonical in substance, not byte-
  pinned; a converter/worker may polish phrasing so long as every named element (both arms in 4.2;
  the `=-attached` literal and no blanket adjective in 4.7) survives.

## 9. Non-goals / deferred

- **#1078 part 1 (auditor guard-denial churn)** — overtaken by the v0.14.49 one-bare-git-verb
  prompt contract; only re-measurement on a ≥ 0.14.49 run remains, owned by any future
  `/war-review`, not this spec.
- **No mechanized manifest writer/finalizer.** The manifest remains Lead prose bookkeeping; a
  code-enforced stamp would contradict its fail-open, no-code-reads-it charter. Detection (the
  friction signal), not enforcement.
- **No auditor-guard grammar changes.** 4.7 is message/comment text only; no flag is added to or
  removed from the branch arm's accepted set, and no other guard arm is touched.
- **No engine threading changes.** `args.adjudications` production, shape, and byte-identity
  back-compat are as landed; this spec only documents the ledger record and the re-thread duty.
- **No roadmap regeneration.** Only the two stale cells move; the roadmap is not re-derived
  against the current tree.
- **No edits to lesson bodies** (`docs/learnings/`) — the mined lessons stand as records; their
  issues are closed by fixing the surfaces they name.

## 10. Validation criteria

1. **Doc-contract suite green with new locks red-provable:**
   `node --test skills/war/assets/skill-doc-contracts.test.mjs` passes; temporarily deleting the
   restored phrase from the CONTEXT.md `Adjudication` block, or the `adjudications` key from the
   `ledger.json` jsonc block, makes the corresponding new lock fail (red-proof recorded in the
   commit body).
2. **Guard tests green, untouched:** `bash hooks/validate-auditor-git.test.sh` passes with no test
   edits — in particular J16 still finds `=-attached` in the space-form deny stderr, and every
   J-series `git branch` allow/deny outcome is unchanged.
3. **Deny-string self-consistency:** the branch-arm deny message no longer applies an
   "=-attached"-style blanket adjective to the bare flags; grep of `takes only =-attached` over
   `hooks/` returns nothing.
4. **Ledger contract closes the loop:** the `## ledger.json` jsonc block names `adjudications`;
   the args-contract paragraph and SKILL.md step 5 both cite the key (grep `adjudications` over
   `skills/war/references/schemas.md` and `skills/war/SKILL.md` shows the citations; each match
   adjudicated per the 4.1 mechanics).
5. **Two-path land-failed prose:** the `held:land-failed` bullet contains both arms — a
   primary-land "spent" arm and a baseline-proceed "not spent / no chaining" arm; no surface in
   `skills/war/` or `agents/` still states the unconditional "already spent" claim (sweep 4.2's
   grep + survey record present in the task report).
6. **Shared-mechanics duty present:** the `### Recovery relaunch` Shared-mechanics list contains
   the adjudication-continuity bullet naming `args.adjudications`, the ledger record, and
   `args.recovery`.
7. **Manifest round-trip coherence:** `skills/war/references/schemas.md` documents per-phase
   `envelope` aggregates in the MUST-carry list; `skills/war/SKILL.md` stamps them on phase return
   and carries the Checkpoint "Manifest stamp" bullet; `skills/war-review/SKILL.md` contains no
   "manifest never carries them" claim, sources totals "manifest envelope, else mined", and lists
   the "unfinalized phase record" friction signal (sweep 4.4's grep + survey record present).
8. **Doctrine anchor restored and cited:** grep `mined from arbitrary prose` finds the phrase in
   `CONTEXT.md` (Adjudication term) and `skills/war/SKILL.md` (step 5), plus the historical spec's
   correction note and the learnings file — and nowhere else unexpected (sweep 4.5's
   classification + survey record present).
9. **Roadmap cells:** row 6's Files cell lists `CONTEXT.md`; the `CONTEXT.md` contention row reads
   `2, 3, 4, 5, 6, 7`.
10. **Whole-suite regression:** `node --test 'skills/**/*.test.mjs'` and the anchored shell-test
    loop (`for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done`)
    both green at the tip carrying all changes.
