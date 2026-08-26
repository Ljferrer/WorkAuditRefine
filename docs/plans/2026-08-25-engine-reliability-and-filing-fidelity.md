# Engine reliability and filing fidelity — pacing knob, budget mechanization, and the workflow-template hardening ladder

Converted by `/war-machine` from `docs/specs/2026-08-25-engine-reliability-and-filing-fidelity-design.md`
(Part 1 is its decision digest; every spec `[assumed:]` row is carried forward or retired with a stated
reason in the Assumptions ledger). Issues addressed (all claimed): #1552, #1586, #1671, #1430, #1666,
#1480, #1679, #1680, #1681, #1672, #1476, #1456, #1560, #1561, #1562, #1597, #1592, #1589, #1575, #1574,
#1571, #1659, #1660, #1577, #1435, #1421, #1688.

**Evidence consumed:** source spec (read in full); issue evidence consumed via the spec's per-claim
`(verified: issue #N (2026-08-25))` tags — the spec was synthesized from per-issue reader summaries the
same day, so each tag is treated as a read of that issue's Evidence artifacts; all named
`workflow-template.js` / floor-script constructs re-verified against HEAD of this worktree at draft time
(2026-08-25): `parallel()` call sites, `ownTokens`/`foreignIds`, `provisionStep` vs `dispatchAgent`,
`seatRef` + `FOLLOWUP_LINE_WINDOW`, the `m.seats && m.seats.length` render, the endstate `cmd-file:` row
builder, `landMerged`, `culpritFiles`, the `Ace-Subset:` trailer build, `fixRounds`/`roundLimit`,
`FILE_BUDGETS`, `reuse_hygiene`, campaign-ledger `case 'record'` copy loop, the single `residue` deny,
`extract_msg`, and the `--close-epic` labels-then-`gh issue close --reason` order.

## Context — the gap / problem

Two operator-directed enhancements lead, and behind them sits a backlog of engine-reliability and
filing-fidelity defects that almost all live in `skills/war/assets/workflow-template.js` and therefore
cannot be parallelized against each other — the template phases here form a strictly-ordered ladder
(operator directive, baked into the source spec).

