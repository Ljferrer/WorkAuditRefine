# Gate-audit D7 evidence coherence and phase-close sweep finding routing

Issues: #1377, #1372, #1343

## 1. Context — the gap / problem

All claims below re-verified against the live tree at base `6fff2ee` (2026-08-06) unless noted.

**Phase-close sweep drops its own re-audit findings.** In `skills/war/assets/workflow-template.js`, the phase-close coherence sweep's full-panel re-audit (`auditRound(polishTask, …)`) pushes its seat findings only into `auditLog` (verdict `approve` / `polish-rejected`); on the merged arm only the pre-existing `phaseCloseQueue` is recorded as aced, and on the skipped/discarded/held arms the demotion ladder is applied only to that queue. Findings the re-audit raises against the polish commit itself never pass through `dispositionOf` / `demote` / `minorsFiled`, and because Minor/absorb never blocks unanimous approval, they land unfixed and unfiled — the recorded instance dropped two Minor/absorb findings (verified: issue #1377 (2026-08-06); confirmed live: the `sweepApproved`/`polish-rejected` region routes `pSeats` findings only into `auditLog`). The sweep is the phase's terminal fix mechanism, so an absorb finding raised there has no later round to drain it (verified: issue #1377 (2026-08-06)).

**Contradictory seat-prompt clause on the only live HARD path.** The per-task gate-audit prompt's `mappedTestsLine` (round-3 enumeration-conditional: absence is HARD only where the captured log ENUMERATES per-file test paths) coexists, three lines apart in the same `agent()` prompt, with the unchanged older conjunctive clause "record a HARD gate-evidence finding ONLY when the mapped test is genuinely absent AT THE CONFIRMED INTEGRATION TIP and the captured artifact confirms it did not run" — a present-but-unrun `.test.sh` satisfies the new rule but fails the old clause, giving the seat contradictory instruction exactly where HARD can still fire; direction is fail-open (under-trigger), making End state 7's mechanical trigger effectively unreachable (verified: issue #1372 (2026-08-06); issue #1343 finding 2 (2026-08-06); confirmed live: both clauses present in the per-task gate-audit `agent()` prompt in `skills/war/assets/workflow-template.js`).

**resolveGate early-abort log truncation can mint a false HARD.** `resolveGate` in `skills/war/assets/war-config.mjs` composes the bash gate half as a discovery for-loop with `bash "$f" || exit 1`, so the first red suite aborts the whole loop; on a baseline-proceed merge every alphabetically-later `.test.sh` never prints its `== gate(bash): <path> ==` header. The captured log then enumerates paths (the earlier headers) yet is incomplete, satisfying the enumeration-conditional's premise, so a later mapped bash path reads absent ⇒ HARD land-hold caused by the abort, not by an unrun test. `debtLine` defuses only a gate-output FAILURE matching classified baseline debt, not an ABSENCE caused by the abort (verified: issue #1372 (2026-08-06); issue #1343 finding 3 (2026-08-06); confirmed live: the `|| exit 1` loop in `resolveGate` and the `debtLine` wording).

**setup.md's --afk sanity-floor backstop claim is stale.** The § `--afk` sanity floor block in `skills/war/references/setup.md` still asserts the residual (an over-wide but file-matching pattern admitting a test the gate ignores) is "caught downstream" by the `execution-evidence` HARD pass — but that residual is by construction a non-`.test.sh` path, which after the narrowing falls on the non-enumerating node half where the zero-hit grep is SOFT cannot-confirm; the named downstream catch does not fire for the exact case the sentence backstops. The file's own header asserts the evicted blocks are byte-identical to their pre-eviction `skills/war/SKILL.md` text, so an in-place correction must also amend that caveat (verified: issue #1343 finding 1 (2026-08-06); confirmed live: the sentence at the § `--afk` sanity floor block and the byte-identical header claim).

**The reporter-format premise test has diagnostic and hardening gaps.** The 'reporter-format premise (D7, round-3)' test in `skills/war/assets/workflow-template.test.mjs` asserts `run.status === 0` with a custom message but never inspects `run.error` — a spawn failure (ENOENT/EAGAIN) reads as "the premise changed"; its `spawnSync` passes no `timeout`; and the custom message suppresses node:assert's generated actual/expected delta, so a non-zero child exit reports prose only (verified: issue #1343 findings 4 and 6 (2026-08-06); confirmed live: the test body carries no `run.error` assert and no `timeout` option).

**The sole HARD-trigger premise — the bash banner — is unpinned.** After the narrowing, the HARD arm fires only against an enumerating log, and this repo's only enumerating producer is `resolveGate`'s `printf '\n== gate(bash): %s ==\n' "$f"` banner. The producer-side test 'resolveGate: includes printf banner for each suite' in `skills/war/assets/war-config.test.mjs` asserts only the substrings `printf` and `gate(bash)` — dropping the `%s`/`"$f"` path interpolation would keep it green while silently emptying the HARD arm — and nothing couples the seat-facing literal `` `== gate(bash): <path> ==` `` (dispatched prompts + `agents/war-auditor.md`) to what `resolveGate` actually emits (verified: issue #1343 finding 5 (2026-08-06); confirmed live: the banner test's two substring asserts and the absence of a producer↔prompt coupling assert).

Companion lessons already recorded: `docs/learnings/phase-close-polish-tasks-own-absorb-findings-have-no-further-round-to-land.md`, `docs/learnings/hard-trigger-narrowing-leaves-contradictory-clause-and-early-abort-truncation-residual.md` (verified: present in the live tree, 2026-08-06).

## 2. Pivotal constraints

- **Split prompt surfaces change together.** Standing instructions live in `agents/war-auditor.md`; dispatched prompts are string-built in `skills/war/assets/workflow-template.js` — any seat-behavior change must land on both in the same commit, drift-guarded by the D3 both-surfaces directive registry in `skills/war/assets/workflow-template.test.mjs` (its 'mechanical mapped-tests grep' row already anchors the enumeration-conditional on both surfaces).
- **The demotion ladder's promise is total.** `demote` log()s every demotion and ADR 0013's contract is "never drop silently" — the fix for #1377 must route sweep-raised findings through the existing `dispositionOf`/`demote` constructs, not invent a parallel channel.
- **Fail-open direction discipline.** None of these fixes may create a new hold path: the contradiction fix and the truncation clause both move evidence interpretation toward SOFT-unless-proven; the sweep-routing fix files findings, it never blocks a land.
- **`resolveGate` semantics are frozen here.** The `|| exit 1` fail-fast composition is documented deliberate ("any non-zero exit aborts immediately") and `resolveGate` is mirrored inline in `workflow-template.js` with a D2 mirror-registry row plus idempotence tests keyed to its exact output — this spec changes no `resolveGate` output byte [assumed: fixing the false-HARD on the evidence-interpretation side, per the issue's own suggested fix, rather than making the loop continue-on-red — if wrong: the gate's fail-fast contract and the mirror/idempotence guard set must be redesigned, a much larger change].
- **Registry growth discipline.** The D3 registry grows by row/anchor with an exact floor count ("floor equals the true row count, no slack"); the #931 template-literal census requires any new template literal in `workflow-template.js` to be `pt`-tagged or registered.
- **ADR 0042 eviction semantics.** `skills/war/references/setup.md` is a byte-identical eviction target; editing a moved block in place requires amending the file-header caveat in the same commit.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Where do sweep-raised findings go at sweep close? | Route every Minor/Nit finding the re-audit panel returns (stamped `task: polishTask.id`) through the existing disposition routing at both terminal arms: `follow-up` → `minorsFiled`, `note` → `notes`, `absorb` → `demote(f, 'follow-up', …)` with a reason naming the sweep as the terminal round. Never ace-eligible, never `phaseCloseQueue` (there is no later sweep). |
| D2 | Does the discarded/rejected arm route them too? | Yes [assumed: symmetry with the task-level non-approve demotion arm ("task never reached the approve branch") — if wrong: sweep-raised findings on a discarded sweep keep dropping, the same #1377 defect one arm over]. Demotion reason records that the polish branch never merged. |
| D3 | Fix the clause contradiction by deletion or rescope? | Rescope: the older conjunctive clause is narrowed to the case it was written for — a MISSING mapped test (green-by-deletion) — with an explicit deferral: "the present-but-unrun path is governed by the MAPPED TESTS block above". `mappedTestsLine` stays the sole owner of the present-but-unrun HARD path. |
| D4 | Truncation false-HARD | Add one truncation clause to `mappedTestsLine`, `authMappedLine`, and the `agents/war-auditor.md` D7 checklist bullet: a captured log whose bash half ABORTED (the discovery loop exits on the first red suite — a red header with no later headers after it) is truncated; a mapped path after the abort point is SOFT cannot-confirm, never HARD. |
| D5 | Guard vehicle for D4 | Extend the anchors of the existing D3 registry row 'mechanical mapped-tests grep' (covers `agents/war-auditor.md` + the per-task prompt) with the truncation-clause regex; extend the existing `authMappedLine` twin test for the integrated-tip seat; add a truncated-log statement to the per-task D7 threading test. No new registry row, so the exact floor count is untouched. |
| D6 | Banner coupling | Producer side: strengthen the banner test in `skills/war/assets/war-config.test.mjs` to assert `== gate(bash): ` plus the `%s` interpolation. Consumer side: in the D7 threading test in `skills/war/assets/workflow-template.test.mjs` (which already imports `resolveGate`), assert the live `resolveGate` output carries `== gate(bash): ` and `%s`, and that the seat prompt and `agents/war-auditor.md` carry the matching `== gate(bash): ` literal. |
| D7 | Premise-test hardening | Add `timeout: 60_000` to the `spawnSync` options; assert `!run.error` (naming a spawn failure, not a premise change) before the status assert; interpolate `run.status` plus a stderr tail into the status assert's message (the custom-message-suppresses-diff lesson). |
| D8 | setup.md backstop sentence | Reword to the narrowed reality: the downstream `execution-evidence` HARD catch holds only where the captured gate log enumerates test file paths (the `.test.sh` half); for a pattern admitting a non-`.test.sh` file the gate ignores, the mapped-path grep is SOFT cannot-confirm, so the ≥1-file sanity floor plus the floor ⊆ gate discipline is the operative guard. Amend the file-header byte-identical caveat in the same commit. |
| D9 | `war-config.mjs` footprint | Comment-only: a coupling note at the `resolveGate` construct recording that the `|| exit 1` abort truncates enumeration and that the seat prompts' truncation clause depends on this shape. No output-byte change [assumed: the note avoids quoting any swept grep pattern verbatim, per the coupling-comment self-match lesson — if wrong: a future census grep double-counts the comment]. |

## 4. Mechanics

**Workflow engine — sweep-close routing (`skills/war/assets/workflow-template.js`)**
At the sweep-close region (the `sweepApproved && pmr.status === 'merged'` arm and the discard arm that follows), collect the re-audit panel's Minor/Nit findings (`minorsOf(pSeats)` stamped with `task: polishTask.id`) and route each by `dispositionOf`: `follow-up` → `minorsFiled`; `note` → `notes`; `absorb` (and fileless absorb) → `demote(f, 'follow-up', <reason>)` — merged-arm reason: the sweep is the phase's terminal fix round, absorb has no later round; discard-arm reason: the polish branch never merged. Critical/Major findings keep today's behavior (they block re-approval and are visible in `auditLog`); the routing adds no hold path and changes no unanimity semantics. The `polish-rejected`/`polish-discarded` `auditLog` entries are unchanged.

**Workflow engine — seat-prompt clauses (`skills/war/assets/workflow-template.js`)**
- Rescope the conjunctive clause in the per-task gate-audit `agent()` prompt (the line following `mappedTestsLine`/`guardLine`) per D3. The integrated-tip seat prompt carries no twin of this clause and `agents/war-auditor.md` carries no twin either (confirmed live: the card's only "genuinely absent" occurrence is the unrelated dangling-cross-slice-ref calibration rule) — the rescope is single-surface.
- Append the D4 truncation clause to `mappedTestsLine` and `authMappedLine` (both are `pt`-tagged template literals; keep the tag).
- After the rescope, sweep for stragglers: grep `genuinely absent AT THE CONFIRMED INTEGRATION TIP` repo-wide and handle every match — then, grep being a floor not a ceiling, hand-scan the gate-audit prompt region of `workflow-template.js`, the D7/attestation test titles and comments in `skills/war/assets/workflow-template.test.mjs`, and the `agents/war-auditor.md` checklist for same-scope prose restating the old conjunctive rule, listing each straggler as a survey-derived correction.

**Standing card (`agents/war-auditor.md`)**
Append the truncation clause to the D7 mapped-tests checklist bullet, same commit as the dispatched-prompt change (split-surface rule).

**Tests (`skills/war/assets/workflow-template.test.mjs`)**
- New test: a phase whose sweep merges while the re-audit panel returns a Minor/absorb finding routes that finding to follow-up (assert the demotion log line and `minorsFiled`-equivalent observable, and that nothing rides `aced` beyond the queue); a companion assertion covers the discard arm.
- Extend the per-task D7 threading test and the `authMappedLine` twin test with the truncation-clause regex; extend the 'mechanical mapped-tests grep' D3 registry row's `anchors` with the same regex (no new row; the exact floor-count message is untouched).
- Harden the reporter-format premise test per D7 (timeout, `!run.error` assert, delta interpolation).
- Consumer-side banner coupling per D6, inside the existing D7 threading test.

**Tests (`skills/war/assets/war-config.test.mjs`)**
Strengthen the banner test per D6 so dropping the `%s`/path interpolation reds producer-side.

**Docs (`skills/war/references/setup.md`)**
Reword the § `--afk` sanity floor backstop sentence per D8 and amend the header caveat (e.g. "byte-identical … except where a block carries a noted in-place amendment"). No test locks this file's content (confirmed live: no `*.test.*` references `setup.md` at the base) — the doc edit is prose-only. After the reword, grep `caught downstream` repo-wide and handle every match — then hand-scan the same-scope surfaces (`skills/war/SKILL.md` Setup steps, `skills/war/references/setup.md` sibling blocks) for prose restating the retired unqualified backstop, listing each straggler as a survey-derived correction.

**Comment (`skills/war/assets/war-config.mjs`)**
The D9 coupling note at `resolveGate`. Byte-level assertion of no behavioral change: the idempotence trio and D2 mirror-registry row stay green untouched.

## 5. Surface changes

- `skills/war/assets/workflow-template.js` — sweep-close routing; conjunctive-clause rescope; truncation clause in `mappedTestsLine`, `authMappedLine`.
- `skills/war/assets/workflow-template.test.mjs` — sweep-routing test; D7 threading + twin test extensions; D3 registry-row anchor extension; premise-test hardening; consumer-side banner coupling.
- `skills/war/assets/war-config.test.mjs` — producer-side banner-shape pin.
- `skills/war/assets/war-config.mjs` — comment-only coupling note at `resolveGate`.
- `skills/war/references/setup.md` — backstop sentence reword + header-caveat amendment.
- `agents/war-auditor.md` — D7 bullet truncation clause.

## 6. New domain terms (CONTEXT.md)

- **sweep-raised finding** — a finding the phase-close re-audit panel raises against the polish commit itself, as distinct from the *queued* findings (`phaseCloseQueue`) the sweep was dispatched to drain. [assumed: naming this distinction earns its glossary row because the routing fix and its tests both need the two populations kept apart — if wrong: drop the row; the spec prose still defines it locally.]
- **truncated gate log** — a captured gate log whose bash half aborted at the first red suite, so it enumerates some per-file headers but not all discovered suites; enumeration-conditional evidence rules treat post-abort paths as SOFT cannot-confirm. [assumed: same justification — if wrong: drop the row.]

## 7. Recommended ADRs

None new. Optionally a clarifying amendment to `docs/adr/0013-commanders-intent-and-disposition-routing.md` recording that the demotion ladder's "never drop silently" contract covers sweep-raised findings, not only the phase-close queue [assumed: the ladder's existing prose is generic enough that the code fix alone may suffice — if wrong: the same gap re-opens at the next finding population added outside the ladder].

## 8. Open risks / implementation notes

- **Ordering: this group lands after the `done-when-floor-wiring` sibling group** — both rewrite `skills/war/assets/workflow-template.js` and its test suite, so landing first would force that group into rebase conflicts; the survey manifest carries the machine-readable dependency hint. Verify the base at conversion time and re-anchor any construct the sibling group moved.
- The sweep-routing change touches the region the #805-exempt annotation and the `aced` provenance comments document — keep the invariant that nothing routed at sweep close can ride `--ace` (the single attempt is per-task and pre-merge; the sweep is terminal).
- `demote`'s log line reads `f.severity`/`f.title`/`f.task` — stamp `task: polishTask.id` before routing or the log prints `undefined`.
- Extending an existing D3 registry row's anchors (not adding a row) keeps the exact floor-count assertion message true; touching that message is a known census trap.
- The truncation clause lengthens two `pt`-tagged literals — the #931 untagged-literal census is unaffected as long as no new untagged literal is introduced.
- The premise-test status-assert message must interpolate the delta (`run.status`, stderr tail) precisely because a custom message suppresses node:assert's generated diff — recorded repo lesson.
- Line references in the issues (e.g. the conjunctive clause "line ~1821 at land") are already stale-prone; every edit here anchors by named construct (`mappedTestsLine`, `authMappedLine`, the per-task gate-audit `agent()` prompt, `resolveGate`).

## 9. Non-goals / deferred

- No change to `resolveGate`'s composed gate string or its fail-fast `|| exit 1` semantics (D9 constraint); a continue-on-red aggregate-failure gate is out of scope.
- No change to unanimity, severity gating, or the HARD escalation lanes (`isHardGateEvidence`, `escalated`); the fixes are routing and evidence-interpretation only.
- No widening of the HARD trigger to the node (non-enumerating) half — the reporter-format premise test's revisit comment remains the tripwire.
- No new sweep round or fix budget for sweep-raised findings — they file as follow-up, they are not fixed in-run.
- Issue #1343 close conditions require the correcting change to cite the issue — a plan-conversion duty (commit-message citation), not a spec artifact.

## 10. Validation criteria

1. WHEN the phase-close sweep merges and its re-audit panel returned a Minor/absorb finding THE Workflow SHALL demote that finding to follow-up with a logged reason instead of dropping it · check: `node --test skills/war/assets/workflow-template.test.mjs` green, including a test whose title names sweep-raised finding routing; `grep -n "Disposition demotion" skills/war/assets/workflow-template.js` shows the ladder is the vehicle.
2. WHEN the sweep is discarded or rejected THE sweep-raised Minor/Nit findings SHALL route through the same disposition ladder with a reason naming the unmerged polish branch · check: the same test file asserts the discard arm.
3. WHEN a mapped `.test.sh` is present at the confirmed tip but absent from an enumerating, non-truncated log THE per-task gate-audit prompt SHALL carry exactly one governing instruction (the MAPPED TESTS block), with the older clause scoped to the missing-test case · check: `grep -c "genuinely absent AT THE CONFIRMED INTEGRATION TIP" skills/war/assets/workflow-template.js` = 1 and the enclosing sentence names the deferral to the MAPPED TESTS block.
4. WHEN the captured log's bash half aborted at a red suite THE seat instruction on all three surfaces (`mappedTestsLine`, `authMappedLine`, the `agents/war-auditor.md` D7 bullet) SHALL treat a post-abort mapped path as SOFT cannot-confirm, never HARD · check: `grep -l "truncated" skills/war/assets/workflow-template.js agents/war-auditor.md` hits both files; the D3 registry row's extended anchors red on removal (`node --test skills/war/assets/workflow-template.test.mjs`).
5. WHEN `resolveGate`'s banner loses its per-file path interpolation THE producer-side pin SHALL go red · check: `grep -n "gate(bash): " skills/war/assets/war-config.test.mjs` shows an assert on `== gate(bash): ` plus `%s`.
6. WHEN the seat-facing banner literal drifts from `resolveGate`'s live output THE consumer-side coupling assert SHALL go red · check: the D7 threading test in `skills/war/assets/workflow-template.test.mjs` calls `resolveGate` and asserts the shared literal on the prompt and the card.
7. WHEN the premise probe's child fails to spawn or wedges THE reporter-format premise test SHALL fail naming the spawn/env failure within a bounded time, with the child's status and stderr tail in the message · check: `grep -n "run.error" skills/war/assets/workflow-template.test.mjs` and `grep -n "timeout" skills/war/assets/workflow-template.test.mjs` hit inside the premise test.
8. WHEN a reader consults the § `--afk` sanity floor block THE backstop sentence SHALL state the enumeration-conditional narrowing and the operative guard, and the file header SHALL no longer claim unqualified byte-identity · check: `grep -c "caught downstream" skills/war/references/setup.md` = 0 or the sentence is qualified by the enumeration condition; header grep shows the amendment caveat · manual same-scope survey: hand-scan `skills/war/references/setup.md`'s same-scope tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a survey-derived correction.
9. WHEN the full gate runs at the landed tip THE suites SHALL be green with `resolveGate`'s output bytes unchanged · check: `node --test 'skills/**/*.test.mjs'` and the shell loop over `hooks/` and `skills/` `*.test.sh`; the idempotence trio and D2 mirror row pass untouched.
10. WHEN the redaction lint runs THE spec and any companion lesson edits SHALL carry no home paths, emails, or handles · check: `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
