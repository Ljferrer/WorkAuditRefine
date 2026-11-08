# Doc truth drift and ADR hygiene — bring schemas.md, GLOSSARY.md, references and ADRs back in line with the engine, and adopt living ADRs

dependsOn: `docs/specs/2026-11-08-engine-comment-and-duplication-tidy-design.md`, `docs/specs/2026-11-08-model-routing-and-prompt-byte-budgets-design.md`, `docs/specs/2026-11-08-engine-findings-ace-and-late-fix-design.md`, `docs/specs/2026-11-08-engine-recovery-relaunch-and-land-design.md` — all four land first. Every drift fix here describes engine behavior, so it is written against the engine those specs leave behind. The sibling `shell-floors-tests-and-lint` spec also edits `skills/war/assets/skill-doc-contracts.test.mjs`; this spec lands before it (see §5).

Issues addressed (all 29): #1759, #1850, #1919, #2120, #2136, #2137, #2138, #2139, #2175, #2176, #2178, #2206, #2226, #2231, #2242, #2243, #2247, #2248, #2254, #2255, #2269, #2270, #2283, #2284, #2287, #2347, #2557, #2660, #2664.

## 1. Context — the gap / problem

Twenty-nine open issues say one thing: a doc, comment, card or ADR states an older rule than the engine runs. Most are `war-followup` rows from 2026-09 audits whose file no later task owned (verified: issues #2136 (2026-09-07), #2226 (2026-09-08), #2283 (2026-09-09)). Tracking issue #2560 section F asks for one doc-truth run, not many small PRs. It names the unrun plan `docs/plans/2026-09-06-doc-truth-drift-guards-and-authoring-doctrine.md` as the vehicle and calls it partly out of date (verified: `gh issue view 2560` at 35aa4144). That plan never ran: `docs/adr/` ends at `0058-late-defects-are-fixed-in-the-run.md` and has no meta-ADR (verified: `ls docs/adr/` at 35aa4144).

**A. `skills/war/references/schemas.md` lags the engine.**
- The `adjudications` paragraph says "**Three producers** feed the set" (verified: `schemas.md` at 35aa4144). The args contract says "the three gate-audit-family seats" (verified: issue #2136 (2026-09-07)). The `citationOf` comment in the engine says "three producers" too (verified: `citationOf` in `workflow-template.js` at 35aa4144).
- The handoff `asks` key list reads `asks: [ { task, seat, sha, question, fork } ]` (verified: `schemas.md` handoff block at 35aa4144). The projection also emits `corroborators` and `citationPrefill` when present (verified: handoff `asks: asks.map(...)` in `workflow-template.js` at 35aa4144). A prose WIDENED SHAPE sentence already declares `corroborators` (verified: issue #2137 (2026-09-07); commit 9f5669d3).
- #2139: the `asks` row says a content collision always "MERGES onto the surviving record's `corroborators` list" (verified: `schemas.md` at 35aa4144). `parkAsk` pushes only when `!same(own) && !dup.corroborators.some(same)`; other re-raises are logged only (verified: `parkAsk` at 35aa4144).
- #2175: the `gate_segment` bullet keeps "the A4 latitude lets the engine read a `mode` on `land_segment` instead" (verified: `schemas.md` at 35aa4144). The card's locator is step 10 "Backgrounded gate" (verified: `agents/war-refiner.md` at 35aa4144).
- The `citation?` row says the aced record carries `{ row, threadedRow, rationale }` (verified: `schemas.md` at 35aa4144). `citationOf` returns `{ row: threadedRow, threadedRow, cited: row, rationale }` and refuses rows under `CITATION_MIN_LENGTH` (24) or contained by more than one threaded row (verified: `citationOf` at 35aa4144). The stamp also reaches sweep-polish and terminal commits (verified: issue #2226 (2026-09-08)).
- #2231: the `aced:` block names the ace label `ace:<task>:a<n>` (verified: `schemas.md` at 35aa4144). `aceLabel` mints `ace:<site>:<task>:a<n>`; the `ace-gate:` label is unchanged (verified: `aceLabel` at 35aa4144).
- #2242: the followUps `drainCause?` clause and the asks row both end "produced once … absent until then" (verified: `schemas.md` at 35aa4144). Both fields ship (verified: `drainCauseOf` and the handoff projection at 35aa4144).
- The `finalPhase` bullet and the `carriedPhaseClose` row make the discard-sweep carry unconditional on a non-final phase (verified: `schemas.md` at 35aa4144). The approve trail (`sweepApproved`) demotes a panel-approved, unmerged polish queue to follow-up on any phase (verified: `sweepApproved` at 35aa4144; issue #2248 (2026-09-08)).
- The provision line `preMerged?, // … already-integrated on the adopted branch, skipped` keeps the short gloss #2206 names (verified: `schemas.md` at 35aa4144).
- The Relaunch bullet restates the three relaunch rules beside its pointer to `run-manifest.md` (verified: `schemas.md` at 35aa4144).

**B. Cards and evicted references lag their dispatched prompts.**
- #2243: `agents/war-refiner.md` Phase diff step ends "(absent ⇒ that arm skips)". The prompt says the note arm "reads an empty Set and matches nothing", and `noteArmSkipped` is gone (verified: card, `PHASE DIFF` prompt, `grep -c noteArmSkipped` = 0 at 35aa4144).
- The card's return-shape line glosses `preMerged` as "tasks already-integrated on the adopted branch, skipped" (verified: `agents/war-refiner.md` at 35aa4144). The proof is `task-integrated.sh`, which the card's provenance line already names (verified: same card and `skills/war/assets/task-integrated.sh` at 35aa4144).
- `refiner-recovery.md`'s header says every moved block "was byte-identical … at eviction time" (verified: header at 35aa4144). The MergeResult parenthetical gained a `gate_segment` clause the card never had; the disclosure fix 8e8a6323 was reverted by f78656e7 (verified: issue #2178 (2026-09-08)). The 617 B assert message in `workflow-template.recovery.test.mjs` repeats the claim (verified: at 35aa4144).
- `refiner-recovery.md` endstate-check step 2 lists `tip_sha`, output, then `exit_code:`, with no `cmd[i] exit: <n>` lines and no maximum rule. `cmd[i]` appears only in the engine (verified: at 35aa4144). The `endstate-check dispatch card twin` registry row misses the gap (verified: issue #2254 (2026-09-08)).
- #2176, #2255: `gate-audit-checklist.md`'s gate-log bullet names only a missing artifact (verified: at 35aa4144). `GATE_LOG_READ_RULE` also downgrades "a partial, unstamped or tip-mismatched log", and `GATE_LOG_UNTHREADED` renders `(gate_log_path unthreaded — no captured artifact)` (verified: `workflow-template.js` at 35aa4144). Its D8 bullet lacks the `intake_lint:` and `cmd_bytes_mismatch:` triggers and the `cmd[i]` rule that `agents/war-auditor.md` carries (verified: at 35aa4144). The section is pinned at 4580 B and by `GATE_AUDIT_CHECKLIST_SHA256`; a sanctioned edit re-pins both in one commit (verified: `auditor-evict` test and `workflow-template.test-harness.mjs` at 35aa4144).

**C. Engine comments and test titles (#2660).** About a dozen absorb-routed fixes never shipped (verified: issue #2660 (2026-11-08)). Live at 35aa4144: the `throughRound` comment's order claim about `chainRecordFix` (verified: comment above `chainDigest`); the `drainCauseOf` header's "both sit outside any local try" (verified: header); a sha written `#3f55b04` (verified: grep hit); `mergeSeat` copies seats only, no `drainCause` (verified: `const mergeSeat`); the default-deny census test title lags its assert (verified: `workflow-template.engine-1.test.mjs`); `fork-trials.md` says "This host has none" (verified: `skills/war-strategy/references/fork-trials.md`). The STATEMENT BOUNDARIES compound-command gap and the `CITE_ARGS` wrap come from the issue (verified: issue #2660 (2026-11-08)).

**D. GLOSSARY.md entries contradict their neighbors.** The glossary moved out of `CONTEXT.md` in #2636, so several issues cite a stale path (verified: `CONTEXT.md` is a 1517 B router at 35aa4144).
- **Carried queue**, **Phase-close coherence sweep** and **Re-entry** omit the approve-trail exception (verified: entries at 35aa4144). `terminal-pass-term` pins three old phrases (verified: issue #2247 (2026-09-08); test at 35aa4144).
- #2270: **Ask disposition** says Critical/Major findings "never carry a disposition"; **asks[] channel** names only full finding rows; **Seat-conflict ask** says the engine parks a blocking-pair question through `parkAsk` (verified: entries at 35aa4144).
- **Disposition** routes a "release-slot-adjacent" absorb to the sweep (verified: at 35aa4144). Under D20 only the `RELEASE_SLOT_FILES` basenames refuse by filename (verified: `disposition-eligibility.md` blockquote at 35aa4144).
- **Ace-Subset trailer** covers only resume idempotency (verified: at 35aa4144). The value is `<task>:<sorted findings file set>`, not the commit's footprint (verified: the two `const trailer =` builds at 35aa4144). Workers misread it in 8 phases; PIN-18 caught each (verified: issue #2347 (2026-09-29) comment of 2026-11-04).
- `glossary-cold.md` § Relaunch attempt restates the relaunch rules; only `run-manifest.md` is pinned (verified: at 35aa4144; issue #2120 (2026-09-07)).

**E. Other doctrine surfaces.**
- `skills/war-room/SKILL.md` says "single-star tokens"; `skills/war/SKILL.md` says "single-star tokens whose star is leading" (verified: at 35aa4144; issue #1759 (2026-08-26)).
- #2138: `skills/war/SKILL.md` § Checkpoint never names `corroborators` (verified: `grep -c` = 0 at 35aa4144).
- `design.md` §18 ends "README and other shared files route to the sweep instead of being refused", the rule D20 retired (verified: at 35aa4144; issue #2283 (2026-09-09)). §11 says "A task can't merge with an open Critical/Major" with no pre-ace probe carve-out, which `skills/war/SKILL.md` carries as PIN-3 (verified: at 35aa4144).
- `disposition-eligibility.md` opens "Three widenings"; the dispatched block carries (1)–(4) (verified: at 35aa4144). The README `## Status` / CHANGELOG twin-move duty is missing (verified: issue #2284 (2026-09-09)).
- `land-decision.mjs`'s header names only "provably unrun" and a finding-less `escalate` (verified: at 35aa4144). `gateHardOf` holds on `escalate` or a Critical/Major with a blank `suggested_fix`; a blocker with a fix goes to the late-fix pass (verified: `gateHardOf` at 35aa4144).
- **Seat-conflict posture.** The operator ruled that a no-fix seat conflict parks the ask and still holds the phase on purpose; a fixable Major takes a fix round first (verified: issue #2557 (2026-10-31), ruling on #1914). `seat.conflict` hits only `design.md`, ADR 0013 and `GLOSSARY.md`; none says the hold is deliberate (verified: `grep -rlni` at 35aa4144).

**F. ADRs.**
- **Living ADRs (#1850).** Ratified 2026-08-27: ADRs are living policy, git is the archive, history citations are sha-pinned (verified: issue #1850 (2026-08-27)). A 2026-09-06 ruling fixed the form as in-place edits plus a `## Decision log` (verified: plan D1/D2 at 35aa4144; ADR 0013's Decision log cites "the 2026-09-06 living-ADR ruling" at 35aa4144). Still, 31 ADRs carry dated `## Amendment|Addendum|Correction` H2s and 47 of 58 lack a Decision log (verified: `grep` census at 35aa4144). ADR 0025 still says "Append-only" (verified: at 35aa4144). D43 exempts ADR 0013 under "append-only law" (verified: `skill-doc-contracts.test.mjs` at 35aa4144). Amendment-token pins: 8 in `skill-doc-contracts.test.mjs`, 2 in `skills/war-machine/war-pipeline-structure.test.sh` (verified: grep at 35aa4144).
- **ADR 0013 Channel 2 (#2269).** The 2026-08-25 amendment still says Channel 2 "is deferred to #1664, not enacted" (verified: at 35aa4144); Task 11.2 enacted it (verified: issue #2269 (2026-09-08)).
- **ADR 0024 (#2664).** §(C) says `isHardGateEvidence` fires on `escalate` "**or** a Critical/Major finding" (verified: at 35aa4144). ADR 0058 never names ADR 0024 (verified: grep at 35aa4144).

**G. Vale (#1919).** Advisory cleanup of living `.md` files with the `hooks/vale-md` profile; counts drifted, so re-sweep first (verified: issue #1919 (2026-08-30); `vale` on PATH at 35aa4144).

**Budget headroom** (hard line minus `wc -c`; verified: `FILE_BUDGETS` and `wc -c` at 35aa4144): `agents/war-refiner.md` 23 B · `GLOSSARY.md` 455 B · `CLAUDE.md` 477 B · `agents/war-evidence-auditor.md` 1533 B · `agents/war-auditor.md` 1619 B · `skills/war/SKILL.md` 8817 B (advisory crossed by 399 B). The "3 B free" in #2557 is stale.

## 2. Pivotal constraints

1. **Land after the engine specs.** Each fix is written against the post-sibling tip, and each task re-reads its construct first (verified: issue #2660 (2026-11-08) "with each named construct re-read before editing").
2. **Both-surfaces rule.** A change to a standing card line that has a dispatched twin lands with that twin in the same commit (verified: `CLAUDE.md` § Execution architecture at 35aa4144).
3. **Byte-identical eviction.** An evicted block is a byte-identical move. A later sanctioned edit must disclose itself and re-pin its digest in the same commit. An eviction header must keep the `at eviction time` qualifier that `reference-link-integrity.test.mjs` checks (verified: `EVICTION_TIME_QUALIFIER` and the `QUALIFIED_HEADERS` list naming `refiner-recovery.md` at 35aa4144).
4. **Budgets bind.** `agents/war-refiner.md` has 23 B of hard headroom and `GLOSSARY.md` 455 B (verified: §1 budget line). Edits there are byte-neutral or cheaper. A raise needs ADR 0042's cited justification (verified: `CLAUDE.md` § Doctrine placement at 35aa4144).
5. **Hot/cold law.** New doctrine goes to a `references/` file behind a `when <trigger>, read references/<file>` pointer unless it is tier-1 (verified: `CLAUDE.md` § Doctrine placement at 35aa4144).
6. **Count words are claims.** Do not write a count word next to an enumeration that can grow (D24 rule 7; verified: issues #2136 (2026-09-07), #2284 (2026-09-09)).
7. **Living-ADR form decides ADR edits.** #1850's ruled form (in-place rewrite plus a Decision-log line) replaces the dated-amendment bullets #2269 and #2664 propose (verified: issue #1850 (2026-08-27); plan D1 at 35aa4144).
8. **Frozen literals.** No pass rewords a drift-guard-pinned literal, the ratified `docs/learnings/` pointer line in `CLAUDE.md`, an extraction heading, or the `skills/war-strategy/SKILL.md` §2 templates (verified: issue #1919 (2026-08-30) ground rules; `CLAUDE.md` memory section at 35aa4144).
9. **No new enum members.** `land-decision.mjs` changes here are header comment only. `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` stay as they are (verified: group `primaryFiles` "land-decision.mjs (header comment only)").

## 3. Resolved design tree

| ID | Decision | Resolution |
|----|----------|------------|
| D1 | Vehicle: run the 2026-09-06 plan, or a fresh plan from this spec? | A fresh plan from this spec, carrying the old plan's ruled D1–D3 (law, fold grammar) and D22 (Vale) by reference [assumed: it supersedes the old plan only for #1759, #1850, #1919 — if wrong: those tasks run twice, or other issues lose their vehicle]. |
| D2 | Meta-ADR form | New ADR, slug `living-adrs-git-is-the-archive`: bodies carry current law, rewritten in place; git is the archive; a retiring edit adds one dated `## Decision log` line whose `retired:` field names the retired text's sha; history citations read `docs/adr/<file> @ <sha>`; every ADR keeps a Decision log; retired literals are asserted absent on every policy home, ADRs included (verified: issue #1850 (2026-08-27); plan D1 at 35aa4144). [assumed: the number comes from `ls docs/adr/` at land time — if wrong: two ADRs share a number]. |
| D3 | One phase or two for #1850 | Two. Phase 1 lands the law. Phase 2 migrates the corpus in ONE task on ONE branch with every pin re-anchor, because a fold turns the amendment-token pins red before a separate re-anchor task could merge (verified: plan D2 at 35aa4144). |
| D4 | Migration before or after the drift fixes? | Before. Phase 2 folds; Phase 3's ADR edits (#2557 ADR 0013, #2664 ADR 0024) are then plain in-place edits under the new law [assumed: an early fold is safe because Phase 3 touches only two ADRs — if wrong: Phase 3 ADR edits conflict with a fold still in review]. |
| D5 | Decision log on all 58 ADRs or only on folded ones? | All. The 47 ADRs without one gain an empty-bodied `## Decision log` with one dated line "adopted under the living-ADR law" (verified: plan D1 "every ADR keeps a `## Decision log`" at 35aa4144). |
| D6 | #2269 form | No new supersession bullet. The Phase 2 fold rewrites ADR 0013's Channel-2 text to current law (enacted in Decision 4), with a Decision-log line citing the retired text's sha. |
| D7 | #2664 ADR 0024 form | Rewrite §(C) in place to match `gateHardOf`: HARD on an `escalate` verdict or a Critical/Major with a blank `suggested_fix`; a Critical/Major with a fix rides the late-fix pass (ADR 0058). Add a Decision-log line naming ADR 0058. This replaces the issue's "dated amendment bullet, leaving (C) as written" suggestion, per D2. |
| D8 | #2120 relaunch rule: guard all three surfaces, or de-mirror? | De-mirror. `run-manifest.md` § Relaunch is the one home. The `schemas.md` Relaunch bullet drops its restatement and keeps the pointer. The `glossary-cold.md` entry keeps the term's definition, drops the three rules and points to § Relaunch. A test asserts the rule phrases are present in `run-manifest.md` and absent from the other two [assumed: de-mirror over a three-way guard, since the glossary only needs the term — if wrong: a glossary reader loses the rule text inline]. |
| D9 | #2137 residual | Update the bracketed key list to `asks: [ { task, seat, sha, question, fork, corroborators?, citationPrefill? } ]`, matching the projection (verified: handoff `asks` projection at 35aa4144). |
| D10 | #2139 wording | A NEW raiser merges onto `corroborators`. A re-raise by the survivor's own raiser, or one equal to an existing entry, is logged only. Nothing is dropped silently. |
| D11 | #2175 | Delete the A4 hedge. Cite the card as "`agents/war-refiner.md` step 10 (Backgrounded gate)". |
| D12 | #2226 citation row | State the keys `{ row, threadedRow, cited, rationale }` (`row` = matched threaded row, `cited` = seat text), the floor by name (`CITATION_MIN_LENGTH`), the exact-then-unique rule, and that `citationStamp` reaches sweep-polish and terminal commits [assumed: name the constant, not `24` — if wrong: a reader opens the engine for the number]. |
| D13 | #2206 gloss | The card return-shape line and the `schemas.md` provision line gloss `preMerged` as "proved integrated by `task-integrated.sh`, skipped" [assumed: no dispatched twin, since the phrase hits only an engine comment at 35aa4144 — if wrong: the prompt twin changes in the same commit]. |
| D14 | #2243 wording | Card step 3 matches the prompt: "(absent ⇒ that arm reads an empty Set and matches nothing)". Add a paired pin beside the file-followups paired pins. D13 plus D14 must fit 23 B [assumed: a byte-neutral trim exists on those lines — if wrong: an ADR 0042 cited raise]. |
| D15 | #2178 header | Name the one exception in the header: the MergeResult parenthetical gained the `gate_segment` clause after eviction. Keep the `at eviction time` qualifier. Reword the 617 B assert message the same way. |
| D16 | #2254 step 2 | Add the per-command `cmd[i] exit: <n>` lines and the maximum rule to step 2, marked as a post-eviction edit like D15. Add `cmd[i]` and `maximum` anchors to the `endstate-check dispatch card twin` registry row. |
| D17 | #2176/#2255 checklist | Extend the gate-log bullet with the partial, unstamped and tip-mismatched arms and the current `GATE_LOG_UNTHREADED` text. Extend the D8 bullet with the `intake_lint:` and `cmd_bytes_mismatch:` record-only triggers and the per-command reading rule. Re-pin `GATE_AUDIT_CHECKLIST_SHA256` and the 4580 B size in the same commit, with the rationale in the commit body. |
| D18 | #2557 placement | Posture text: "a seat conflict with no fix parks its ask and still holds the phase on purpose; a fixable blocker takes a fix round first". Homes: ADR 0013 Decision 4, `design.md`, GLOSSARY **Seat-conflict ask**, `skills/war/SKILL.md` Ask ruling gate (one clause), `README.md`, `CLAUDE.md` Known traps, both auditor cards plus their dispatched twin. Pinned on GLOSSARY and ADR 0013. `auditor-teach.md` is left out: it holds verbatim evictions only (verified: its header at 35aa4144) [assumed: the SKILL.md clause is tier-1, so inline — if wrong: it moves to a references file behind a pointer]. |
| D19 | #2347 | Add one sentence and one _Avoid_ item to **Ace-Subset trailer**: the value is the findings' file set, a resume key, never the commit's footprint; never derive scope from it. Add a structural test in `workflow-template.engine-1.test.mjs` that no engine path parses the `Ace-Subset` trailer into a file set. The trailer-vs-diff lint stays withdrawn (verified: issue #2347 (2026-09-29) body). |
| D20 | #2660 `mergeSeat` | A behavior gap: copy the dropped copy's `drainCause` onto a survivor that has none, as `demote()` does, with a fixture [assumed: the sibling engine-findings spec does not already fix this — if wrong: drop this row at conversion]. |
| D21 | #2664 paraphrase sweep | At conversion, grep the tip for always-hold paraphrases and give each hit to the task that owns the file. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction. |
| D22 | #1919 scope | Last content phase, re-measured at its base; one task per file family, at most eight files, file-disjoint; freeze list first, full gate per task; record surfaces out of scope (verified: issue #1919 (2026-08-30); plan D22 at 35aa4144) [assumed: it lands after every 2026-11-08 sibling spec — if wrong: later specs conflict with the cleaned files]. |
| D23 | New glossary terms and GLOSSARY.md headroom | The §6 terms go in `glossary-cold.md` behind one pointer row. If Phase 3's edits overrun the hard line the model-routing spec leaves, evict the coldest whole entry byte-identically to `glossary-cold.md` [assumed: eviction over a budget raise — if wrong: an ADR 0042 cited raise instead]. |
| D24 | Release | Own trailing phase over the four version slots. Resolve the next free patch from the slots at land time (verified: `CLAUDE.md` § Releasing at 35aa4144). |

## 4. Mechanics

Five candidate phases. Same file means same task. `skills/war/assets/workflow-template.js` has one owner per phase (Phase 3, Task 3.2 only). Every grep step in this section is a floor, not a ceiling.

### Phase 1 — Living-ADR law (#1850, part 1)

**Task 1.1 — the meta-ADR and its terms.** Files: §5. `requiresTest: true`.
- Write the ADR per D2. Its Decision names the three citation forms (live path, `@ <sha>` history pin, and Decision-log `retired:` sha) and the uniform OLD-absent rule. Its Consequences names Phase 2 as the migration.
- Add **Living ADR**, **Decision log** and **Sha-pinned citation** to `glossary-cold.md`, and one GLOSSARY.md pointer row: `when you edit or cite an ADR, read skills/war/references/glossary-cold.md` (D23).
- Add a test row that binds the three term names to the ADR's `## Decision` section by extraction, with the ADR path resolved by slug glob. A non-vacuity floor asserts that the extracted section is non-empty.

### Phase 2 — Living-ADR migration (#1850 part 2, #2269)

**Task 2.1 — fold every dated section, one task, one branch.** Files: every `docs/adr/0*.md` (31 with dated H2s, plus the 47 that gain a Decision log; verified: §1 F census), `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war-machine/war-pipeline-structure.test.sh`, and `skills/war-strategy/war-strategy-structure.test.sh` if it reads a folded token. `requiresTest: true`.
- Fold each `## Amendment (…)`, `## Addendum (…)` and `## Correction (…)` H2, each `*Cross-reference (YYYY-MM-DD)*` line, each append-only supersession bullet and each Status currency clause into the body as current law. Use the plan's D3 fold grammar (verified: plan D3 at 35aa4144). Each fold adds one dated Decision-log line whose `retired:` field names the folded text's sha.
- ADR 0013: the Channel-2 deferral becomes current law (enacted in Decision 4), which closes #2269 (D6). The trailing `## Amendment (2026-11-05)` H2 after the Decision log folds the same way.
- ADR 0025: replace "Append-only, per this repo's ADR correction-note shape" with the living-ADR rule.
- Add a `## Decision log` to every ADR without one (D5).
- Re-anchor every test that extracts by an amendment token to the new date-free H3 tokens. Remove the D43 ADR exemption, so D43 asserts the retired literals absent in ADR 0013 too (uniform OLD-absent). Floor: `grep -nE 'Amendment \(|Addendum \(|Correction \(|append-only' skills/war/assets/*.test.mjs skills/*/*.test.sh skills/*/assets/*.test.sh`, and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- Add a guard row: no `docs/adr/0*.md` carries a dated `## (Amendment|Addendum|Correction)` H2, and every ADR carries `## Decision log`.
- The branch may carry several commits. The serial merge is the atomic unit, and its tip must be green.

### Phase 3 — Doc truth (all drift issues)

Four tasks in wave 1, file-disjoint. Task 3.5 runs in wave 2 with `deps: [3.1, 3.3, 3.4]`, because its pins read facts those tasks write (authoring rule 7).

**Task 3.1 — `schemas.md`.** Files: `skills/war/references/schemas.md`. `requiresTest: false` (prose only; pins are added by Task 3.5). Issues: #2136, #2137, #2139, #2175, #2206 (provision line straggler), #2226, #2231, #2242, #2248, #2120 (bullet half), #2660 (citation item).
- Apply D9–D13 and D8's bullet half.
- Drop the count words in the adjudications paragraph and the args contract. Name the members. Floor: `grep -niE '\b(two|three|four|five)\b (producers|seats|widenings|homes|sites)' skills/war/references/schemas.md`, and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- Rewrite both "produced once … absent until then" clauses in the present tense. Floor: `grep -n 'until then\|produced once\|not yet produced' skills/war/references/schemas.md`, and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- Add the approve-trail exception to the `finalPhase` and `carriedPhaseClose` rows. Floor: `grep -n 'non-final phase\|carriedPhaseClose' skills/war/references/schemas.md`, and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.

**Task 3.2 — engine comments, cards and evicted references (the one engine owner).** Files: §5. `requiresTest: true`. Issues: #2176, #2178, #2206 (card), #2243, #2254, #2255, #2347 (structural test), #2557 (cards and prompt twin), #2660 (engine, test and harness items), #2136 (the `citationOf` comment straggler).
- Apply D13–D17, D19's test, D20, and D18's card half.
- The #2660 engine, test and harness items in §1 C, plus the `citationOf` "three producers" comment. Re-read each at the task base; the engine-comment-tidy sibling may have fixed it. Record already-fixed items in the commit body.
- D18 card half: one sentence in `agents/war-auditor.md` and in `agents/war-evidence-auditor.md`, plus the same sentence in the dispatched auditor prompt, all in one commit. Add a both-surfaces registry row.
- Re-pin `GATE_AUDIT_CHECKLIST_SHA256` and the checklist byte count. State in the commit body why the evicted block changed.
- Check budgets after editing: `node --test skills/war/assets/prompt-surface-budgets.test.mjs` prints the `agents/war-refiner.md` row under its hard line.

**Task 3.3 — `design.md`, ADR 0013, ADR 0024, the land-decision header, disposition eligibility.** Files: §5. `requiresTest: false`. Issues: #2283, #2664, #2284, #2557 (ADR 0013 and design.md), #2660 (design §18 and the eligibility twin-move items).
- `design.md` §18: replace the closing sentence with the D20 rule (only `plugin.json`/`marketplace.json` refuse by filename; README/CHANGELOG absorbs ride the per-task ace). §11: add the pre-ace probe carve-out in `skills/war/SKILL.md`'s wording. Add the seat-conflict posture.
- ADR 0013 Decision 4: add the posture in place and a Decision-log line. ADR 0024 §(C): D7.
- `land-decision.mjs` header: state the `gateHardOf` rule (an `escalate` verdict or a fix-less Critical/Major holds; a blocker with a fix goes to the late-fix pass).
- `disposition-eligibility.md`: an opener with no count word that points to the auditor card for widening (4); the README `## Status` / CHANGELOG twin-move rule in the release-slot blockquote, which is not an eviction (verified: the file header at 35aa4144).
- Paraphrase sweep (D21): `grep -rniE "can.t merge|never merge|always hold|no approval" skills agents docs/adr README.md CLAUDE.md GLOSSARY.md --include='*.md'`, and handle every match in this task's files. Report the rest to the conversion step. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.

**Task 3.4 — Lead-facing and root surfaces.** Files: §5. `requiresTest: false`. Issues: #1759, #2138, #2557 (SKILL, README, CLAUDE.md), #2660 (fork-trials item).
- `skills/war-room/SKILL.md`: copy the leading-star qualifier from `skills/war/SKILL.md`.
- `skills/war/SKILL.md`: add "+ `corroborators` (when non-empty)" to the Ask ruling gate row list and to the phase-report `asks parked` list. Add the D18 posture clause to the Ask ruling gate bullet.
- `fork-trials.md`: make the per-command cap paragraph host-neutral ("on a host without `timeout`, …").
- `README.md` and `CLAUDE.md`: one posture sentence each. `CLAUDE.md` is a risky path: the brief names the edit, it fits the 477 B headroom, and the ratified pointer line stays as it is.

**Task 3.5 — glossary and the doc-truth pins (wave 2).** Files: §5. `deps: [3.1, 3.3, 3.4]`. `requiresTest: true`. Issues: #2247, #2270, #2287, #2347 (entry), #2120 (glossary half and guard), #2557 (glossary and pin), #2283 (pin), #2138 (pin).
- **Carried queue**, **Phase-close coherence sweep**, **Re-entry**: add the approve-trail exception (`sweepApproved`), and update the `terminal-pass-term` `assert.match` rows in the same commit. **Sweep-raised finding** stays as it is (verified: issue #2247 (2026-09-08)).
- **Ask disposition** and **asks[] channel**: name the engine-made seat-conflict ask as a second producer whose source findings are blocking.
- **Disposition**: delete `/release-slot-adjacent`. Floor: `grep -n 'release-slot-adjacent' GLOSSARY.md skills/war/references/glossary-cold.md`, and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **Ace-Subset trailer**: D19 sentence and _Avoid_ item.
- **Seat-conflict ask**: the D18 posture.
- `glossary-cold.md` § Relaunch attempt: D8.
- Pins (new rows): the D8 de-mirror (rule phrases present in `run-manifest.md` § Relaunch, absent from the `schemas.md` bullet and `glossary-cold.md`); `design.md` §18 OLD sentence absent; `skills/war/SKILL.md` lists `corroborators` in both Checkpoint lists; the posture sentence present in GLOSSARY and ADR 0013; the stale `schemas.md` literals from Task 3.1 absent. Each row has a non-vacuity floor (its extraction must be non-empty).
- Fit the GLOSSARY.md hard line (D23).

### Phase 4 — Vale prose pass (#1919)

Tasks are fixed at conversion from a fresh Vale census at the phase base. Families: root docs (`README.md`, `CLAUDE.md`, `CONTEXT.md`); `agents/*.md`; `skills/war/SKILL.md`; `skills/war/references/*.md` in groups of at most eight; the other skills' `SKILL.md` files; the other skills' `references/*.md`. Each task:
- builds its freeze list first. Floor: for each file in the task, extract every literal that `skills/**/*.test.mjs` and `**/*.test.sh` pin from it, and leave those bytes as they are. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- treats findings as prompts, not orders. Mostly it splits sentences over 25 words and expands Latin abbreviations.
- only shrinks a budgeted surface, and never rewords a frozen literal (§2 item 8).
- runs the full gate.

`requiresTest: false` for every Phase 4 task.

### Phase 5 — Release

**Task 5.1 — version bump.** Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status` line), `CHANGELOG.md`. `requiresTest: false`. The next free patch is resolved from the four slots at land time (D24).

## 5. Surface changes

| Phase | Task | Files |
|-------|------|-------|
| 1 | 1.1 | `docs/adr/<NNNN>-living-adrs-git-is-the-archive.md` (new), `skills/war/references/glossary-cold.md`, `GLOSSARY.md`, `skills/war/assets/skill-doc-contracts.test.mjs` |
| 2 | 2.1 | `docs/adr/0*.md` (all), `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war-machine/war-pipeline-structure.test.sh`, `skills/war-strategy/war-strategy-structure.test.sh` (if it pins a folded token) |
| 3 | 3.1 | `skills/war/references/schemas.md` |
| 3 | 3.2 | `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `agents/war-auditor.md`, `agents/war-evidence-auditor.md`, `skills/war/references/refiner-recovery.md`, `skills/war/references/gate-audit-checklist.md`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.recovery.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs` |
| 3 | 3.3 | `skills/war/references/design.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`, `docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md`, `skills/war/assets/land-decision.mjs`, `skills/war/references/disposition-eligibility.md` |
| 3 | 3.4 | `skills/war/SKILL.md`, `skills/war-room/SKILL.md`, `skills/war-strategy/references/fork-trials.md`, `README.md`, `CLAUDE.md` |
| 3 | 3.5 | `GLOSSARY.md`, `skills/war/references/glossary-cold.md`, `skills/war/assets/skill-doc-contracts.test.mjs` |
| 4 | 4.x | living `.md` surfaces per the Phase 4 census (record surfaces excluded) |
| 5 | 5.1 | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md` |

`skills/war/references/run-manifest.md` is read, not edited. It stays the one home of the relaunch rules (D8).

**Contention with sibling specs** (verified: group `contentionNotes`):

| File | This spec | Sibling spec that also edits it | Lands first |
|------|-----------|-------------------------------|-------------|
| `skills/war/references/schemas.md` | P3 T3.1 | engine-recovery-relaunch-and-land, engine-findings-ace-and-late-fix | siblings |
| `skills/war/references/refiner-recovery.md` | P3 T3.2 | engine-recovery-relaunch-and-land | sibling |
| `agents/war-refiner.md` | P3 T3.2 | engine-recovery-relaunch-and-land, engine-findings-ace-and-late-fix | siblings |
| `skills/war/assets/workflow-template.js` (comments, the `mergeSeat` fix, one prompt sentence) | P3 T3.2 | engine-comment-and-duplication-tidy and the other engine specs | siblings |
| `GLOSSARY.md` | P1 T1.1, P3 T3.5 | model-routing-and-prompt-byte-budgets (#2273 headroom) | sibling; new bytes fit the hard line it leaves |
| `skills/war/assets/skill-doc-contracts.test.mjs` | P1, P2, P3 T3.5 | shell-floors-tests-and-lint | this spec |
| Vale-pass surfaces (Phase 4) | P4 | every sibling that edits a living `.md` | siblings [assumed: see D22] |

## 6. New domain terms (GLOSSARY.md)

All three go in `skills/war/references/glossary-cold.md` behind one GLOSSARY.md pointer row (D23).

- **Living ADR** — an ADR whose body states current law and is rewritten in place when the law changes. Git holds the history. _Avoid_: dated amendment H2s; "append-only".
- **Decision log** — the `## Decision log` H2 at the foot of every ADR. It holds one dated line per change, and a retiring line names the retired text's commit sha. _Avoid_: putting rationale only in the log.
- **Sha-pinned citation** — a citation of past ADR text in the form `docs/adr/<file> @ <sha>`. _Avoid_: citing an amendment heading that a fold has removed.

## 7. Recommended ADRs

- **New:** `living-adrs-git-is-the-archive` at the next free number (D2). It is Phase 1's main deliverable.
- **Edited in place under that law:** ADR 0013 (Phase 2 fold, then the Phase 3 posture), ADR 0024 (§(C), D7), ADR 0025 (append-only line), and every ADR that gains a Decision log (D5).
- No other new ADR. The seat-conflict posture refines ADR 0013 Decision 4 and does not need its own ADR [assumed: the posture is a clarification, not a new decision — if wrong: a small ADR citing #2557 is needed].

## 8. Open risks / implementation notes

- **Refiner card headroom is 23 B.** D13 and D14 together may need a trim on the same lines. If no trim fits, the task needs an ADR 0042 cited raise, and the commit body must carry the `Budget-Raise:` trailer (verified: `FILE_BUDGETS` raise comments for `agents/war-refiner.md` at 35aa4144).
- **GLOSSARY.md headroom depends on the model-routing sibling.** If that spec leaves less than Phase 1 and Phase 3 need, evict per D23 inside Task 3.5.
- **The Phase 2 fold is large** (58 ADRs plus their extracting tests, one branch, green tip). A fold restates current law; a fold that changes a decision is a defect.
- **`skills/war/SKILL.md` advisory line is already crossed** by 399 B. Task 3.4 adds about 150 B. Phase 4's Vale pass on that file should shrink it. Do not raise the line.
- **#2137 may close as already done** in substance (the prose WIDENED SHAPE sentence). D9's key-list edit is the only remaining part.
- **Vale is advisory.** No gate check counts Vale findings. Phase 4's Done-when is a green repo gate plus a recorded before/after count per task, not a target number [assumed: a recorded count is enough evidence for an advisory pass — if wrong: the operator wants a numeric floor per file family].

## 9. Non-goals / deferred

- The 2026-09-06 plan's tasks for issues outside this group (for example #1848, #1880, #2089, #2091) are not run by this spec (D1).
- `auditor-teach.md` does not get the #2557 posture (D18). It holds verbatim evictions only.
- #2347's trailer-vs-diff lint stays withdrawn, as its body says.
- No behavior change except D20, and no enum change in `land-decision.mjs` or its inline mirror.
- From #2660, the CONTEXT.md Disposition item is already fixed, since the entry moved to GLOSSARY.md. The GLOSSARY.md copy is #2287's live row in Task 3.5 (verified: `grep release-slot-adjacent CONTEXT.md` empty, GLOSSARY.md hit at 35aa4144).
- From #2284, member row 2 (the engine comment's "carries the same rules") is already fixed (verified: the `carries widenings (1)-(3)` comment in `workflow-template.js` at 35aa4144).
- From #2247, the ADR 0012 cross-reference item is already fixed (verified: issue #2247 (2026-09-08) sub-item "FIXED").

No group issue is declined.

## 10. Validation criteria

| # | Criterion |
|---|-----------|
| V1 | WHEN Phase 1 lands THE `docs/adr/` dir SHALL carry exactly one living-ADR meta-ADR · check: `ls docs/adr/*-living-adrs-git-is-the-archive.md \| wc -l` prints `1` |
| V2 | WHEN Phase 2 lands THE ADR corpus SHALL carry no dated amendment H2 · check: `grep -lE '^## (Amendment\|Addendum\|Correction) ' docs/adr/0*.md \| wc -l` prints `0` |
| V3 | WHEN Phase 2 lands EVERY ADR SHALL carry a Decision log · check: `grep -L '^## Decision log' docs/adr/0*.md \| wc -l` prints `0` |
| V4 | WHEN Phase 2 lands THE ADR 0013 body SHALL not call Channel 2 deferred · check: `grep -c 'deferred to #1664, not enacted' docs/adr/0013-commanders-intent-and-disposition-routing.md` prints `0` |
| V5 | WHEN Phase 2 lands ADR 0025 SHALL not state the append-only rule · check: `grep -c 'Append-only, per this repo' docs/adr/0025-drift-guard-discipline.md` prints `0` |
| V6 | WHEN Task 3.1 lands THE `schemas.md` file SHALL carry no stale producer count, label or tense · check: `grep -cE 'Three producers\|ace:<task>:a<n>\|absent until then\|A4 latitude' skills/war/references/schemas.md` prints `0` |
| V7 | WHEN Task 3.1 lands THE `citation?` row SHALL name the `cited` key · check: `grep -c 'threadedRow, cited, rationale' skills/war/references/schemas.md` prints a number `>= 1` |
| V8 | WHEN Task 3.1 lands THE handoff `asks` key list SHALL list `corroborators?` · check: `grep -c 'question, fork, corroborators?' skills/war/references/schemas.md` prints a number `>= 1` |
| V9 | WHEN Task 3.1 lands THE `finalPhase` and `carriedPhaseClose` rows SHALL name the approve trail · check: `grep -c 'approve trail' skills/war/references/schemas.md` prints a number `>= 2` |
| V10 | WHEN Task 3.2 lands THE refiner card SHALL not say the note arm skips · check: `grep -c 'that arm skips' agents/war-refiner.md` prints `0` |
| V11 | WHEN Task 3.2 lands THE refiner card SHALL stay under its hard budget · check: `node --test skills/war/assets/prompt-surface-budgets.test.mjs` exits 0 and prints `budget: agents/war-refiner.md` |
| V12 | WHEN Task 3.2 lands THE endstate-check step 2 SHALL name the per-command lines · check: `grep -c 'cmd\[i\] exit' skills/war/references/refiner-recovery.md` prints a number `>= 1` |
| V13 | WHEN Task 3.2 lands THE checklist SHALL name the new downgrade and unverified triggers · check: `grep -cE 'tip-mismatched\|intake_lint\|cmd_bytes_mismatch' skills/war/references/gate-audit-checklist.md` prints a number `>= 3` |
| V14 | WHEN Task 3.2 lands THE engine SHALL carry no issue-style sha reference · check: `grep -c '#3f55b04' skills/war/assets/workflow-template.js` prints `0` |
| V15 | WHEN Task 3.2 lands THE `mergeSeat` survivor SHALL keep a dropped copy's `drainCause` · check: `node --test skills/war/assets/workflow-template.engine-1.test.mjs` exits 0 and its output names the new `mergeSeat drainCause` test with `ok` |
| V16 | WHEN Task 3.3 lands THE `design.md` §18 SHALL not route README to the sweep · check: `grep -c 'route to the sweep instead of being refused' skills/war/references/design.md` prints `0` |
| V17 | WHEN Task 3.3 lands THE eligibility reference SHALL carry no count word for widenings · check: `grep -c 'Three widenings' skills/war/references/disposition-eligibility.md` prints `0` |
| V18 | WHEN Task 3.3 lands THE land-decision header SHALL name the fix-less blocker rule · check: `head -20 skills/war/assets/land-decision.mjs \| grep -c 'suggested_fix'` prints a number `>= 1` |
| V19 | WHEN Task 3.3 lands ADR 0024 SHALL cite ADR 0058 · check: `grep -c '0058' docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md` prints a number `>= 1` |
| V20 | WHEN Task 3.4 lands THE war-room card SHALL carry the leading-star qualifier · check: `grep -c 'single-star tokens whose star is leading' skills/war-room/SKILL.md` prints `1` |
| V21 | WHEN Task 3.4 lands THE `/war` Checkpoint SHALL list `corroborators` · check: `grep -c 'corroborators' skills/war/SKILL.md` prints a number `>= 2` |
| V22 | WHEN Task 3.4 lands THE fork-trials reference SHALL be host-neutral · check: `grep -c 'This host has none' skills/war-strategy/references/fork-trials.md` prints `0` |
| V23 | WHEN Task 3.5 lands THE GLOSSARY Disposition entry SHALL not route release-slot-adjacent absorbs to the sweep · check: `grep -c 'release-slot-adjacent' GLOSSARY.md` prints `0` |
| V24 | WHEN Task 3.5 lands THE three sweep entries SHALL name the approve trail · check: `grep -c 'approve trail' GLOSSARY.md` prints a number `>= 3` |
| V25 | WHEN Task 3.5 lands THE relaunch rules SHALL live only in `run-manifest.md` · check: `grep -c 'sums dispatch counts' skills/war/references/schemas.md skills/war/references/glossary-cold.md` prints `schemas.md:0` and `glossary-cold.md:0` |
| V26 | WHEN Phase 3 lands THE seat-conflict posture SHALL be stated on every governing surface · check: `grep -li 'holds the phase on purpose' README.md CLAUDE.md GLOSSARY.md skills/war/SKILL.md skills/war/references/design.md agents/war-auditor.md agents/war-evidence-auditor.md docs/adr/0013-commanders-intent-and-disposition-routing.md \| wc -l` prints `8` |
| V27 | WHEN any phase lands THE repository gate SHALL pass · check: `node skills/war/assets/repo-gate.mjs` exits 0 and prints `== gate complete:` with `0 failed` |
| V28 | WHEN any phase lands THE redaction lint SHALL pass · check: `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0 and prints `lint: clean` |
| V29 | WHEN Phase 5 lands THE four version slots SHALL agree · check: `node --test skills/war/assets/version-slots.test.mjs` exits 0 and prints `ℹ fail 0` |