**No fan-out throttle.** The Workflow fans out via script-level `parallel()` at four sites — the seat
roster `parallel(roster.map(...))` plus its dropped-seat retry, the per-wave task fan-out
`parallel(wave.map(...))`, and the post-merge gate-audit `parallel(mergedTasksForGateAudit.map(...))`
(verified: `workflow-template.js` at HEAD (2026-08-25)). There is no `run.maxParallel` anywhere in the
tree and the harness concurrency cap has no override — upstream request open, no ETA (verified: issue
#1552 (2026-08-25)). On rate-limited accounts the concentrated spend exhausts the rolling 5-hour window
even when total tokens are fine (verified: issue #1552 (2026-08-25)).

**Budget maintenance is half-mechanized.** The two-tier advisory/hard headroom in
`prompt-surface-budgets.test.mjs` (`FILE_BUDGETS`) has landed (verified: issue #1586 reader summary
(2026-08-25)); remaining scope: (a) the operator-gated re-baseline pass (preflight → plan → one gate →
execute → report, mirroring `/lessons-learned tighten`), and (b) a merge-time citation floor — a diff
touching a ceiling constant must carry a `Budget-Raise: ADR-0042 <surface> +<bytes>` commit trailer or
route to the no-test-style fix-worker path. Motivating incident: a worker re-baselined a ceiling
+9,216 B to fund +232 B, caught only because the raise carried no citation (verified: issue #1586
(2026-08-25)).

**Launch preflight / args provenance.** A missing `plan.file` silently no-opped an entire phase — the pt
throw was swallowed by the wave-thunk catch (verified: issue #1430 (2026-08-25)); fix 1 shipped, but
`task.planSlice` is still a bare interpolation at both worker prompt sites, per-task entry validation is
absent, and the vacuous land-barrier endstate (zero tasks ran ⇒ still green) is unfixed — a 2026-08-25
recurrence with `planSlice` proves it (verified: issues #1430, #1671 (2026-08-25); bare
`${task.planSlice}` confirmed at both worker prompt builds at HEAD (2026-08-25)). #1671 asks for a
Lead-side `assert-args-complete.mjs` floor (exit 0/1/2) deriving required pt fields from the template
source, wired into `skills/war/SKILL.md` launch, plus a default-deny census of bare interpolations
(verified: issue #1671 (2026-08-25)). The #1413 own-token provenance floor is mis-calibrated both
directions — substring `includes()` over `JSON.stringify` per surface, foreign-id check with no
predecessor-citation exemption, no word-boundary/stoplist (verified: issue #1480 (2026-08-25)) — and it
false-refuses plan-agnostic backstops carrying Lead-stamped `planFile` provenance (verified: issue #1666
signal 1 (2026-08-25)).

**Endstate-check artifact fidelity.** Three mined defects in the land-barrier endstate-check dispatch's
`.cmd` generation/capture: (1) a correctly single-quoted plan `check:` literal containing a `${...}` run
gets re-rendered double-quoted — bash dies "bad substitution" (verified: issue #1679 (2026-08-25));
(2) an embedded backtick inside a `grep -qF` argument is treated as the closing fence — truncated `.cmd`,
unexpected-EOF (verified: issue #1680 (2026-08-25)); (3) the dispatch tees one command per condition
row — a two-command check's second half is never captured, and compound checks systemically return
exit 0 with empty stdout, forcing unrecorded hand-re-grounding by gate-audit seats (verified: issue
#1681 (2026-08-25)). Per the #1395 amendment these environmentally-red artifacts attest unverified
(never unmet), so phases proceed with permanently machine-unprovable conditions (verified: issue #1679
(2026-08-25)).

**Filing/consolidation fidelity.** The follow-up consolidation collapse keys on file+line only
(`FOLLOWUP_LINE_WINDOW`): same-seat same-file rows within the window also collapse, and every
merged-away row survives only as a `seats[]` ref — title and rationale dropped from `minorsFiled`, the
handoff, and the filing prompt (verified: issues #1571, #1575 (2026-08-25); the collapse appending only
`seatRef(f)` confirmed at HEAD (2026-08-25)). `seatRef` is seat-only, so a cross-task collapse loses
corroborating-task attribution (verified: issue #1574 (2026-08-25)). The filing-prompt row renderer
calls `m.seats.join` behind a truthiness (not `Array.isArray`) gate — an auditor-supplied string `seats`
kills the whole filing batch (verified: issues #1592, #1597 (2026-08-25)); #1597 additionally wants
`schemas.md`'s `minorsFiled` collapse qualified as conditional on handoff-emitting decisions (verified:
issue #1597 (2026-08-25)). A guard comment claims the collapse block "runs outside any try" — literally
false (verified: issue #1589 (2026-08-25)). The Evidence-artifacts extraction clause mis-reads a
`:rebut` seat suffix as the lens (verified: issue #1659 (2026-08-25)); `auditEvidenceOf`'s sha fallback
renders "unrecorded" for every `requiresTest:false` task (verified: issue #1660 (2026-08-25)). ADR 0013
Decision 4 still describes 1:1 finding→issue filing; the landed behavior is N:1 clustered filing with
dedup-as-corroboration-comment (verified: issue #1577 (2026-08-25)).

**Land-path and phase-close robustness.** The land dispatch dies when the gate outruns the ~2 min tool
timeout (needs a segmented/incomplete status, not a death), and a `held:land-failed` phase leaves the
follow-up filing dispatch unrun (verified: issue #1666 signals 2–3 (2026-08-25)). When any phase-close
polish dispatch dies, the fail-open coherence sweep demotes the entire absorb queue to a flat untriaged
follow-up dump with no drain-cause metadata; `provisionStep` dispatches via bare `agent(...)`, outside
`dispatchAgent`'s soft env-died classification (verified: issue #1672 (2026-08-25); both constructs
confirmed distinct at HEAD (2026-08-25)).

**aceBisect robustness.** The `Ace-Subset:` trailer value is `taskId+':'+sorted-files`, so a child
subset's trailer is a strict prefix of its parent's and the prompt mandates neither exact-value equality
nor a blank-line-separated final trailer block (verified: issue #1560 (2026-08-25)); culprit attribution
is exact `culpritFiles.has(f.file)` string equality, so path-form drift silently forgoes culprit-first
(verified: issue #1561 (2026-08-25)); subset commits and merge-floor retries draw one undifferentiated
`fixRounds` pool, so the ladder can starve the floor-retry loop (verified: issue #1562 (2026-08-25)).

**File-disjoint peripheral hardening.** (a) `provision-worktrees.sh`'s reuse-hygiene arm has four
fail-open gaps: no `--untracked-files=all` porcelain read, deliberate git-rm ambiguity, SIGPIPE
misclassification, and `cmd_ensure_refinery_worktree` carries no hygiene arm (verified: issue #1476
(2026-08-25)). (b) `campaign-ledger.mjs` `case 'record'` copies `status`/`branch`/`sha`/`stopPoint` via
`hasOwnProperty` with no typeof guard while `pr`/`redteamRounds` carry the typeof+regex refusal — a bare
flag stamps boolean `true` into the ledger (verified: issue #1456 (2026-08-25)). (c)
`validate-auditor-git.sh` emits one unconditional metacharacter-rule deny for every out-of-allowlist
byte, over-attributing chain-operator denials (verified: issue #1435 (2026-08-25); the single `residue`
deny confirmed at HEAD (2026-08-25)). (d) #1421 carries three separable items: `skills/war/SKILL.md`
test-floor prose omits that the single-star token must be leading; 186 auditor-git-guard denials of
composed/`git grep` commands in one run; `assert-issues-filed.sh --close-epic` half-applies on older
`gh` lacking `--reason` (verified: issue #1421 (2026-08-25)). (e)
`assert-guard-specificity-in-diff.sh`'s `extract_msg` records a die guard's whole quoted literal, so a
message with an unexpandable `$var` tail can never be honestly covered — six recorded recurrences
(verified: issue #1688 (2026-08-25)).

## Pivotal constraints

- `run.maxParallel` absent/`null` ⇒ byte-identical fan-out to today; batching changes only *when*
  thunks start, never how results are collected — the one-collected-result-per-dispatched-task
  wave-loop invariant (#742) holds (verified: issue #1552 (2026-08-25)).
- Ceiling HARD semantics at gate time unchanged; the citation floor makes uncited raises impossible,
  sizing stays audit-side (verified: issue #1586 (2026-08-25)).
- Enum discipline: no new members of `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` without updating
  both hand-mirrored copies and the drift-guard row together; `held:workflow-error` never enters
  `HARD_ESCALATION_REASONS` (ADR 0005). Floor scripts exit 0/1/2, with 2 = git error never collapsing
  into the floor status.
- Standing/dispatched prompt split: any auditor/refiner behavior change updates `agents/*.md` and the
  `workflow-template.js` prompt build in the same commit.
- `workflow-template.js` is under active edit by the in-flight ask-disposition campaign — this plan
  launches only after that campaign lands; every template phase rebases on its landed tip (verified:
  issue #1430 reader summary (2026-08-25)).
- Guard changes in #1435 / #1421(b) are message-only: allowlist, exit codes, and routing byte-unchanged
  (verified: issue #1435 (2026-08-25)).
- No change to #1395 attestation semantics: environmentally-red still attests unverified, never unmet —
  Phase 4 fixes the artifacts, not the attestation law.

## Resolved design tree

No full interview was convened (war-machine conversion); rows carry no `PIN-<n>` ids. The
decision-shaped items the spec deferred are settled: D11/#1560/#1562 operator-ratified in the
2026-08-25 interactive volley (marked in their rows), D6's residual stance self-decided (Notes).

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Throttle mechanism | `batched(thunks, n)` group-batching helper (slice into groups of `maxParallel`, await each group serially), applied at the wave fan-out (dominant), the gate-audit pass, and the roster fan-out + its dropped-seat retry; no semaphore — the sandbox has no shared-counter primitive | (verified: issue #1552 (2026-08-25)) |
| D2 | Throttle config | `run.maxParallel` integer ≥ 1, default absent = unthrottled; validated in `war-config.mjs` beside `run.roundLimit`; `/war-room` override question; `/red-team` prose reads the same config fail-open | (verified: issue #1552 (2026-08-25)) |
| D3 | Budget mechanization split | Re-baseline pass = operator-gated maintenance flow (preflight/plan/gate/execute/report) as a doctrine/reference surface; citation floor = new refiner-side merge floor script keyed on the `Budget-Raise:` trailer, mirroring `assert-test-in-diff.sh` | (verified: issue #1586 (2026-08-25)) |
| D4 | Launch preflight | New `skills/war/assets/assert-args-complete.mjs` derives required pt fields from the template source (never a hand list), exit 0/1/2, wired into the SKILL.md launch sequence; a default-deny census test pins the set of bare interpolations | (verified: issue #1671 (2026-08-25)) |
| D5 | Engine-side belt | Per-task entry validation (`planSlice`/`doneWhen` shape), `<unset>`-style defaults on remaining bare fields, pt-throw classification to `held:workflow-error` (never a `HARD_ESCALATION_REASONS` member — ADR 0005), and a never-green land-barrier endstate when zero tasks ran | (verified: issue #1430 (2026-08-25)) |
| D6 | Provenance floor recalibration | Own-token check scoped to intent-bearing args with word-boundary matching + stoplist; exemptions for `source:'auto'`, predecessor citations, and Lead-stamped `planFile` provenance rows; no residual ratified — self-decided at conversion, any further false refusal files as a follow-up (conscious deviation, see Notes) | (verified: issues #1480, #1666 (2026-08-25)) |
| D7 | Endstate `.cmd` transport | Preserve the plan `check:` literal's quoting byte-verbatim (quoting-agnostic transport via a fenced block whose fence length exceeds any inner backtick run), distinguish outer-fence backticks from content backticks, capture full stdout for compound checks, run every command of a multi-command check (or intake-lint it loudly), and fail the artifact loudly when its shape contradicts the declared check | (verified: issues #1679, #1680, #1681 (2026-08-25)) |
| D8 | Collapse fidelity | Collapse key widened with seat discrimination (same seat never collapses with itself across distinct findings); `seatRef` carries seat+task; merged-away rows' title/rationale preserved through the filing prompt, issue body, handoff `followUps`, and log | (verified: issues #1571, #1574, #1575 (2026-08-25)) |
| D9 | Filing-row robustness | `Array.isArray(m.seats)` guard in the row renderer; try-scope comment corrected; `:rebut` suffix carve-out in the Evidence-artifacts clause with a drift-row fixture; per-task landed sha retained at `landMerged` regardless of `requiresTest` | (verified: issues #1592, #1589, #1659, #1660 (2026-08-25)) |
| D10 | ADR 0013 | Amendment to `docs/adr/0013-commanders-intent-and-disposition-routing.md` ratifying N:1 clustered filing + dedup-as-corroboration-comment; `schemas.md` `minorsFiled` collapse qualified conditional on handoff-emitting decisions | (verified: issues #1577, #1597 (2026-08-25)); filename corrected against `docs/adr/` at HEAD (2026-08-25) |
| D11 | Land/phase-close robustness | Segmented land-dispatch status rides the existing merge-task INCOMPLETE re-dispatch shape (in-band marker, no enum widening — operator-ratified (2026-08-25, interactive volley)); the filing dispatch runs (or hands off) on `held:land-failed`; phase-close provision + polish dispatches routed through `dispatchAgent` classification; drain-cause stamp on every demoted finding | (verified: issues #1666, #1672 (2026-08-25)); marker shape operator-ratified (2026-08-25, interactive volley) |
| D12 | aceBisect | Preflight scan mandates exact-value trailer equality and the prompt mandates a blank-line-separated final trailer block (value format unchanged — resume idempotency with prior commits preserved; operator-ratified (2026-08-25, interactive volley)); culprit comparison normalizes path form (strip leading `./`, repo-relative); `fixRounds` starvation resolved as a floor-retry reserve of 2 slots (subset commits only while `fixRounds < roundLimit − 2`; operator-ratified (2026-08-25, interactive volley)) | (verified: issues #1560, #1561, #1562 (2026-08-25)) |
| D13 | Peripheral floors | provision-worktrees hygiene gaps fixed or explicitly documented in the script header; typeof string guards in campaign-ledger `record`; residue classified before composing the auditor-guard deny message; SKILL.md leading-star correction; `--close-epic` degrades loud without `--reason` on older `gh`; `extract_msg` truncates at the first `$`-interpolation and the floor accepts a distinguishing-prefix stderr assertion | (verified: issues #1476, #1456, #1435, #1421, #1688 (2026-08-25)) |

## Assumptions ledger

Spec rows A1–A7 carried forward verbatim (none retired); A8–A10 minted at conversion.

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Re-baseline pass lands as reference-doc + skill-prose lane, not a new skill directory | spec §4 P2 [assumed] | pass becomes a new skill entry point at plan revision, same content | Phase 2 Task 3 review |
| A2 | Regex-level extraction over the template source suffices for `assert-args-complete.mjs` (no AST) | spec §4 P3 [assumed] | the census test still pins the field set and the floor consumes the pinned list instead | Phase 3 Task 2's test |
| A3 | Endstate transport fix is prompt-side (the Workflow sandbox builds prompts, not files) | spec §4 P4 [assumed] | a provision-step writer script owns the `.cmd` bytes and the prompt only names paths | Phase 4 Task 2 fixtures |
| A4 | "Batching helper" is worth a CONTEXT.md glossary row | spec §6 [assumed] | drop the row | Phase 1 Task 3 review |
| A5 | Budget-maintenance authority rule justifies a one-page ADR | spec §7 [assumed] | fold the rule into ADR 0042's surface | Phase 2 Task 3 review |
| A6 | D11's incomplete-status marker can ride the existing merge-task INCOMPLETE re-dispatch shape (no enum widening) | spec §8 [assumed] | both enum copies + drift guard change together inside Phase 6 Task 1 | Phase 6 Task 2's test |
| A7 | `assert-guard-specificity-in-diff.test.sh` sits beside its script under that name | verified against `skills/war/assets/` listing at HEAD (2026-08-25) — upgraded from assumed to verified | none | resolved |
| A8 | The ask-disposition campaign lands before this plan launches; the integration base at launch is its landed tip (≥ v0.19.0 slots) | spec §8 open risk + operator directive | template-phase rebase churn; re-verify the named constructs at the new tip | Phase 1 Task 1 worker's first rebase |
| A9 | ADR 0013's real path is `docs/adr/0013-commanders-intent-and-disposition-routing.md` (the spec's `0013-finding-disposition-and-followup-filing.md` does not exist) | `ls docs/adr/` at HEAD (2026-08-25) | none — corrected here | Phase 5 Task 4 Files |
| A10 | The Budget-Raise floor script lives at `skills/war/assets/assert-budget-raise-cited.sh` beside the sibling merge floors (the spec's "hooks/-style" describes shape, not directory — every merge-path floor lives in `skills/war/assets/`) | asset listing at HEAD (2026-08-25) | rename/move at Phase 2 Task 1, one-file blast radius | Phase 2 Task 1's test |

## Non-goals / deferred

- No true semaphore, no per-surface budget knobs, no license for ceiling growth (verified: issues
  #1552, #1586 (2026-08-25)).
- No change to #1395 attestation semantics (environmentally-red attests unverified, never unmet).
- No auditor-guard verb-allowlist widening and no `fetch` admission (#1435/#1421 are
  message/ergonomics only).
- Audit-roster shrinking as a pacing lever — orthogonal, rejected in #1552.

## New domain terms · Recommended ADRs

- **Batching helper** (CONTEXT.md) — the group-serial fan-out throttle under `run.maxParallel` (A4).
- **Budget-Raise trailer** (CONTEXT.md) — the machine-checkable citation a ceiling-touching diff must
  carry (verified: issue #1586 (2026-08-25)).
- **Drain cause** (CONTEXT.md) — the stamped reason a demoted absorb finding was fail-open-routed to
  follow-up (verified: issue #1672 (2026-08-25)).
- ADR 0013 amendment: N:1 clustered filing + dedup-as-corroboration-comment (Phase 5 Task 4).
- New ADR (next free number at land time): budget-maintenance authority rule — workers fund growth
  within ceilings; ceiling policy changes are operator acts via the re-baseline pass (Phase 2 Task 3; A5).

## Commander's Intent

- **Purpose:** WAR runs pace their fan-out on rate-limited accounts instead of exhausting the rolling
  window; budget ceilings can only move with an operator-citable trailer; and the engine's known silent
  failure modes — vacuous phases, mangled endstate artifacts, lossy follow-up consolidation, dispatch
  deaths — fail loud or carry full fidelity instead of quietly degrading.
- **Method:** one strictly-ordered ladder of `workflow-template.js` phases (throttle → refiner wiring →
  entry belt → endstate transport → filing fidelity → land/phase-close → aceBisect), each followed by
  its `deps`-edged test task; file-disjoint peripheral floors fan out in one parallel phase; docs and
  ADRs ride as file-disjoint sibling tasks; release trails.
- **Mechanism latitude:** the `batched` helper's internal slicing shape; the exact regex/extraction
  mechanics inside `assert-args-complete.mjs` (A2); the fence-length arithmetic of the endstate
  transport (A3); the collapse-key data structure; the drain-cause stamp's field name; the wording of
  every deny/degradation message; test fixture construction throughout — substituting any of these
  mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no
  issue.
- **Binding guardrails:** `run.maxParallel` absent ⇒ byte-identical fan-out; wave-loop
  one-collected-result-per-dispatched-task invariant (#742) holds; no
  `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS` widening without both mirrored copies + drift-guard
  row in one commit, and `held:workflow-error` never enters `HARD_ESCALATION_REASONS` (ADR 0005); floor
  scripts exit 0/1/2 with 2 never collapsing into the floor status; auditor-guard allowlist, exit
  codes, and routing byte-unchanged; #1395 attestation law untouched; standing/dispatched prompt
  surfaces updated in the same commit.
- **End state:**
  1. With `run.maxParallel` absent, the per-wave fan-out is byte-identical to today's `parallel()`
     path — a default-path census row asserts no batching branch is taken, and the suite prints its
     pass count, never a bare exit ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  2. With `run.maxParallel: N`, at most N task thunks run concurrently and group k+1 starts only after
     group k settles — a deterministic batching-helper unit test ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  3. `war-config.mjs` accepts `run.maxParallel` integer ≥ 1 and refuses anything else, default absent ·
     check: `node --test skills/war/assets/war-config.test.mjs`
  4. A merge diff touching a `FILE_BUDGETS` ceiling constant in `prompt-surface-budgets.test.mjs`
     without a Budget-Raise trailer exits 1 with the named route, and exits 2 on git error — fail-closed
     classification census row included ·
     check: `bash skills/war/assets/assert-budget-raise-cited.test.sh`
  5. A launch omitting any fallback-free pt args field exits 1 naming the field, before any dispatch ·
     check: `node --test skills/war/assets/assert-args-complete.test.mjs`
  6. A plan check literal containing a dollar-brace run, an embedded backtick, or two mandatory
     commands is reproduced byte-verbatim into the executed `.cmd` artifact, every command runs, and
     full stdout is teed — or the artifact fails loudly — fixture rows cover all three shapes ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  7. When two distinct findings collapse, the filing prompt, issue body, handoff `followUps`, and log
     each carry the merged-away row's title and rationale, and `seats[]` carries seat+task attribution ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  8. An auditor-supplied string `seats` on a non-collapsing row renders without throwing ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  9. When a phase-close polish dispatch dies, every demoted finding carries a drain-cause stamp, and
     the provision/polish dispatch path classifies env-died soft via `dispatchAgent` ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  10. When zero tasks ran in a phase, the land-barrier endstate never attests green — vacuous-endstate
     fixture ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  11. The aceBisect preflight mandates exact-value trailer equality with a final-paragraph trailer
     block, and culprit attribution survives `./`-prefix/path-form drift ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  12. `campaign-ledger record` refuses a bare `--status`/`--branch`/`--sha`/`--stopPoint` loudly before
     any `record()` call, ledger byte-identical ·
     check: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
  13. An auditor command denied for a chain operator names the chain-operator rule class, not the glob
     rule — decision and exit code byte-unchanged ·
     check: `bash hooks/validate-auditor-git.test.sh`
  14. With `gh issue close --reason` unsupported, `--close-epic` still closes the epic — degraded,
     loud — stubbed-gh case ·
     check: `bash skills/war/assets/assert-issues-filed.test.sh`
  15. A die-guard message ending in a `$var` interpolation is honestly coverable via a
     distinguishing-prefix stderr assertion ·
     check: `bash skills/war/assets/assert-guard-specificity-in-diff.test.sh`
  16. The reuse-hygiene gaps (`--untracked-files=all` porcelain read, git-rm ambiguity, SIGPIPE
     classification, refinery-worktree hygiene arm) are each fixed or explicitly documented as accepted
     in the script header ·
     check: `bash skills/war/assets/provision-worktrees.test.sh`
  17. All four version slots carry the next free patch above the live integration base, and the
     CHANGELOG leads with the matching newest-first entry ·
     check: `node --test skills/war/assets/version-slots.test.mjs`
  18. The dispatched merge-task prompt names `assert-budget-raise-cited.sh`, routes exit 1 to the
     budget-uncited fix-worker path and exit 2 to merge-task status 'error' — prompt-literal rows ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  19. A gate outrunning the land dispatch's tool timeout yields the segmented/incomplete land status
     and a re-dispatch, never a dispatch death — fixture ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  20. A `held:land-failed` phase still produces the follow-up filing dispatch (or the explicit
     unfiled-followups handoff block) — fixture ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  21. A `:rebut`-suffixed seat label extracts the true lens in the Evidence-artifacts clause —
     drift-row fixture ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  22. `auditEvidenceOf` returns a real landed sha (never "unrecorded") for a merged
     `requiresTest:false` task — fixture ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`

## Build order (for /war)

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 (the `workflow-template.js` ladder,
strictly ordered — the file is never split across parallel tasks) → Phase 8 (peripheral floors, fully
parallel, disjoint from the template) → Phase 9 (release, trailing).

## Phase 1 — run.maxParallel pacing knob

### Task 1: Batching helper + threading + tests
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: add a `batched(thunks, n)` helper beside `parallel()` in `workflow-template.js` — slice
  the thunk list into groups of n, await each group serially, return results in input order (the #742
  one-collected-result-per-dispatched-task invariant holds; n absent/null ⇒ delegate straight to
  `parallel()`, byte-identical path). Apply it at all four fan-out sites: the seat-roster
  `parallel(roster.map(...))` and its dropped-seat retry, the per-wave `parallel(wave.map(...))`, and
  the gate-audit `parallel(mergedTasksForGateAudit.map(...))`. Thread `run.maxParallel` exactly like
  `roundLimit` (the hand-mirrored-fallback comment region near `const roundLimit`), updating the
  args-contract header comment in the same commit. In `workflow-template.test.mjs`: a deterministic
  batching unit test (at most N concurrent, group k+1 after group k settles) and a default-path census
  row asserting the absent-knob path takes no batching branch.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: war-config validation
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: validate `run.maxParallel` beside the existing `run.roundLimit` check in `validate()` —
  when present, integer ≥ 1, else an error naming the key; absent stays valid (unthrottled default —
  no entry added to `DEFAULTS.run`, absence is the default). Test rows: valid N, rejected 0 / negative /
  non-integer / string, absent-passes.
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Operator surfaces for the knob
- Files: `skills/war-room/SKILL.md`, `skills/war/references/design.md`, `skills/red-team/SKILL.md`, `CONTEXT.md`
- Plan slice: `/war-room` gains the `run.maxParallel` override question (default: leave absent);
  `design.md`'s concurrency line names the knob; `/red-team` prose reads the same config fail-open when
  sizing its own fan-out. CONTEXT.md gains all three of this plan's glossary rows in one touch —
  "Batching helper" (A4), "Budget-Raise trailer", and "Drain cause" — the latter two annotated
  defined-but-not-yet-emitted; produced in Phase 2 (the citation floor) and Phase 6 (the drain-cause
  stamp), so the auditor cross-links the producing phases rather than flagging dangling refs.
  Touched-doc rule
  (war-strategy §3 rule 8): every surface **de-mirrors** — each names the knob and points at
  `war-config.mjs` for shape/default, never restating "integer ≥ 1" or a default value as its own fact;
  no machine-derivable value is rendered authoritative, so no guard is owed.
- Done when: None — doc-only; prose reviewed by the audit roster
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Budget-maintenance remainder

### Task 1: Budget-Raise citation floor
- Files: `skills/war/assets/assert-budget-raise-cited.sh`, `skills/war/assets/assert-budget-raise-cited.test.sh`
- Plan slice: new merge-path floor mirroring `assert-test-in-diff.sh`'s shape (A10): given a worktree +
  merge range, when the diff touches a `FILE_BUDGETS` ceiling constant line in
  `skills/war/assets/prompt-surface-budgets.test.mjs` (a `hard:` or `advisory:` value change), require a
  commit trailer of the form `Budget-Raise: ADR-0042 <surface> +<bytes>` on a commit in the range —
  missing ⇒ exit 1 (the named route, no-test-style), present or no ceiling touch ⇒ exit 0, git error ⇒
  exit 2 (never collapsing into the floor status). Lowering a constant (ratchet-down) needs no trailer.
  Test suite bash-3.2-safe, cwd-independent, with a fail-closed classification census row.
- Done when: `bash skills/war/assets/assert-budget-raise-cited.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Refiner wiring (standing + dispatched, one commit)
- Files: `agents/war-refiner.md`, `skills/war/assets/workflow-template.js`
- Plan slice: wire the new floor into the refiner merge path exactly where the sibling merge floors run
  (`assert-test-in-diff.sh` et al.): `agents/war-refiner.md` standing instructions AND the dispatched
  refiner merge-task prompt build in `workflow-template.js`, in the same commit
  (standing/dispatched-split rule). Exit 1 routes to the no-test-style fix-worker path
  (`budget-uncited` route naming, message pointing at the trailer form and the re-baseline pass); exit 2
  routes to merge-task `status: 'error'`.
- Done when: None — behavior exercised by Task 1's floor suite plus the audit roster's prompt-surface review
- requiresTest: false
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

### Task 3: Re-baseline pass doctrine + authority ADR
- Files: `skills/war/references/budget-rebaseline.md`, `skills/war/SKILL.md`, `docs/adr/00NN-budget-maintenance-authority.md`
- Plan slice: author the operator-gated re-baseline pass as a reference doc (A1) mirroring
  `/lessons-learned tighten`'s shape — preflight (measure every budgeted surface) → plan (proposed new
  constants via the ADR 0042 formula) → one operator gate → execute (constants + Budget-Raise trailers)
  → report; add the ADR 0042 hot/cold trigger pointer to `skills/war/SKILL.md` ("when re-baselining
  prompt-surface budgets, read references/budget-rebaseline.md"). New one-page ADR at the Files-named
  placeholder path — `00NN` is a land-time-numbered placeholder, resolved to the next free number
  under `docs/adr/` at land time (A5): budget-maintenance authority — workers fund growth within
  ceilings; ceiling changes are operator acts via the re-baseline pass, machine-enforced by the
  Budget-Raise floor. Touched-doc rule: the reference doc points at `prompt-surface-budgets.test.mjs`
  and the ADR 0042 formula for every constant/formula value (de-mirror), never restating live numbers.
- Done when: None — doc/ADR-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: Prompt-literal wiring guard
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: prompt-literal rows guarding Task 2's dispatched wiring, following the suite's existing
  assert-test-in-diff prompt-literal pattern: the dispatched merge-task prompt names
  `assert-budget-raise-cited.sh`; its exit-1 branch routes the budget-uncited no-test-style fix-worker
  path; its exit-2 branch routes merge-task status 'error'.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 2]
- target repo: superproject

## Phase 3 — Launch preflight + args provenance

### Task 1: Entry-region belt + provenance recalibration
- Files: `skills/war/assets/workflow-template.js`
- Plan slice: (D5) per-task entry validation at args intake — `planSlice` present non-empty string,
  `doneWhen` string-when-present shape — refusing at entry with a field-naming message; `<unset>`-style
  fallbacks on every remaining bare interpolation at both worker prompt builds (the `Plan slice:
  ${task.planSlice}` sites) and any prompt-build interpolation the census (Task 2) would otherwise
  flag; classify a pt throw escaping a prompt build to `held:workflow-error` (existing decision — never
  a `HARD_ESCALATION_REASONS` member, ADR 0005); make the land-barrier endstate never attest green when
  zero tasks ran (vacuous phase ⇒ every claimed condition lands unverified with a zero-tasks-ran note).
  (D6) recalibrate the #1413 own-token provenance floor in the `ownTokens`/`foreignIds` region: scope
  the scan to intent-bearing args (never whole-surface `JSON.stringify` substring `includes()`),
  word-boundary token matching with a stoplist for generic tokens, and exemptions for `source:'auto'`
  rows, predecessor citations, and Lead-stamped `planFile` provenance rows (#1666 signal 1).
- Done when: None — mapped tests land in Task 2 (deps-edged); the gate covers regressions
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: assert-args-complete floor + census + fixtures
- Files: `skills/war/assets/assert-args-complete.mjs`, `skills/war/assets/assert-args-complete.test.mjs`, `skills/war/SKILL.md`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: new Lead-side preflight floor `assert-args-complete.mjs` — reads the template source,
  mechanically extracts fallback-free `${args...}`/task-field interpolations (A2), checks the launch
  args object supplied on stdin/argv, exit 0 complete / 1 naming the missing field / 2 on read error;
  wire it into the `skills/war/SKILL.md` launch sequence before dispatch, and fix the same file's
  test-floor prose to state the single-star token must be **leading** (#1421 item a — natural home,
  same file). In `workflow-template.test.mjs`: a default-deny census pinning the exact set of remaining
  bare interpolations (any new one is a red test), entry-validation fixtures (missing `planSlice`
  refused naming the field), provenance-floor fixtures (word-boundary hit, stoplist pass,
  `source:'auto'` / predecessor-citation / Lead-stamped `planFile` exemptions, foreign-id still
  refused), and the vacuous-endstate fixture (zero tasks ran ⇒ never green). Census grep is a floor:
  after it, hand-scan the template's prompt-build regions case-insensitively for interpolations the
  pattern misses and list each as a survey-derived correction.
- Done when: `node --test skills/war/assets/assert-args-complete.test.mjs skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

### Task 3: schemas.md field rows
- Files: `skills/war/references/schemas.md`
- Plan slice: document the entry-validation contract and the recalibrated provenance exemptions as
  informal summaries pointing at the canonical parse/validation rules in the template (de-mirror per
  war-strategy §3 rule 8 — schemas.md rows summarize, the template is authoritative; no value
  restated without a pointer).
- Done when: None — doc-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Endstate-check artifact fidelity

### Task 1: Quoting-agnostic .cmd transport
- Files: `skills/war/assets/workflow-template.js`
- Plan slice: rework the land-barrier endstate-check dispatch's per-row `cmd-file:` build (the
  `endstate-<phaseId>-<n>.cmd` row builder and its dispatched prompt): (1) the prompt instructs a
  byte-verbatim file write of the check literal from a fenced block whose fence length exceeds any
  inner backtick run (A3) — never re-quoting, so single-quoted `${...}` literals survive; (2) content
  backticks are never treated as the fence; (3) the artifact tees FULL stdout+stderr of the whole
  command line — compound/pipeline checks captured end-to-end, every command of a multi-command check
  runs (or the row is intake-linted loudly at dispatch as unsupported, recorded on the artifact, never
  silently half-run); (4) the dispatch fails the row loudly (artifact records the contradiction) when
  the written `.cmd` bytes do not equal the declared check literal. No change to #1395 attestation
  semantics.
- Done when: None — fixtures land in Task 2 (deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Three-shape fixture rows
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: fixture rows exercising the transport contract for the three mined shapes — a
  single-quoted literal containing a `${...}` run (byte-verbatim survival), an embedded-backtick
  literal (no truncation at the inner run), and a two-command check (both halves present, full stdout
  contract) — plus the loud-failure row (declared literal ≠ written bytes ⇒ recorded contradiction).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

## Phase 5 — Filing/consolidation fidelity

### Task 1: Collapse + filing-prompt region
- Files: `skills/war/assets/workflow-template.js`
- Plan slice: in the follow-up consolidation block (`FOLLOWUP_LINE_WINDOW` / `seatRef`): (D8) widen the
  collapse key with seat discrimination — two rows from the same seat never collapse as corroboration;
  `seatRef` renders seat+task (both when present); a merged-away row's title and rationale are
  preserved onto the surviving row (a `merged[]` sub-list or equivalent) and rendered through the
  filing prompt, the issue-body instruction, handoff `followUps`, and the consolidation log line. (D9)
  replace the truthiness gate on `m.seats.join` with `Array.isArray(m.seats)` (string `seats` renders
  via the fallback, batch never throws); correct the "runs outside any try" comment to state the real
  try scope; carve `:rebut` out of the Evidence-artifacts lens-extraction clause (the suffix is a
  dispatch label, never the lens); retain the per-task landed sha at `landMerged` for
  `requiresTest:false` tasks so `auditEvidenceOf` never renders "unrecorded" for them.
- Done when: None — fixtures land in Task 2 (deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Consolidation fixtures
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: fixture assertions — cross-seat collapse carries merged-away title+rationale through
  prompt/handoff/log; same-seat same-file rows within the window do NOT collapse; `seats[]` carries
  seat+task on a cross-task collapse; string-`seats` row renders without throwing (`Array.isArray`
  fixture); a `:rebut`-suffixed seat label extracts the true lens (drift-row fixture);
  `auditEvidenceOf` returns a real sha for a `requiresTest:false` merged task.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

### Task 3: schemas.md minorsFiled qualifier
- Files: `skills/war/references/schemas.md`
- Plan slice: qualify the `minorsFiled` collapse description as conditional on handoff-emitting
  decisions (#1597), pointing at the canonical collapse block in the template (de-mirror).
- Done when: None — doc-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: ADR 0013 amendment
- Files: `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- Plan slice: append an amendment section ratifying the landed N:1 clustered filing +
  dedup-as-corroboration-comment behavior, superseding Decision 4's 1:1 finding→issue description
  (A9 — filename corrected from the spec).
- Done when: None — ADR-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 6 — Land-path + phase-close robustness

### Task 1: Segmented land, filing-on-held, dispatch classification
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`
- Plan slice: (a) the land dispatch survives a gate outrunning the tool timeout by returning a
  segmented/incomplete status riding the existing merge-task INCOMPLETE re-dispatch shape (A6 — in-band
  marker, `land-decision.mjs` untouched); ONLY if implementation proves an enum member unavoidable do
  `land-decision.mjs` + the hand-mirrored template copy + the drift-guard row change together in this
  task's single commit (they are in Files for that contingency alone). (b) on `held:land-failed`, the
  follow-up filing dispatch still runs (or the handoff carries an explicit unfiled-followups block the
  Lead executes) — never silently unrun. (c) route `provisionStep`'s bare `agent(...)` dispatches
  through `dispatchAgent` so provision deaths classify env-died soft per the existing #1411 class; (d)
  when a phase-close polish dispatch dies, stamp every demoted finding with a drain cause (which
  dispatch died, why demoted) instead of the flat untriaged dump.
- Done when: None — fixtures land in Task 2 (deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Classification + drain-cause fixtures
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: fixtures — provision-path death classifies env-died soft; polish-dispatch death stamps
  drain cause on each demoted finding; `held:land-failed` still produces the filing dispatch (or the
  explicit handoff block); the segmented land status round-trips the INCOMPLETE re-dispatch shape
  without widening either mirrored enum (the existing drift-guard row stays green).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

### Task 3: Recovery docs
- Files: `skills/war/references/resume-and-recovery.md`
- Plan slice: document the segmented land status and the filing-on-held behavior in the recovery
  doctrine — pointing at the template's land-decision arms for the authoritative status set
  (de-mirror; never restating the enum members as a list).
- Done when: None — doc-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 7 — aceBisect robustness

### Task 1: Trailer equality, path normalization, floor-retry reserve
- Files: `skills/war/assets/workflow-template.js`
- Plan slice: (D12) the aceBisect PREFLIGHT instruction mandates exact-value trailer equality
  (`%(trailers:key=Ace-Subset,valueonly)` compared whole-string, never prefix/substring) and the commit
  instruction mandates the `Ace-Subset:` trailer as its own blank-line-separated final paragraph;
  trailer VALUE format unchanged (Open decision 3). Normalize both sides of the culprit comparison
  (`culpritFiles.has(f.file)`) to repo-relative form with any leading `./` stripped, and mandate
  repo-relative paths in the re-audit prompt. Reserve 2 `fixRounds` slots for the merge-floor retry
  loop: subset commits dispatch only while `fixRounds < roundLimit − 2` (Open decision 4), the
  reserve-exhausted branch logging why the ladder stopped.
- Done when: None — regression tests land in Task 2 (deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: aceBisect regression tests
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: regression rows — a parent/child trailer pair (strict prefix) never matches under
  exact-value comparison; `./`-prefixed vs bare culprit paths attribute identically; the subset ladder
  stops at `roundLimit − 2` leaving the floor-retry loop its 2 reserved slots; prompt-literal
  assertions for the exact-equality and final-paragraph mandates.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

## Phase 8 — Peripheral floors (file-disjoint, fully parallel)

### Task 1: provision-worktrees reuse hygiene
- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: close the four `reuse_hygiene` gaps (#1476): porcelain read gains
  `--untracked-files=all`; the deliberate-git-rm ambiguity is either disambiguated (staged-deletion
  shape exempted) or explicitly documented as accepted residual in the function header; SIGPIPE from
  the porcelain pipeline classifies as env error, never a hygiene finding; `cmd_ensure_refinery_worktree`
  gains the same hygiene arm (or a header note stating why the refinery path is exempt). Fail-open
  discipline unchanged — never a die, never a non-zero return on the reuse path. Test rows per gap.
- Done when: `bash skills/war/assets/provision-worktrees.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: campaign-ledger string guards
- Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice: in `case 'record'`, guard `status`/`branch`/`sha`/`stopPoint` with the same
  typeof-string(+shape where applicable) refusal `pr`/`redteamRounds` already carry — a bare flag
  (boolean `true`) is refused loudly BEFORE any `record()` call, ledger byte-identical. Test rows: bare
  flag per key refused, valid values still recorded.
- Done when: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: auditor-guard deny-message classification
- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`
- Plan slice: classify the `residue` BEFORE composing the deny message — chain/control operators
  (`&&`, `;`, `|`, newline continuations) name the one-command-per-call rule; glob/expansion
  metacharacters name the metacharacter rule; the composed message also carries the #1421(b) ergonomics
  guidance (split chains into separate calls; use Read/Grep/Glob instead of shell/git grep) on the
  chain-operator branch where the 186-denial churn actually occurred. Message-only: allowlist, decision,
  and exit codes byte-unchanged (binding guardrail). Test rows: chain-operator denial names its rule,
  glob denial names its rule, allow path untouched.
- Done when: `bash hooks/validate-auditor-git.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: close-epic gh degradation
- Files: `skills/war/assets/assert-issues-filed.sh`, `skills/war/assets/assert-issues-filed.test.sh`
- Plan slice: `--close-epic` detects an older `gh` lacking `close --reason` (probe or retry-on-failure)
  and degrades to `gh issue close <n>` without the flag — still closing the epic, loudly noting the
  degradation on stderr; the labels-first ordering is preserved and a close failure remains a die.
  Stubbed-gh test case for the degraded path plus the modern path unchanged.
- Done when: `bash skills/war/assets/assert-issues-filed.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5: guard-specificity $var-tail coverage
- Files: `skills/war/assets/assert-guard-specificity-in-diff.sh`, `skills/war/assets/assert-guard-specificity-in-diff.test.sh`
- Plan slice: `extract_msg` truncates the recorded literal at the first `$`-interpolation (recording the
  static distinguishing prefix), and the coverage check accepts a distinguishing-prefix stderr
  assertion as covered — an all-interpolation message (empty prefix) falls back to today's whole-literal
  behavior. Test rows: `$var`-tail guard covered by a prefix assertion; fully-static guard behavior
  unchanged; exit 0/1/2 classification census row stays green.
- Done when: `bash skills/war/assets/assert-guard-specificity-in-diff.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 9 — Release

### Task 1: Version bump (all four slots)
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` AND `plugins[0].version`, and the `README.md` `## Status` line
  (replace-in-place, no badge) — to the **next free patch above the live integration base at land
  time** (directive, never a resolved literal here). In the same commit, append the new release entry
  to `CHANGELOG.md` **newest-first** (its first version heading must equal the bumped `plugin.json`
  version — `version-slots.test.mjs` asserts this) and relocate the superseded README Status blurb
  content into that CHANGELOG entry per release doctrine. Expected integration base: the tip this
  campaign's phases landed on (itself above the ask-disposition campaign's release — A8).
  Standalone-fallback rule: a plan run through plain `/war` resolves the next free patch from the four
  slots themselves. `version-slots.test.mjs` (lock-step + monotonic floor + CHANGELOG head) is the
  arbiter. Land-time assertion (wholesale-omission catch — the suite alone is green at untouched
  slots): before landing, assert the resolved version **differs from the launch-base version** (a
  no-op bump is a defect).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Real-run pacing observation: a throttled run (`run.maxParallel: 2`) on a rate-limited account no
  longer exhausts the rolling 5-hour window at fan-out · why deferred: needs a live rate-limited
  account and a full run; unit tests prove ordering, not wall-clock spend · runner: operator, first
  throttled `/war` run after release.
- Endstate transport under a real refiner: the three fixed `.cmd` shapes execute green in a live land
  barrier (fixtures prove the prompt/builder contract, not the dispatched agent's file write) · why
  deferred: needs a live phase land with plan checks carrying `${...}` / backtick / two-command shapes ·
  runner: the first `/war` phase land after release; gate-audit's artifact-first attestation surfaces
  any residue.
- Older-`gh` degradation in the field: the stubbed-gh test proves the branch; a real pre-`--reason`
  `gh` binary is not in CI · why deferred: no old `gh` in the dev environment · runner: operator on any
  machine still carrying an older `gh`, next epic close.

## Notes / conscious deviations

- ADR 0013's filename corrected from the spec's `0013-finding-disposition-and-followup-filing.md` to
  the real `docs/adr/0013-commanders-intent-and-disposition-routing.md` (A9).
- The Budget-Raise floor lives in `skills/war/assets/` beside the sibling merge floors, not `hooks/`
  (A10) — the spec's "hooks/-style" read as shape (exit 0/1/2 discipline), not location.
- Spec assumption A7 (guard-specificity test filename) upgraded to verified — the file exists at the
  assumed path.
- Phase 1 folds the batching unit tests into Task 1 (same-task, two files) rather than a deps-edged
  test task — the helper and its census are one cohesive unit and the file pair is small; Phases 3–7
  use the deps-edged test-task split because their template edits are large and the fixtures benefit
  from landing against the merged fact (war-strategy §3 rule 7 satisfied by explicit `deps` on every
  split guard task).
- The #1421 leading-star SKILL.md prose fix rides Phase 3 Task 2 (same file as the launch wiring,
  natural home per the spec).
- CONTEXT.md glossary rows for Budget-Raise trailer and Drain cause ride Phase 1 Task 3's CONTEXT.md
  touch (one file, one task, all three rows) — a conscious cross-phase doc pre-add: the terms are
  defined-but-not-yet-emitted, produced mechanically in Phases 2 and 6; the auditor should cross-link
  rather than flag the dangling refs.
- End state 17's suite is green at wholly untouched slots (it catches partial bumps and downgrades,
  not wholesale omission) — the wholesale-omission catch is the land-time assertion in Phase 9's
  slice: the resolved version must differ from the launch-base version.
- Grill round 1 additions: `CHANGELOG.md` joined Phase 9 (newest-first entry + Status-blurb
  relocation, same commit); Phase 2 Task 4 (deps-edged prompt-literal wiring guard) and End states
  18–22 added so every slice-named behavior has a mechanical row.
- D6 residual (conscious deviation, self-decided at conversion — operator delegated, 2026-08-25
  volley): after word-boundary + stoplist + the three exemptions, NO further provenance false-refusal
  class is ratified as accepted — any residual false refusal files as a follow-up issue, never a
  prose waiver.
- Every retirement/absence grep any task emits (e.g. the old 1:1 filing prose in ADR 0013, the
  "outside any try" comment) is a completeness floor only: after the grep, hand-scan the target file's
  same-scope tests and comments case-insensitively and list each straggler as a survey-derived
  correction (spec §8).

## Open decisions

None — the four conversion-time forks are settled. D11 (in-band INCOMPLETE marker, enum contingency
pre-authorized in Phase 6 Task 1's single commit), #1560 (exact-value trailer equality), and #1562
(reserve 2 slots) are operator-ratified (2026-08-25, interactive volley); D6's no-residual stance is
self-decided and recorded as a conscious deviation under Notes.
