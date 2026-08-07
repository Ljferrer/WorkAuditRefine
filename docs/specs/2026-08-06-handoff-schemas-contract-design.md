# Handoff/followUp mechanization and schemas.md return-contract truth

Issues: #1331, #1333, #1289

The run-contract layer stops lying and stops leaning on Lead vigilance: the Workflow itself files
`disposition: follow-up` findings as `war-followup` issues and stamps the numbers into
`handoff.followUps[]` (with a Checkpoint floor and a `/war-review` signal class as backstops), run-manifest
timestamps become mandated real clock reads, and `skills/war/references/schemas.md` gets a truth sweep —
the `landResult` held-path row, the `acceptance_criteria_covered` id form and join key, the D4/D5 tag-family
conflation, the gate-audit trio naming fork, the undefined "two-contract rule" label, and every stale
"defined-but-not-yet-emitted" parenthetical describing landed precision-chain work as future.

## 1. Context — the gap / problem

**F1 — follow-up dispositions return unfiled.** In the 0.16.0 run, every `handoff.followUps[]` entry
carried `issue: null` across both follow-up-bearing phases (7 + 1 findings) and the Workflow filed none;
all 8 `war-followup` issues exist only because the Lead noticed at the Checkpoint and filed by hand
(verified: issue #1331 (2026-08-06)). The live tree matches: the `followUps` row of the Workflow per-phase
return block in `skills/war/references/schemas.md` still reads "issue# (null until the Lead files it)"
(verified: live tree read 2026-08-06). The engine can never do better today — the handoff assembly in
`skills/war/assets/workflow-template.js` maps `issue: m.issue ?? null` over `minorsFiled`, and no
assignment site anywhere sets `.issue` on a `minorsFiled` entry, so the field is null by construction
(verified: live read of the handoff-assembly block, anchored by the `followUps:` mapping). The pinned
handoff test in `skills/war/assets/workflow-template.test.mjs` asserts exactly this null shape ("followUps
carry { issue, reason } — issue is null until the Lead files it") (verified: live read). The disposition
ladder's own guarantee — only `follow-up`-routed findings file as `war-followup`, nothing drops silently
(ADR 0013 prose in `skills/war/SKILL.md` and `skills/war/references/schemas.md` GitHub conventions) — is
therefore held up by Lead vigilance alone.

**F3 — degenerate manifest timestamps.** All 8 `startedAt`/`endedAt` fields across that run's manifest
were one identical placeholder literal, rendering wall-clock unusable while looking plausible (verified:
issue #1331 (2026-08-06)). Neither the Run-manifest block in `skills/war/references/schemas.md` nor the
"When — at phase boundaries" bullets in `skills/war/SKILL.md` § Run manifest states that these fields must
be real clock reads (verified: live tree read 2026-08-06 — no clock-read note exists on either surface).

**F2 / F4 — already addressed, verification only.** F2 (the unapplied absorb) was fixed post-run in PR
#1320 (verified: issue #1331 (2026-08-06)); F4's ask is live on the auditor card — `agents/war-auditor.md`
carries "No pipes, chaining, redirects…" and "`git grep` stays denied — the Grep tool is the sweep
channel" (verified: live tree read 2026-08-06). This spec claims them for closure bookkeeping only.

**#1333 — six budget-demoted contract-layer findings, all still live at the tip** (each verified by live
read of `skills/war/references/schemas.md`, 2026-08-06, anchored by construct):

1. The `acceptance_criteria_covered` row of the WorkerResult block never fixes the id's lexical form —
   "`<end-state id>`" with no token shape and no join to the verbatim-condition keying its neighbours use
   (`plan_ref`, `endStateAttestations.condition`, handoff `endState.condition`) (verified: issue #1333
   (2026-08-06) + live read). The since-landed cross-check merely interpolates the ids into the per-task
   gate-audit seat prompt and leaves the join to seat judgment (verified: live read of
   `skills/war/assets/workflow-template.js` — the `ACCEPTANCE_IDS_RULE` const and the claimed-ids clause
   in the gate-audit prompt builder). The engine's own test fixture already uses 1-based ordinal strings
   (`['6', '7']`) (verified: live read of the A1 cross-check test in
   `skills/war/assets/workflow-template.test.mjs`).
2. The `phase.endState` widening's missing marker is moot in effect — Tasks 3.1/3.2 landed with 0.17.0
   (verified: `.claude-plugin/plugin.json` version 0.17.0 + the land-barrier endstate-check dispatch
   present in `skills/war/assets/workflow-template.js`, live read 2026-08-06) — but the clause was never
   corrected citing #1333, and the parentheticals now lag the other way: the Optional `intent` paragraph
   still says "consumed in Phase 3: parsed by Task 3.1, executed … by Task 3.2", and the WorkerResult row
   still says "(cross-check lands with Task 3.2)", describing landed work as future (verified: live read).
   Five sibling rows still carry the literal "defined-but-not-yet-emitted" marker for landed
   precision-chain producers — `endStateAttestations`, `mappedTests`, `done-unmet`, `doneWhen`, and the
   handoff `endState` row — a dated snapshot of 5 marker instances + 2 future-tense parentheticals at
   base 6fff2ee (2026-08-06).
3. No join key between End-state ids and the verbatim-condition keying (verified: issue #1333
   (2026-08-06) + live read — the `phase.endState` row shape `{ condition, tag, check }` carries no id).
4. The Optional `intent` paragraph calls `tag` "the condition's parsed D5 evidence tag", conflating ADR
   0044's D4 evidence-tag family with its D5 End-state tag set; the same wording is mirrored in
   `skills/war/SKILL.md` step 1 (verified: live read of both surfaces, 2026-08-06).
5. The gate-audit-family trio is enumerated "per-task, integrated-tip, end-state-only" in the
   `endStateAttestations` bullet but "post-merge, integrated-tip, end-state-only" in the `adjudications`
   paragraph — one contract file, two names for member 1 (verified: live read). The same fork exists in
   `skills/war/assets/workflow-template.js` comments (the AuditVerdict schema comment uses "per-task",
   the adjudicationClause comment uses "post-merge") — a survey-derived straggler beyond the issue's own
   file list (verified: live read).
6. "(the two-contract rule intact)" cites a label defined nowhere for schemas.md's readers; since the
   pin, the token has additionally come to name a *different* construct — `/red-team`'s drift-guarded
   "Two-contract summary" (probe side / gate side) in `skills/red-team/references/lenses.md` — so the
   bare label now collides across skill families (verified: live grep of `two-contract` across `skills/`,
   2026-08-06).

**#1289 — the `landResult` row states the opposite of load-bearing behavior.** The row reads
"`landResult, // MergeResult of the in-flow land, or null if held`" (verified: live read 2026-08-06,
anchored by the `landResult` row of the Workflow per-phase return block). The live engine: the initial
land dispatch's result *is* `landResult` (non-null on `held:submodule-pr` and `held:land-failed`), both
re-land arms reassign it on their `submodule-pr` and `landed` branches (the #1245 arm-symmetry
reassignments), and it is null only when no land was dispatched (pre-land holds) **or** the land dispatch
died returning nothing (the terminal-else arm — `held:land-failed` with `detail: null`) (verified: live
read of the land-routing region of `skills/war/assets/workflow-template.js`). The issue's suggested
wording ("null only when no land was dispatched") misses the dead-dispatch null — a survey-derived
refinement (verified: issue #1289 (2026-08-06) + live read of the terminal-else comment).

## 2. Pivotal constraints

- **The Workflow sandbox has no shell and cannot import** — issue filing must ride a dispatched agent.
  The refiner is the Bash-capable seat that already performs gh writes (it opens submodule PRs on the 2B
  path), and the endstate-check dispatch is the ratified precedent for a refiner-typed, own-schema,
  fail-open evidence dispatch.
- **Prompt-surface split**: a new refiner `dispatchKind` requires the standing card
  (`agents/war-refiner.md`) and the string-built prompt in `workflow-template.js` to change in the same
  commit — they drift silently otherwise.
- **Fail-open, never a hold**: filing is detection/routing machinery (ADR 0017-consistent); a dead or
  partial filing dispatch must never block a land or add a `held:*`. No new task status, no
  `HARD_ESCALATION_REASONS` or `KNOWN_LAND_DECISIONS` member (ADR 0005; `land-decision.mjs` untouched).
- **Every gh write batch is preflighted** (ADR 0026): the filing dispatch must run
  `gh-preflight.sh "<expected-account>"` first; the expected account reaches the Workflow as a new
  optional arg threaded from `overrides.ghUser`, and an empty string is the script's documented no-op —
  no account handle is ever baked into committed prose.
- **Pinned tests bind the wording**: the handoff followUps null-pin test must flip in the same task as
  the engine change; the A1 redefinition anchors (`claimed End-state ids`, `empty when the task claims
  none`, `gate-audit pass cross-checks`) must stay green across the WorkerResult comment rewrite on all
  three mirrored surfaces (`schemas.md`, `ACCEPTANCE_IDS_RULE`, `agents/war-worker.md`).
- **schemas.md is a standing contract read by agents with no access to run artifacts** — every label used
  there must resolve in-file (the finding-6 rule).
- **Ordering**: this group lands after the `gate-audit-finding-routing` sibling group — both edit
  `skills/war/assets/workflow-template.js` (the survey manifest carries the machine hint). The
  `skills/war/SKILL.md` contention with `gate2-publication-guard` is region-disjoint (step-1 mirror +
  Checkpoint vs Gate-2), so no edge.
- Committed prose must stay redaction-lint clean (no home paths, emails, handles).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|---|---|
| D1 | Who files follow-up findings? | The Workflow, via one refiner **`file-followups:phase-<id>`** dispatch (new `dispatchKind: file-followups`) after the land decision resolves and before handoff assembly, on both handoff-emitting paths (`landed`, `held:escalation`), gated on a non-empty `minorsFiled`. Defense in depth: Checkpoint floor (D4) + `/war-review` signal (D8) backstop it. (issue #1331's first suggested arm; the endstate-check dispatch precedent) |
| D2 | Filing result shape | `FOLLOWUP_FILING_RESULT` — `{ filed: [{ n, issue }] }`, `n` the 1-based ordinal of the dispatched entry list (the `ENDSTATE_CHECK_RESULT` ordinal idiom), `issue` a number or null. The Workflow stamps matched entries' `.issue`; unmatched/absent rows stay null. Fail-open: a dead dispatch logs one line and the phase proceeds. |
| D3 | Double-filing on resume/relaunch | The dispatch prompt mandates dedup-first: `gh issue list --label war-followup --state open` + exact-title match reuses the existing number instead of filing a duplicate (the retired-token sweep's dedup discipline). |
| D4 | Checkpoint floor form | A Lead-prose floor bullet in `skills/war/SKILL.md` § Checkpoint (beside the Issue-lifecycle floor): before advancing the DAG past a handoff-emitting phase, every `handoff.followUps[]` entry must carry a non-null `issue`; any null ⇒ the Lead files it now inside the preflighted per-phase gh-write batch and stamps the number into the ledger's `handoff` record — never advance over a null. Extending `assert-issues-filed.sh` into a mechanical check is deferred (§9). |
| D5 | End-state id lexical form + join (findings 1+3) | Ratify the engine's de-facto form: **the condition's 1-based ordinal in the intent's numbered End-state list, rendered as a string** (`"7"`), resolving to that condition's verbatim text — the `plan_ref` / `endStateAttestations.condition` / handoff `endState.condition` key. Stated in the WorkerResult row comment and mirrored into `ACCEPTANCE_IDS_RULE` + `agents/war-worker.md` in the same task. No `id` member is added to the `phase.endState` row shape (§9). |
| D6 | Trio naming fork (finding 5) | One canonical enumeration — **"per-task (post-merge), integrated-tip, end-state-only"** — at both `schemas.md` sites; the two forked `workflow-template.js` comments are aligned in the same diff (survey-derived stragglers). |
| D7 | "two-contract rule" label (finding 6) | Expand in place: "(findings carry defects; attestation rides `endStateAttestations` — two separate contracts)". No new glossary term; avoids colliding with `/red-team`'s pinned Two-contract summary. The engine's mirroring schema comment is aligned in the same diff. |
| D8 | Retroactive detection (issue #1331's third arm) | `/war-review` § 4 gains an **"unfiled follow-ups"** signal class: any `handoff.followUps[]` entry with `issue: null` on a handoff-emitting phase, sourced from the mined workflow-return record in the transcripts, else the run ledger's phase `handoff` field when discoverable; unsourceable ⇒ no row, never fabricated. |
| D9 | `landResult` row (issue #1289) | Rewrite to the three-case truth: the dispatched land/re-land MergeResult — initial land and both re-land arms assign it, so `pr_number`/`pr_remote` are readable on `held:submodule-pr`, and `held:land-failed` carries the failing MergeResult; null only when no land was dispatched (pre-land holds) or the land dispatch died returning nothing. |
| D10 | Manifest timestamps (F3) | A real-clock-read mandate on both surfaces: `schemas.md`'s Run-manifest section and `skills/war/SKILL.md` § Run manifest — every `startedAt`/`endedAt` is a clock read captured at the stamped boundary (e.g. `date -u +%Y-%m-%dT%H:%M:%SZ` at stamp time), never a placeholder or copied literal. [assumed: additionally, `/war-review` treats an all-identical timestamp set as degenerate and renders wall-clock `n/a` with a note — an inference beyond F3's "schema-side note" ask; if wrong: drop the `/war-review` render guard, keep the two doc mandates] |
| D11 | Stale precision-chain parentheticals (finding 2 + sweep) | Retire every future-tense marker/parenthetical for landed precision-chain work in `schemas.md`: rewrite the 5 "defined-but-not-yet-emitted" instances and the 2 future-tense parentheticals to landed past-tense provenance (keep the plan/task citation, e.g. "produced by Task 3.2, landed 0.17.0"), citing #1333. Grep is the floor; the manual survey duty (§4) is the ceiling. |

## 4. Mechanics

**`skills/war/assets/workflow-template.js`** (after the `gate-audit-finding-routing` group lands; rebase
onto its result):
- New `FOLLOWUP_FILING_RESULT` schema const beside `ENDSTATE_CHECK_RESULT`.
- New dispatch site between the land-decision routing and the handoff assembly: when
  (`landDecision === 'landed' || landDecision === 'held:escalation'`) and `minorsFiled.length > 0`,
  dispatch one refiner (`dispatchKind: 'file-followups'`, label `file-followups:phase-<id>`). The prompt:
  run the preflight first (`gh-preflight.sh` under the plugin's `skills/_shared/`, invoked via the
  template's agent-resolved `$VAR` placeholder idiom with the threaded `ghUser` as its quoted arg;
  exit 2/3 ⇒ return what you have, file nothing); dedup per D3; then
  file one `war-followup` issue per enumerated entry — title from the finding title, body carrying the
  why-not-absorbable reason, task id, and the phase-epic linkage (`ph.epicIssue` when present); return
  `{ filed: [{ n, issue }] }` only. Stamp `minorsFiled[n-1].issue` for each returned row with a numeric
  `issue`; everything else stays null. Fail-open on a dead/partial return: one `log()` line, no hold.
- Thread new optional `args.ghUser` (string, default `""` — the preflight's documented no-op).
- Handoff assembly is unchanged (`issue: m.issue ?? null` now sees stamped values).
- Comment alignments (same diff, survey-derived): the AuditVerdict schema comment's trio enumeration and
  the adjudicationClause comment's trio enumeration both adopt D6's canonical form; the schema comment's
  "(the two-contract rule)" adopts D7's expansion; `ACCEPTANCE_IDS_RULE` gains D5's id-form + join
  sentence (anchors preserved).

**`agents/war-refiner.md`** — the dispatch-kind enumeration and the Return section gain the
`file-followups` flavor (same commit as the prompt): never out-of-mode, fail-open evidence return, never
a `MergeResult`; dedup-first; preflight-first.

**`agents/war-worker.md`** — the `acceptance_criteria_covered` reporting line gains D5's id-form + join
sentence (mirror of `ACCEPTANCE_IDS_RULE`; the doc-contract anchors keep matching).

**`skills/war/references/schemas.md`** — one coherent truth pass:
- WorkerResult `acceptance_criteria_covered` row: D5's form + join; "(cross-check lands with Task 3.2)"
  → landed provenance (D11).
- `endStateAttestations` bullet: D6 trio naming; D7 two-contract expansion; D11 marker retirement.
- Optional `intent` paragraph: "D5 evidence tag" → "D5 End-state tag" (finding 4); D11 on the
  "consumed in Phase 3…" parenthetical.
- `adjudications` paragraph: D6 trio naming.
- `mappedTests`, `done-unmet`, ledger `doneWhen`, handoff `endState` rows: D11 marker retirement.
- Workflow per-phase return block: `landResult` row per D9; `followUps` row comment → "issue# stamped by
  the Workflow's file-followups dispatch; null only when filing failed or was skipped — the Checkpoint
  floor then has the Lead file before the DAG advances"; `minorsFiled` row comment notes the stamping.
- Run-manifest section: D10's real-clock-read mandate sentence.
- Workflow per-phase args contract: the new optional `ghUser` arg documented beside `agentPrefix`.

**`skills/war/SKILL.md`**:
- Step 1 (Decompose): the mirrored "D5 evidence tag" → "D5 End-state tag" (same commit as the
  schemas.md fix — the two surfaces are stated mirrors).
- § Run manifest, "When — at phase boundaries": D10's clock-read mandate.
- § Per phase: thread `overrides.ghUser` into the Workflow args as `args.ghUser`.
- § Checkpoint: the D4 follow-up floor bullet; the phase-report handoff rendering already lists
  "follow-ups filed (issue + why-not-absorbable)" and needs no change.

**`skills/war-review/SKILL.md`** — § 4 gains the D8 "unfiled follow-ups" signal class; § 3's wall-clock
rendering gains the D10 degenerate-timestamp `n/a` guard.

**`skills/war/assets/workflow-template.test.mjs`**:
- Flip the followUps null-pin test: with a follow-up finding and a filing dispatch returning
  `{ filed: [{ n: 1, issue: 1234 }] }`, `handoff.followUps` carries `issue: 1234`.
- New coverage: fail-open (dead filing dispatch ⇒ `issue: null`, `landDecision` unchanged); no dispatch
  when `minorsFiled` is empty; dispatch fires on `held:escalation` too; ordinal mismatch rows ignored.
- The A1 anchors and the endStateBlock-sites pin stay green (message text may adopt D6's naming).

**Mandatory manual same-scope survey (grep is a floor, not a ceiling).** For every retirement/harmonization
sweep above — `defined-but-not-yet-emitted`, `null until the Lead files it`, `D5 evidence tag`, the trio
enumerations, `two-contract` — after the file-scoped grep, hand-scan the target files' same-scope tests
and comments (`workflow-template.js` comments, `workflow-template.test.mjs` test titles/assert messages,
`skill-doc-contracts.test.mjs` extraction anchors) and list each straggler as a survey-derived correction.
Stragglers already found this way and folded in above: the two forked trio comments and the
"(the two-contract rule)" schema comment in `workflow-template.js`; the followUps null-pin assert message;
the `ACCEPTANCE_IDS_RULE`/`agents/war-worker.md` mirror pair. Adjudicated exempt (narration, not
recipe): test assert messages that merely narrate "(two-contract rule)" may stay if untouched by the
flipped assertions.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | file-followups dispatch + schema + stamping; `args.ghUser`; comment alignments (D6/D7/D5) |
| `skills/war/references/schemas.md` | followUps/landResult/minorsFiled row rewrites; D5 id form + join; D6/D7; "D5 End-state tag"; D11 marker retirement; manifest clock mandate; `ghUser` arg row |
| `skills/war/SKILL.md` | step-1 tag-family mirror fix; manifest clock mandate; `ghUser` threading; Checkpoint follow-up floor |
| `skills/war-review/SKILL.md` | "unfiled follow-ups" signal class; degenerate-timestamp `n/a` guard |
| `agents/war-refiner.md` | `file-followups` dispatch flavor + return contract (footprint delta — required by the prompt-surface split) |
| `agents/war-worker.md` | `acceptance_criteria_covered` id-form mirror (footprint delta, one sentence) |
| `skills/war/assets/workflow-template.test.mjs` | null-pin flip + new filing coverage (footprint delta — the engine change's guard) |

## 6. New domain terms (CONTEXT.md)

None. The new `file-followups` dispatch kind is absorbed by CONTEXT.md's existing **Dispatch kind** entry,
whose discriminator list is explicitly open ("…"); D7 deliberately avoids minting "two-contract rule" as a
term.

## 7. Recommended ADRs

None. The filing dispatch implements ADR 0013's existing nothing-drops-silently guarantee (mechanism, not
policy); ADR 0005/0017/0026 are conformed to, not amended.

## 8. Open risks / implementation notes

- **Ordering (machine hint honored):** land after the `gate-audit-finding-routing` group — both edit
  `skills/war/assets/workflow-template.js`; the first implementation act is a rebase onto its landed
  result. The `skills/war/SKILL.md` overlap with `gate2-publication-guard` is region-disjoint; no edge.
- **Footprint delta:** `agents/war-refiner.md`, `agents/war-worker.md`, and
  `skills/war/assets/workflow-template.test.mjs` are touched beyond the group's declared footprint;
  contention-check them at plan time (the refiner-card + template edit must be one task — the
  prompt-surface split rule).
- **Decomposition:** `schemas.md` is touched by nearly every strand — carve it as one task (or serial
  waves), never parallel same-file tasks. The engine change + its test flip are one task; the
  agent-card mirrors ride the tasks whose prompts they mirror.
- **gh failure modes:** preflight exit 2/3, rate limits, and network failures all resolve to unfiled
  entries (`issue: null`) — the Checkpoint floor is the guaranteed catch; the signal class is the audit
  trail. Filing is never retried in-loop.
- **Replay safety:** `resumeFromRunId` replays the journal's cached filing result (no re-execution); a
  recovery relaunch re-dispatches — D3's dedup makes that safe.
- **Retirement-grep false-red caution:** D6's canonical form contains the substring "per-task" — §10's
  checks assert the canonical enumeration's presence at named sites rather than blanket absence of the
  old member names; all greps are file-scoped (this spec file itself carries the retired tokens).

## 9. Non-goals / deferred

- **F2 and F4 of #1331** — already addressed (PR #1320; the live auditor card). No work; cite on close.
- **A mechanical Checkpoint floor script** (extending `skills/war/assets/assert-issues-filed.sh` with a
  followUps-nonnull check) — deferred; the prose floor + mechanized filing + signal class close the
  observed gap first. Revisit if a null `issue` ever survives a Checkpoint again.
- **No `id` member on `phase.endState` rows** (finding 3's alternative arm): D5 fixes the join by
  defining the ordinal→condition mapping in prose; widening the row shape would touch the Lead staging
  path, the bare-string normalization, and the endstate-check dispatch for no added mechanical check.
- **No engine change to the disposition/demotion ladder** — routing semantics are untouched; only the
  filing of already-routed `follow-up` findings is mechanized.
- **No CONTEXT.md edit, no new ADR** (§6, §7).
- **No `/war-review --scavenge` changes** — the new signal class applies to manifest-era runs.

## 10. Validation criteria

1. WHEN a phase with ≥1 `follow-up`-routed finding reaches a handoff-emitting outcome THE Workflow SHALL
   dispatch one `file-followups:phase-<id>` refiner step and stamp returned issue numbers so
   `handoff.followUps[]` entries carry non-null `issue` ·
   check: `node --test skills/war/assets/workflow-template.test.mjs` (the flipped null-pin test + the new
   stamping test)
2. WHEN the filing dispatch dies, returns partial rows, or the preflight fails THE Workflow SHALL leave
   unmatched entries `issue: null` and keep `landDecision` unchanged (fail-open, never a hold) ·
   check: `node --test skills/war/assets/workflow-template.test.mjs` (the new fail-open test)
3. WHEN `minorsFiled` is empty THE Workflow SHALL dispatch no filing step ·
   check: `node --test skills/war/assets/workflow-template.test.mjs` (the new no-dispatch test)
4. WHEN the refiner card is read THE `file-followups` flavor SHALL be enumerated with its return shape ·
   check: `grep -n 'file-followups' agents/war-refiner.md`
5. WHEN schemas.md's return contract is read THE followUps row SHALL no longer claim the Lead-files-it
   null and SHALL name the filing dispatch + Checkpoint floor ·
   check: `! grep -n 'null until the Lead files it' skills/war/references/schemas.md && grep -n 'file-followups' skills/war/references/schemas.md`
6. WHEN the Checkpoint section is read THE DAG-advance floor SHALL require non-null `issue` on every
   `handoff.followUps[]` entry ·
   check: `grep -n 'followUps' skills/war/SKILL.md` (the Checkpoint floor bullet)
7. WHEN `/war-review` § 4 is read THE signal catalogue SHALL carry the "unfiled follow-ups" class ·
   check: `grep -n 'unfiled follow-ups' skills/war-review/SKILL.md`
8. WHEN the Run-manifest contract is read on either surface THE `startedAt`/`endedAt` fields SHALL be
   mandated real clock reads captured at the stamped boundary ·
   check: `grep -n 'clock read' skills/war/references/schemas.md skills/war/SKILL.md`
9. WHEN schemas.md's `landResult` row is read THE comment SHALL state the three-case truth (non-null on
   `held:submodule-pr`/`held:land-failed`; null only on no-land-dispatched or a dead land dispatch) ·
   check: `! grep -n 'or null if held' skills/war/references/schemas.md`
10. WHEN the WorkerResult `acceptance_criteria_covered` row, `ACCEPTANCE_IDS_RULE`, and the worker card
    are read THE id form SHALL be the 1-based ordinal string with its stated join to the
    verbatim-condition key, on all three surfaces ·
    check: `grep -rn '1-based ordinal' skills/war/references/schemas.md skills/war/assets/workflow-template.js agents/war-worker.md` (3 files hit) — then the §4 manual survey over the A1 anchors
11. WHEN ADR 0044's tag families are cited in the contract layer THE phrase "D5 evidence tag" SHALL be
    absent from both mirrored surfaces, replaced by the End-state tag naming ·
    check: `! grep -n 'D5 evidence tag' skills/war/references/schemas.md skills/war/SKILL.md && grep -n 'D5 End-state tag' skills/war/references/schemas.md skills/war/SKILL.md`
12. WHEN the gate-audit-family trio is enumerated in schemas.md THE canonical form
    "per-task (post-merge), integrated-tip, end-state-only" SHALL appear at both sites ·
    check: `grep -c 'per-task (post-merge), integrated-tip, end-state-only' skills/war/references/schemas.md` returns `2` — then the §4 manual survey of `workflow-template.js` comments
13. WHEN the defect-only invariant is stated in schemas.md THE bare "two-contract rule" label SHALL be
    expanded in place ·
    check: `! grep -n 'the two-contract rule intact' skills/war/references/schemas.md && grep -n 'two separate contracts' skills/war/references/schemas.md`
14. WHEN schemas.md is read at the tip THE stale future-tense precision-chain parentheticals SHALL be
    retired to landed provenance ·
    check: `! grep -in 'defined-but-not-yet-emitted' skills/war/references/schemas.md && ! grep -n 'cross-check lands with Task 3.2' skills/war/references/schemas.md` — then the §4 manual survey for un-tokened future-tense stragglers
15. WHEN the full suite runs THE gate SHALL stay green ·
    check: `node --test 'skills/**/*.test.mjs'`
