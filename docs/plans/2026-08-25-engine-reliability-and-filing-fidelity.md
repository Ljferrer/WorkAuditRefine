# Engine reliability and filing fidelity — pacing knob, budget mechanization, and the workflow-template hardening ladder

Converted by `/war-machine` from `docs/specs/2026-08-25-engine-reliability-and-filing-fidelity-design.md`
(Part 1 is its decision digest; every spec `[assumed:]` row is carried forward or retired with a stated
reason in the Assumptions ledger). Issues addressed (all claimed): #1552, #1586, #1671, #1430, #1666,
#1480, #1679, #1680, #1681, #1672, #1476, #1456, #1560, #1561, #1562, #1597, #1592, #1589, #1575, #1574,
#1571, #1659, #1660, #1577, #1435, #1421, #1688; fold batch (operator-ratified 2026-08-25 volley):
#1691, #1692, #1693, #1694, #1696, #1704, #1712.

**Evidence consumed:** source spec (read in full); issue evidence consumed via the spec's per-claim
`(verified: issue #N (2026-08-25))` tags — the spec was synthesized from per-issue reader summaries the
same day, so each tag is treated as a read of that issue's Evidence artifacts; all named
`workflow-template.js` / floor-script constructs re-verified against HEAD of this worktree at draft time
(2026-08-25): `parallel()` call sites, `ownTokens`/`foreignIds`, `provisionStep` vs `dispatchAgent`,
`seatRef` + `FOLLOWUP_LINE_WINDOW`, the `m.seats && m.seats.length` render, the endstate `cmd-file:` row
builder, `landMerged`, `culpritFiles`, the `Ace-Subset:` trailer build, `fixRounds`/`roundLimit`,
`FILE_BUDGETS`, `reuse_hygiene`, campaign-ledger `case 'record'` copy loop, the single `residue` deny,
`extract_msg`, and the `--close-epic` labels-then-`gh issue close --reason` order. **0.20.0 refresh
(2026-08-25, post ask-disposition land):** every construct above re-verified against master 40afddb
(v0.20.0) — the ask-disposition diff (asks channel: `dispositionOf` four-member enum, `parkAsk`,
`demote()` ask refusal, ninth handoff key `asks`) touches none of them; the four `parallel()` sites,
both bare `${task.planSlice}` worker-prompt interpolations, the `seatRef`/`FOLLOWUP_LINE_WINDOW`
collapse (still appending only `seatRef(f)`), the `m.seats && m.seats.length` truthiness render, the
"runs outside any try" comment, `auditEvidenceOf`'s `'unrecorded'` sha fallback, `provisionStep`'s
bare `agent(...)`, and the endstate `cmd-file:` row builder are all byte-unchanged in those regions.
Per-issue Evidence-artifacts roll-up (red-team round 1): beyond the constructs above, the artifact
lists on #1679/#1680/#1681/#1672/#1688/#1691–#1696 name non-template artifacts — ADR 0033, ADR 0046,
`docs/plans/2026-08-06-handoff-schemas-contract.md`, `skills/_shared/doc-cli-consistency.test.mjs`,
`skills/red-team/assets/assert-no-repo-escape.sh`/`.test.sh` (case 28), and their learnings twins —
**unread at draft, with reason**: their claims enter this plan only through the issues' own bodies and
the spec, and every construct a slice anchors was re-verified in-repo directly. One carries a forward
read duty: `assert-no-repo-escape.*` case 28 is the distinguishing-prefix precedent Phase 8 Task 5
copies — its worker reads it before implementing.

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
signal 1 (2026-08-25)). Fold batch: on a sanctioned recovery relaunch the barrier's `preMerged`
consumption loop guards with `!tasks.some(t => t.id === id)` and drops without logging — a refiner
reporting worktree-name-shaped ids (`p2-2.1` vs `2.1`) silently disables the merged-set skip, and four
phantom workers were dispatched for already-landed tasks into worktrees the barrier never created; the
guard cannot distinguish garbage from truth in the wrong dialect (verified: issue #1704 (2026-08-25)).

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
`seatRef(f)` confirmed at HEAD (2026-08-25)). `seatRef` is a three-arm ternary — seat, else `'task <id>'`
when task is present, else the terminal `'unattributed'` arm — never seat+task together, so a cross-task
collapse of seat-attributed rows loses corroborating-task attribution (verified: issue #1574
(2026-08-25); the `f.seat ?? (f.task != null ? 'task ' + f.task : 'unattributed')` shape confirmed at
0.20.0 HEAD — the `'unattributed'` arm is a live contract the Evidence-artifacts prompt clause names
verbatim, so the seat+task rework must preserve it). The filing-prompt row renderer
calls `m.seats.join` behind a truthiness (not `Array.isArray`) gate — an auditor-supplied string `seats`
kills the whole filing batch (verified: issues #1592, #1597 (2026-08-25)); #1597 additionally wants
`schemas.md`'s `minorsFiled` collapse qualified as conditional on handoff-emitting decisions (verified:
issue #1597 (2026-08-25)). A guard comment claims the collapse block "runs outside any try" — literally
false (verified: issue #1589 (2026-08-25)). The Evidence-artifacts extraction clause mis-reads a
`:rebut` seat suffix as the lens (verified: issue #1659 (2026-08-25)); `auditEvidenceOf`'s sha fallback
renders "unrecorded" for every `requiresTest:false` task (verified: issue #1660 (2026-08-25)). ADR 0013
Decision 4 still describes 1:1 finding→issue filing; the landed behavior is N:1 clustered filing with
dedup-as-corroboration-comment (verified: issue #1577 (2026-08-25)). Fold batch (0.20.0 asks channel):
the gate-audit-family seats (per-task post-merge, integrated-tip, end-state-only) route findings only
into `auditLog`/`escalated` — never through `dispositionOf` — so an honest `disposition:'ask'` there
never reaches `asks[]`, the ninth handoff key, or the Checkpoint ruling gate; the lane is an unrowed,
uncommented disposition sink (contrast the pinMismatch strip's comment + census row) (verified: issue
#1692 (2026-08-25)). The polish panel is ALREADY compliant — `sweepMinors` routes through the full
`dispositionOf`/`parkAsk` ladder on BOTH terminal arms (merged and discard), each with the #1550
comment (verified: `workflow-template.js` polish-panel arms at 0.20.0, red-team round 1 — no edit owed
there; a second routing pass would double-park asks and break `parkAsk`'s exactly-once contract). And
`minorsOf` stamps agent-controlled `s.audit_sha` verbatim onto every Minor/Nit copy — `parkAsk`
carries it into the operator-facing `asks[].sha` provenance pin with no validate-at-the-copy-site
guard. The existing `pinOrSentinel` cannot simply be reused: it is declared inside the wave-loop body
(not in scope at the top-level `minorsOf`) and its sentinel literal is `integration_sha`-specific, and
the #393 extract-and-eval test requires each such arrow to stay self-contained (verified:
`workflow-template.js` `minorsOf` top-level const vs the in-loop `pinOrSentinel` + its
deliberate-duplication comment, red-team round 1) — so the fix is a new self-contained sibling
validator for `audit_sha` (verified: issue #1693 (2026-08-25) — distinct root cause from #1480's
own-token launch-args floor).

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
Fold batch: two reachable panels' Minor/Nits are routed nowhere — the ace-regression branch consumes
`reSeats` only via `blockingOf` (never `minorsOf`, contrast the approved arm), and aceBisect's
failing-subset arm demotes `sub.findings` but never routes `subSeats`' own Minor/Nits — so an ask
raised on either arm silently drops, contradicting `parkAsk`'s never-dropped header (verified: issue
#1694 (2026-08-25)).

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
(verified: issue #1688 (2026-08-25)). (f) Fold (#1712): recovery relaunches lack ref-holder hygiene —
a worktree-add failure over a held branch asks "is the branch checked out elsewhere?" without naming
the holder (one `git worktree list --porcelain` lookup away), and dead phases deliberately preserve
worktrees, so every new-`runId` relaunch starts in exactly this state; two relaunches of the
ask-disposition run died discovering holders one at a time (r2: prior run's task worktree; r3: prior
`_refinery` — and r3's partial provisioning created fresh holders for the next attempt), until a
complete Lead-run holder enumeration let r4 provision cleanly (verified: issue #1712 (2026-08-25)).

## Pivotal constraints

- `run.maxParallel` absent/`null` ⇒ byte-identical fan-out to today; batching changes only *when*
  thunks start, never how results are collected — the one-collected-result-per-dispatched-task
  wave-loop invariant (#742) holds (verified: issue #1552 (2026-08-25)).
- Ceiling HARD semantics at gate time unchanged; the citation floor makes uncited raises of ANY
  ceiling constant in `prompt-surface-budgets.test.mjs` — the `FILE_BUDGETS` rows AND
  `WORKFLOW_LITERAL_BUDGET` (the template prompt-literal ceiling this very campaign pressures) —
  impossible; sizing stays audit-side (verified: issue #1586 (2026-08-25); `WORKFLOW_LITERAL_BUDGET`
  confirmed as a second, non-`FILE_BUDGETS` ceiling constant in the same file, red-team round 1).
- Enum discipline: no new members of `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` without updating
  both hand-mirrored copies and the drift-guard row together; `held:workflow-error` never enters
  `HARD_ESCALATION_REASONS` (ADR 0005). Floor scripts exit 0/1/2, with 2 = git error never collapsing
  into the floor status.
- Standing/dispatched prompt split: any auditor/refiner behavior change updates `agents/*.md` and the
  `workflow-template.js` prompt build in the same commit.
- The ask-disposition campaign has LANDED (2026-08-25, PR #1711, master 40afddb, release 0.20.0) —
  the launch-ordering constraint is satisfied (A8 resolved); template phases build on that landed
  tip, and the asks channel it added (`parkAsk`, `demote()`'s ask refusal, the ninth handoff key)
  stays byte-untouched by this plan's edits.
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
| D3 | Budget mechanization split | Re-baseline pass = operator-gated maintenance flow (preflight/plan/gate/execute/report) as a doctrine/reference surface; citation floor = new refiner-side merge floor script keyed on the `Budget-Raise:` trailer, mirroring `assert-test-in-diff.sh`, scoped to EVERY `hard:`/`advisory:` ceiling raise in `prompt-surface-budgets.test.mjs` (`FILE_BUDGETS` rows AND `WORKFLOW_LITERAL_BUDGET`, default-deny against future sibling constants) | (verified: issue #1586 (2026-08-25)); scope widened to `WORKFLOW_LITERAL_BUDGET` after red-team round 1 |
| D4 | Launch preflight | New `skills/war/assets/assert-args-complete.mjs` derives required pt fields from the template source (never a hand list), exit 0/1/2, wired into the SKILL.md launch sequence; a default-deny census test pins the set of bare interpolations | (verified: issue #1671 (2026-08-25)) |
| D5 | Engine-side belt | Per-task entry validation (`planSlice`/`doneWhen` shape), `<unset>`-style defaults on remaining bare fields, pt-throw classification to `held:workflow-error` (never a `HARD_ESCALATION_REASONS` member — ADR 0005), and a never-green land-barrier endstate when zero tasks ran | (verified: issue #1430 (2026-08-25)) |
| D6 | Provenance floor recalibration | Own-token check scoped to intent-bearing args with word-boundary matching + stoplist; exemptions for `source:'auto'`, predecessor citations, and Lead-stamped `planFile` provenance rows; no residual ratified — self-decided at conversion, any further false refusal files as a follow-up (conscious deviation, see Notes) | (verified: issues #1480, #1666 (2026-08-25)) |
| D7 | Endstate `.cmd` transport | Preserve the plan `check:` literal's quoting byte-verbatim (quoting-agnostic transport via a fenced block whose fence length exceeds any inner backtick run), distinguish outer-fence backticks from content backticks, capture full stdout for compound checks, run every command of a multi-command check (or intake-lint it loudly), and fail the artifact loudly when its shape contradicts the declared check | (verified: issues #1679, #1680, #1681 (2026-08-25)) |
| D8 | Collapse fidelity | Collapse key widened with seat discrimination (same seat never collapses with itself across distinct findings); `seatRef` carries seat+task (both when present) while PRESERVING the live `'unattributed'` terminal arm the Evidence-artifacts clause names verbatim; merged-away rows' title/rationale preserved through the filing prompt, issue body, handoff `followUps`, and log | (verified: issues #1571, #1574, #1575 (2026-08-25)) |
| D9 | Filing-row robustness | `Array.isArray(m.seats)` guard in the row renderer; try-scope comment corrected; `:rebut` suffix carve-out in the Evidence-artifacts clause with a drift-row fixture; per-task landed sha retained at `landMerged` regardless of `requiresTest` | (verified: issues #1592, #1589, #1659, #1660 (2026-08-25)) |
| D10 | ADR 0013 | Amendment to `docs/adr/0013-commanders-intent-and-disposition-routing.md` ratifying N:1 clustered filing + dedup-as-corroboration-comment; `schemas.md` `minorsFiled` collapse qualified conditional on handoff-emitting decisions | (verified: issues #1577, #1597 (2026-08-25)); filename corrected against `docs/adr/` at HEAD (2026-08-25) |
| D11 | Land/phase-close robustness | Segmented land-dispatch marker is IN-BAND (a field on the land-phase result, never a new status enum member), with a bounded re-dispatch following the FLOOR_STATUSES retry-loop idiom — the engine's real merge-task re-dispatch shape; the land dispatch itself has no retry loop today, so this is new wiring following that existing idiom, `land-decision.mjs` untouched. The filing dispatch runs (or hands off) on `held:land-failed`; the provision-barrier, `provisionStep`, polish-worktree, and sweep dispatches route through `dispatchAgent` classification; drain-cause stamp on every demoted finding | (verified: issues #1666, #1672 (2026-08-25)); DECISION (in-band marker, no enum widening, contingency pre-authorized) operator-ratified (2026-08-25, interactive volley); ANCHOR re-based AI-declared after red-team round 1 falsified the ratification's named "merge-task INCOMPLETE re-dispatch shape" (zero `incomplete` hits in the engine; `held:phase-incomplete` is Lead-side-only) — see the Notes adjudication row |
| D12 | aceBisect | Preflight scan mandates exact-value trailer equality and the prompt mandates a blank-line-separated final trailer block (value format unchanged — resume idempotency with prior commits preserved; operator-ratified (2026-08-25, interactive volley)); culprit comparison normalizes path form (strip leading `./`, repo-relative); `fixRounds` starvation resolved as a floor-retry reserve of 2 slots (subset commits only while `fixRounds < roundLimit − 2`; operator-ratified (2026-08-25, interactive volley)) | (verified: issues #1560, #1561, #1562 (2026-08-25)) |
| D13 | Peripheral floors | provision-worktrees hygiene gaps fixed or explicitly documented in the script header; typeof string guards in campaign-ledger `record`; residue classified before composing the auditor-guard deny message; SKILL.md leading-star correction; `--close-epic` degrades loud without `--reason` on older `gh`; `extract_msg` truncates at the first `$`-interpolation and the floor accepts a distinguishing-prefix stderr assertion | (verified: issues #1476, #1456, #1435, #1421, #1688 (2026-08-25)) |

## Assumptions ledger

Spec rows A1–A7 carried forward verbatim (none retired); A8–A10 minted at conversion; A8 resolved
at the 2026-08-25 refresh (ask-disposition landed).

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Re-baseline pass lands as reference-doc + skill-prose lane, not a new skill directory | spec §4 P2 [assumed] | pass becomes a new skill entry point at plan revision, same content | Phase 2 Task 3 review |
| A2 | Regex-level extraction over the template source suffices for `assert-args-complete.mjs` (no AST) | spec §4 P3 [assumed] | the census test still pins the field set and the floor consumes the pinned list instead | Phase 3 Task 2's test |
| A3 | Endstate transport fix is prompt-side (the Workflow sandbox builds prompts, not files) | spec §4 P4 [assumed] | a provision-step writer script owns the `.cmd` bytes and the prompt only names paths | Phase 4 Task 2 fixtures |
| A4 | "Batching helper" is worth a CONTEXT.md glossary row | spec §6 [assumed] | drop the row | Phase 1 Task 3 review |
| A5 | Budget-maintenance authority rule justifies a one-page ADR | spec §7 [assumed] | fold the rule into ADR 0042's surface | Phase 2 Task 3 review |
| A6 | REVISED (red-team round 1 — the spec's "existing merge-task INCOMPLETE re-dispatch shape" does not exist; zero `incomplete` hits in the engine): D11's segmented-land marker lands as an in-band FIELD on the land-phase result with a bounded re-dispatch following the FLOOR_STATUSES retry-loop idiom — no status enum member, no `KNOWN_LAND_DECISIONS` widening | falsified premise per red-team gate evidence; the floor-retry loop is the engine's only bounded merge re-dispatch idiom (verified at 0.20.0) | if a `KNOWN_LAND_DECISIONS` member proves unavoidable, the pre-authorized contingency in Phase 6 Task 1 fires (its full drift-guard set — the four doc-parity surfaces — is in that task's Files); a new MERGE_RESULT status member is OUT of the pre-authorization: that path halts the phase for a re-plan | Phase 6 Task 2's test |
| A7 | `assert-guard-specificity-in-diff.test.sh` sits beside its script under that name | verified against `skills/war/assets/` listing at HEAD (2026-08-25) — upgraded from assumed to verified | none | resolved |
| A8 | RESOLVED (2026-08-25): the ask-disposition campaign landed — PR #1711, master 40afddb, release 0.20.0; the integration base at launch is at/above the 0.20.0 slots. Named constructs re-verified at that tip (Evidence-consumed refresh note) — the 0.19.0→0.20.0 diff touches none of this plan's anchored regions | landed master 40afddb, `plugin.json` 0.20.0 at HEAD (2026-08-25) | none — resolved | resolved |
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
     path — a default-path census row (titled with the literal token `maxParallel-absent`) asserts no
     batching branch is taken, and the suite prints its pass count, never a bare exit ·
     check: `grep -F 'maxParallel-absent' skills/war/assets/workflow-template.test.mjs`
  2. With `run.maxParallel: N`, at most N task thunks run concurrently, group k+1 starts only after
     group k settles (deterministic batching unit test proving batching/ordering semantics — wall-clock
     pacing itself is the deferred field backstop), and the wave, roster, dropped-seat-retry, and
     gate-audit fan-outs each dispatch through `batched` — call-site census rows, fixtures titled
     `batched` ·
     check: `grep -F 'batched' skills/war/assets/workflow-template.test.mjs`
  3. `war-config.mjs` accepts `run.maxParallel` integer ≥ 1 and refuses anything else, default absent —
     test rows titled `maxParallel` ·
     check: `grep -F 'maxParallel' skills/war/assets/war-config.test.mjs`
  4. A merge diff RAISING any `hard:`/`advisory:` ceiling constant in `prompt-surface-budgets.test.mjs`
     (a `FILE_BUDGETS` row OR `WORKFLOW_LITERAL_BUDGET`) without a Budget-Raise trailer exits 1 with
     the named route; a trailerless ratchet-down exits 0; git error exits 2 — all three as fixture
     rows, fail-closed classification census row included ·
     check: `bash skills/war/assets/assert-budget-raise-cited.test.sh`
  5. A launch omitting any fallback-free pt args field exits 1 naming the field, before any dispatch ·
     check: `node --test skills/war/assets/assert-args-complete.test.mjs`
  6. A plan check literal containing a dollar-brace run, an embedded backtick, or two mandatory
     commands is reproduced byte-verbatim into the executed `.cmd` artifact, every command runs, and
     full stdout is teed — or the artifact fails loudly — fixture rows (titled `endstate-transport`)
     cover all three shapes ·
     check: `grep -F 'endstate-transport' skills/war/assets/workflow-template.test.mjs`
  7. When two distinct findings collapse, the filing prompt, issue body, handoff `followUps`, and log
     each carry the merged-away row's title and rationale, and `seats[]` carries seat+task attribution
     (the `'unattributed'` terminal arm preserved for seatless, taskless rows) — fixtures titled
     `collapse-fidelity` ·
     check: `grep -F 'collapse-fidelity' skills/war/assets/workflow-template.test.mjs`
  8. An auditor-supplied string `seats` on a non-collapsing row renders without throwing — fixture
     titled `string-seats-fixture` ·
     check: `grep -F 'string-seats-fixture' skills/war/assets/workflow-template.test.mjs`
  9. When a phase-close polish dispatch dies, every demoted finding carries a drain-cause stamp, and
     the provision-barrier, `provisionStep`, polish-worktree, and sweep dispatches classify env-died
     soft via `dispatchAgent` — fixtures titled `drain-cause` ·
     check: `grep -F 'drain-cause' skills/war/assets/workflow-template.test.mjs`
  10. When zero tasks ran in a phase, the land-barrier endstate never attests green — fixture titled
     `vacuous-endstate` ·
     check: `grep -F 'vacuous-endstate' skills/war/assets/workflow-template.test.mjs`
  11. The aceBisect preflight mandates exact-value trailer equality with a final-paragraph trailer
     block, and culprit attribution survives `./`-prefix/path-form drift — fixtures titled
     `ace-trailer` ·
     check: `grep -F 'ace-trailer' skills/war/assets/workflow-template.test.mjs`
  12. `campaign-ledger record` refuses a bare `--status`/`--branch`/`--sha`/`--stopPoint` loudly before
     any `record()` call, ledger byte-identical — test rows titled `bare-flag` ·
     check: `grep -F 'bare-flag' skills/war-campaign/assets/campaign-ledger.test.mjs`
  13. An auditor command denied for a chain operator names the chain-operator rule class, not the glob
     rule — decision and exit code byte-unchanged; the suite's new cases carry the literal token
     `chain-operator` (this row pins the case's presence; execution rides the task's Done when) ·
     check: `grep -F 'chain-operator' hooks/validate-auditor-git.test.sh`
  14. With `gh issue close --reason` unsupported, `--close-epic` still closes the epic — degraded,
     loud; the stubbed-gh case carries the literal token `gh-degraded` (presence pin; execution rides
     the task's Done when) ·
     check: `grep -F 'gh-degraded' skills/war/assets/assert-issues-filed.test.sh`
  15. A die-guard message ending in a `$var` interpolation is honestly coverable via a
     distinguishing-prefix stderr assertion; the new cases carry the literal token `prefix-covered`
     (presence pin; execution rides the task's Done when) ·
     check: `grep -F 'prefix-covered' skills/war/assets/assert-guard-specificity-in-diff.test.sh`
  16. Each of the four reuse-hygiene gaps (`--untracked-files=all` porcelain read, git-rm ambiguity,
     SIGPIPE classification, refinery-worktree hygiene arm) is FIXED with its own test row — the
     documented-accepted branch survives only where Phase 8 Task 1's slice explicitly takes it, and
     any such branch gets a test row asserting the header-documentation text; the new cases carry the
     literal token `reuse-gap` (presence pin; execution rides the task's Done when) ·
     check: `grep -F 'reuse-gap' skills/war/assets/provision-worktrees.test.sh`
  17. All four version slots carry the next free patch above the live integration base, and the
     CHANGELOG leads with the matching newest-first entry ·
     check: `node --test skills/war/assets/version-slots.test.mjs`
  18. The Budget-Raise floor directive is asserted on BOTH surfaces — `agents/war-refiner.md` AND the
     dispatched merge-task prompt — via a D3 both-surfaces registry row (anchors:
     `assert-budget-raise-cited.sh`, the trailer form extracted from the floor script, the exit-1
     budget-uncited route, the exit-2 error route), with the registry's no-slack row-count floor
     bumped in the same task — rows titled `budget-raise` ·
     check: `grep -F 'budget-raise' skills/war/assets/workflow-template.test.mjs`
  19. A gate outrunning the land dispatch's tool timeout yields the in-band segmented-land marker and
     a bounded re-dispatch (FLOOR_STATUSES retry-loop idiom), never a dispatch death — no enum
     widening: the `KNOWN_LAND_DECISIONS` doc-parity rows and the MERGE_RESULT status pin stay green —
     fixtures titled `segmented-land` ·
     check: `grep -F 'segmented-land' skills/war/assets/workflow-template.test.mjs`
  20. A `held:land-failed` phase still produces the follow-up filing dispatch (or the explicit
     unfiled-followups handoff block) — fixture titled `filing-on-held` ·
     check: `grep -F 'filing-on-held' skills/war/assets/workflow-template.test.mjs`
  21. A `:rebut`-suffixed seat label extracts the true lens in the Evidence-artifacts clause —
     drift-row fixture titled `rebut-lens` ·
     check: `grep -F 'rebut-lens' skills/war/assets/workflow-template.test.mjs`
  22. `auditEvidenceOf` returns a real landed sha (never "unrecorded") for a merged
     `requiresTest:false` task — fixture titled `evidence-sha` ·
     check: `grep -F 'evidence-sha' skills/war/assets/workflow-template.test.mjs`
  23. A `disposition:'ask'` Minor raised by a gate-audit-family seat parks on `asks[]` (or its lane
     carries an explicit comment + census row like the pinMismatch strip) — never an unrowed sink;
     the polish panel already routes and gains NO second pass; and a parked ask's `sha` carries a
     validated real `audit_sha` (audit-sha sentinel on malformed input, positive-value fixture
     included) — fixtures titled `ask-routing` ·
     check: `grep -F 'ask-routing' skills/war/assets/workflow-template.test.mjs`
  24. On a sanctioned recovery relaunch, worktree-name-shaped `preMerged` ids (`p2-2.1`) skip the
     merged set exactly as bare ids do, and an unmatched id is logged, never silently dropped —
     dialect + garbage fixtures titled `preMerged-dialect` ·
     check: `grep -F 'preMerged-dialect' skills/war/assets/workflow-template.test.mjs`
  25. Every hard-budgeted prompt surface this plan touches (`agents/war-refiner.md`, `CONTEXT.md`,
     `skills/war/SKILL.md`, the `workflow-template.js` prompt-literal share) stays under its hard
     ceiling — an invariant row, green at base by design: the deliverable is that it STAYS green
     after the card eviction + wiring, glossary rows, and prose touches, with no ceiling constant
     raised ·
     check: `node --test skills/war/assets/prompt-surface-budgets.test.mjs`
  26. A worktree-add failure over a held branch names the holding worktree path in its die text
     (`checked out at <path>` via `git worktree list --porcelain`), for both `ensure-worktree` and
     `ensure-refinery-worktree` ·
     check: `grep -F 'checked out at' skills/war/assets/provision-worktrees.sh`
  27. Under `args.recovery.sanctioned`, the provision barrier auto-frees a CLEAN prior-generation
     holder of the SAME plan's refs (detach for `_refinery`, worktree-remove for a workless task
     worktree) — never a dirty holder, never a foreign plan's; a dirty holder still dies loud with
     the holder path named — fixtures titled `recovery-holder` ·
     check: `grep -F 'recovery-holder' skills/war/assets/workflow-template.test.mjs`

## Build order (for /war)

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 (the `workflow-template.js` ladder,
strictly ordered — the file is never split across parallel tasks) → Phase 8 (peripheral floors, fully
parallel, disjoint from the template) → Phase 9 (release, trailing).

## Phase 1 — run.maxParallel pacing knob

### Task 1: Batching helper + threading + tests
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: add a `batched(thunks, n)` helper in the module's helper region (`parallel` is a
  Workflow-sandbox GLOBAL, not defined in the file — there is no `parallel()` definition to sit
  beside) — slice the thunk list into groups of n, awaiting EACH GROUP via the live sandbox
  `parallel(group)`, NEVER `Promise.all`: the live `parallel` NULLS a rejected thunk (the #742
  invariant's mechanism — a group-wide rejection would re-dispatch completed tasks every wave), so
  results return in input order with rejected slots null exactly as today; n absent/null ⇒ delegate
  straight to one `parallel(thunks)` call, byte-identical path. Apply it at all four fan-out sites:
  the seat-roster `parallel(roster.map(...))` and its dropped-seat retry, the per-wave
  `parallel(wave.map(...))`, and the gate-audit `parallel(mergedTasksForGateAudit.map(...))`. Thread
  `run.maxParallel` exactly like `roundLimit` (the hand-mirrored-fallback comment region near
  `const roundLimit`), updating the args-contract header comment in the same commit. In
  `workflow-template.test.mjs`: a deterministic batching unit test (at most N concurrent, group k+1
  after group k settles), a rejecting-thunk row (a rejection inside a throttled group yields a null
  slot, never a group-wide rejection), call-site census rows (each of the four sites dispatches
  through `batched`) — all titled with the literal token `batched` — and a default-path census row
  titled `maxParallel-absent` asserting the absent-knob path takes no batching branch (End states
  1–2's presence-pin tokens: each row greps its token in the suite file, red until the titled
  fixture exists; execution rides this task's Done when and the gate — measured: an unmatched
  `--test-name-pattern` exits 0 on Node 24, so pattern runs were rejected as vacuous). Fold (#1696): while in the suite,
  restore the deleted `// --- Dep-wave visibility (criterion 4) + force-with-lease carve-out ---`
  section banner above its tests — the ask-channel block replaced it instead of inserting above it
  (verified: issue #1696 (2026-08-25)).
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
  non-integer / string, absent-passes — titled with the literal token `maxParallel` (End state 3's
  pattern).
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Operator surfaces for the knob
- Files: `skills/war-room/SKILL.md`, `skills/war/references/design.md`, `skills/red-team/SKILL.md`, `CONTEXT.md`, `skills/war/references/schemas.md`
- Plan slice: `/war-room` gains the `run.maxParallel` override question (default: leave absent);
  `design.md`'s concurrency line names the knob; `/red-team` prose reads the same config fail-open when
  sizing its own fan-out; `schemas.md`'s § Run config block (the enumerated `run: { roundLimit, … }`
  key list) gains `maxParallel` with the same de-mirror treatment — the key named, `war-config.mjs`
  pointed at for shape/default, never restating "integer ≥ 1". CONTEXT.md gains all three of this
  plan's glossary rows in one touch — "Batching helper" (A4), "Budget-Raise trailer", and "Drain
  cause" — the latter two annotated defined-but-not-yet-emitted; produced in Phase 2 (the citation
  floor) and Phase 6 (the drain-cause stamp), so the auditor cross-links the producing phases rather
  than flagging dangling refs. Byte arithmetic (red-team round 1): CONTEXT.md has 2,167 B of headroom
  under its 126,976 B hard ceiling (measured 124,809 B at 0.20.0) — cap the three entries at ≤ 650 B
  each (≤ 1,950 B total); the budget suite runs in the gate and must stay green (End state 25).
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
  merge range, when the diff RAISES any `hard:` or `advisory:` ceiling value in
  `skills/war/assets/prompt-surface-budgets.test.mjs` — a `FILE_BUDGETS` row OR
  `WORKFLOW_LITERAL_BUDGET`, detected default-deny (any `hard:`/`advisory:` value-line change in that
  file, so a future sibling constant is covered without a floor edit) — require a commit trailer of
  the form `Budget-Raise: ADR-0042 <surface> +<bytes>` on a commit in the range — missing ⇒ exit 1
  (the named route, no-test-style), present or no ceiling touch ⇒ exit 0, git error ⇒ exit 2 (never
  collapsing into the floor status). Lowering a constant (ratchet-down) needs no trailer and exits 0.
  Test suite bash-3.2-safe, cwd-independent, with a fail-closed classification census row and fixture
  rows for: uncited FILE_BUDGETS raise (1), uncited WORKFLOW_LITERAL_BUDGET raise (1), trailerless
  ratchet-down (0), cited raise (0).
- Done when: `bash skills/war/assets/assert-budget-raise-cited.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Refiner wiring (standing + dispatched, one commit, byte-funded)
- Files: `agents/war-refiner.md`, `skills/war/assets/workflow-template.js`, `skills/war/references/budget-raise-floor.md`
- Plan slice: wire the new floor into the refiner merge path exactly where the sibling merge floors run
  (`assert-test-in-diff.sh` et al.): `agents/war-refiner.md` standing instructions AND the dispatched
  refiner merge-task prompt build in `workflow-template.js`, in the same commit
  (standing/dispatched-split rule). Exit 1 routes to the no-test-style fix-worker path
  (`budget-uncited` route naming, message pointing at the trailer form and the re-baseline pass); exit 2
  routes to merge-task `status: 'error'`. **Byte funding (red-team round 1 — mandatory):**
  `agents/war-refiner.md` has 68 B of headroom under its 34,816 B hard ceiling (measured 34,748 B at
  0.20.0) — no wiring prose fits without funding, and a ceiling raise is exactly what Task 1's floor
  refuses. Fund it per the card's own ADR 0042 reference-pointer pattern: keep the card's addition to
  a COMPACT floor step (script name + exit routing, sibling-floor shape), and in the same commit evict
  a cold card block byte-identically into the new `skills/war/references/budget-raise-floor.md` behind
  a trigger pointer — the reference file also carries the floor's full branch prose (trailer form,
  re-baseline pointer). Size the eviction to clear the wiring text WITH margin for the Phase 4 and
  Phase 6 card edits (recorded lesson: pointer bytes routinely outrun eviction arithmetic — budget to
  clear, never to break even), and state the measured post-commit size in the commit body. Never a
  ceiling raise (End state 25 pins the surface under its hard ceiling).
- Done when: None — behavior exercised by Task 1's floor suite plus the audit roster's prompt-surface review; the budget suite in the gate pins the byte funding (End state 25)
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

### Task 4: Both-surfaces wiring guard
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: guard Task 2's wiring on BOTH surfaces (red-team round 1 — the standing card half was
  unguarded): add a D3 BOTH-SURFACES DIRECTIVE REGISTRY row with
  `surfaces: [['war-refiner.md', refinerMd], ['merge-task dispatch prompt', mergeP]]` and anchors for
  `assert-budget-raise-cited.sh`, the `Budget-Raise:` trailer form (EXTRACTED from the floor script,
  so card, prompt, and script cannot drift), the exit-1 budget-uncited fix-worker route, and the
  exit-2 error route — following the done-when-floor row precedent — and bump the registry's no-slack
  `REGISTRY.length` floor + its enumeration message in the same task. Rows titled with the literal
  token `budget-raise` (End state 18's pattern). The deps edge onto Task 2 is the guard-split edge
  (war-strategy §3 rule 7); rule 5's same-task form would collide `workflow-template.test.mjs` between
  Task 2 and this task — the deps-edged same-phase split keeps the mirror guarded at phase land.
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
  Fold (#1704): in the recovery-relaunch `preMerged` consumption loop, normalize both id dialects
  before the `tasks.some(t => t.id === id)` match (strip a `p<phase>-` worktree-name prefix), and LOG
  every dropped entry — a `preMerged` id matching no task after normalization is loud, never a silent
  skip-disable (verified: issue #1704 (2026-08-25)).
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
  refused), the vacuous-endstate fixture (zero tasks ran ⇒ never green; titled `vacuous-endstate`,
  End state 10's pattern), and the fold (#1704)
  preMerged-dialect fixtures: `p2-2.1`-shaped ids skip the four merged tasks exactly as bare `2.1`
  ids do, and a garbage id is logged, never silently dropped (titled `preMerged-dialect`, End state
  24's pattern). Also in `skills/war/SKILL.md`: de-mirror the file's own #1413 provenance-floor
  sentence ("names a foreign docs/plans identifier … or carries none of the run's own plan-slug
  tokens"), stale under D6's exemptions — name the floor and point at the template's
  `ownTokens`/`foreignIds` region (or schemas.md's exemption rows) instead of restating the refusal
  contract (red-team round 1). Census grep is a floor:
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
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`
- Plan slice: the standing refiner card's "Land-barrier endstate-check dispatch" steps (byte-verbatim
  `.cmd` write / FULL stdout+stderr tee) mirror the dispatched prompt and are bound by a live
  both-surfaces drift guard — update the card in the SAME commit as the prompt rework
  (standing/dispatched-split rule; the card bytes are funded by Phase 2 Task 2's eviction margin,
  End state 25 pins the ceiling). Rework the land-barrier endstate-check dispatch's per-row
  `cmd-file:` build (the
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
  All titled with the literal token `endstate-transport` (End state 6's pattern).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

## Phase 5 — Filing/consolidation fidelity

### Task 1: Collapse + filing-prompt region
- Files: `skills/war/assets/workflow-template.js`, `skills/war/references/file-followups.md`
- Plan slice: in the follow-up consolidation block (`FOLLOWUP_LINE_WINDOW` / `seatRef`): (D8) widen the
  collapse key with seat discrimination — two rows from the same seat never collapse as corroboration;
  `seatRef` renders seat+task (both when present) while PRESERVING the `'unattributed'` terminal arm
  for seatless, taskless rows (a live contract the Evidence-artifacts clause names verbatim — any
  change to that arm changes the clause in the same commit); a merged-away row's title and rationale
  are preserved onto the surviving row (a `merged[]` sub-list or equivalent) and rendered through the
  filing prompt, the issue-body instruction, handoff `followUps`, and the consolidation log line.
  `skills/war/references/file-followups.md` mirrors the row contract (file/line/`seats` and the
  Evidence-artifacts section) — update it in the same commit (standing/dispatched-split rule).
  0.20.0 adjacency caution: the ask channel (#1550) parks `disposition:'ask'` rows on `asks[]`
  upstream — the collapse and the file-followups dispatch consume `minorsFiled` only; `demote()`'s
  ask refusal, `parkAsk`'s exactly-once contract, and the `asks` handoff key semantics stay intact —
  the two fold items below feed that channel, never rework it. (D9)
  replace the truthiness gate on `m.seats.join` with `Array.isArray(m.seats)` (string `seats` renders
  via the fallback, batch never throws); correct the "runs outside any try" comment to state the real
  try scope; carve `:rebut` out of the Evidence-artifacts lens-extraction clause (the suffix is a
  dispatch label, never the lens); retain the per-task landed sha at `landMerged` for
  `requiresTest:false` tasks so `auditEvidenceOf` never renders "unrecorded" for them.
  Fold (#1692, gate-audit-family lane ONLY): route the gate-audit-family (per-task post-merge,
  integrated-tip, end-state-only) Minor/Nit findings through `dispositionOf` so a
  `disposition:'ask'` parks via `parkAsk` — or, where routing is deliberately withheld, comment +
  census the sink exactly as the pinMismatch strip is (verified: issue #1692 (2026-08-25)). The
  POLISH PANEL is already compliant — `sweepMinors` routes through `dispositionOf`/`parkAsk` on both
  terminal arms at 0.20.0 (red-team round 1): make NO edit there — a second routing pass would
  double-park asks and break `parkAsk`'s exactly-once contract. Fold (#1693): guard `minorsOf`'s
  `sha: s.audit_sha` stamp with a NEW self-contained module-scope validator (declared above
  `minorsOf`) — same regex shape as `isSha`, sentinel `(audit_sha unrecorded/malformed)` — a
  malformed/free-text `audit_sha` becomes that sentinel, never an operator-facing `asks[].sha` pin.
  The existing `pinOrSentinel` is NOT reusable here: it is scoped inside the wave-loop body, its
  sentinel text is `integration_sha`-specific, and the #393 extract-and-eval convention keeps each
  such arrow self-contained (deliberate duplication) — the new validator is a sanctioned sibling
  copy whose drift guard lands deps-edged in Task 2 (verified: issue #1693 (2026-08-25); scope +
  sentinel facts per red-team round 1).
- Done when: None — fixtures land in Task 2 (deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Consolidation fixtures
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: fixture assertions — cross-seat collapse carries merged-away title+rationale through
  prompt/handoff/log; same-seat same-file rows within the window do NOT collapse; `seats[]` carries
  seat+task on a cross-task collapse; a seatless, taskless row still renders `'unattributed'` (titled
  `collapse-fidelity`, End state 7); string-`seats` row renders without throwing (`Array.isArray`
  fixture, titled `string-seats`, End state 8); a `:rebut`-suffixed seat label extracts the true lens
  (drift-row fixture, titled `rebut-lens`, End state 21);
  `auditEvidenceOf` returns a real sha for a `requiresTest:false` merged task (titled `evidence-sha`,
  End state 22). Fold fixtures (titled `ask-routing`, End state 23):
  (#1691) a parked ask from a seat with a real `audit_sha` carries that sha into `asks[]` and
  `handoff.asks[].sha` — a positive-value assertion closing the delete-and-trace gap on the one
  floored field previously asserted only in its null case (verified: issue #1691 (2026-08-25));
  (#1692) a gate-audit-family seat's `disposition:'ask'` Minor reaches `asks[]`; (#1693) a
  ref-expression/free-text `audit_sha` never reaches `asks[].sha` verbatim (the audit-sha sentinel
  renders), plus the sibling-copy drift row: extract the new audit-sha validator's arrow and `isSha`'s
  regex source and assert regex equality (the sanctioned copy cannot drift — the guard-split edge
  onto Task 1 is this task's `deps`).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

### Task 3: schemas.md minorsFiled qualifier
- Files: `skills/war/references/schemas.md`
- Plan slice: qualify the `minorsFiled` collapse description — both the "**Consolidation precedes
  filing.**" bullet and the `minorsFiled` field-comment row (the file was reworked by the landed
  ask-disposition campaign; anchor by those constructs) — as conditional on handoff-emitting
  decisions (`landed` / `held:escalation`) (#1597), pointing at the canonical collapse block in the
  template (de-mirror).
- Done when: None — doc-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: ADR 0013 amendment
- Files: `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- Plan slice: append an amendment section ratifying the landed N:1 clustered filing +
  dedup-as-corroboration-comment behavior, superseding Decision 4's per-finding "`follow-up` (files
  the issue)" description (A9 — filename corrected from the spec). The ADR already carries a
  2026-08-25 ask-disposition amendment (fourth `disposition` member) — append after it; this
  amendment is about filing shape only and leaves the ask amendment byte-untouched.
- Done when: None — ADR-only
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 6 — Land-path + phase-close robustness

### Task 1: Segmented land, filing-on-held, dispatch classification
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`, `skills/war/SKILL.md`, `skills/war/references/schemas.md`
- Plan slice: (a) the land dispatch survives a gate outrunning the tool timeout by returning an
  IN-BAND segmented-land marker — a field on the land-phase result, never a new status enum member —
  with a bounded re-dispatch following the FLOOR_STATUSES retry-loop idiom, the engine's real
  merge-task re-dispatch shape (A6 REVISED — red-team round 1 falsified the spec's "INCOMPLETE
  re-dispatch shape"; the land dispatch has no retry loop today, so this is new wiring following that
  existing idiom, `land-decision.mjs` untouched). The refiner card's land-phase Return contract line
  changes in the same commit (standing/dispatched-split rule; bytes funded by Phase 2 Task 2's
  eviction margin). CONTINGENCY (pre-authorized, `KNOWN_LAND_DECISIONS` only): if implementation
  proves a new land-decision member unavoidable, the canonical export in `land-decision.mjs`, its
  in-file pins, AND the four doc-parity surfaces (`skills/war/SKILL.md` ×2, `skills/war/references/schemas.md`
  ×2 — the enum's real drift-guard set; the template has NO inline `KNOWN_LAND_DECISIONS` copy)
  change together in this task's single commit — those files are in Files for that contingency alone.
  A new MERGE_RESULT status member is OUTSIDE the pre-authorization (its verbatim pin lives in Task
  2's file): that path halts the phase for a re-plan. (b) on `held:land-failed`, the
  follow-up filing dispatch still runs (or the handoff carries an explicit unfiled-followups block the
  Lead executes) — never silently unrun. (c) route ALL bare `agent(...)` dispatch sites through
  `dispatchAgent` so their deaths classify env-died soft per the existing #1411 class:
  `provisionStep`'s dispatch, the polish-worktree provision dispatch, and the sweep dispatch (the
  latter two are separate bare call sites outside `provisionStep` — red-team round 1); (d)
  when a phase-close polish dispatch dies, stamp every demoted finding with a drain cause (which
  dispatch died, why demoted) instead of the flat untriaged dump. (e) Fold (#1712 fix 3): under
  `args.recovery.sanctioned`, the provision-barrier prompt instructs the refiner to enumerate holders
  (`git worktree list --porcelain`) for every ref the relaunch checks out and auto-free a CLEAN
  prior-generation holder of the SAME plan's refs only (detach for `_refinery`, `worktree remove` for
  a workless task worktree — plain git verbs, no new script flag) — never a dirty holder, never a
  foreign plan's; a dirty holder still dies loud with the holder path named (verified: issue #1712
  (2026-08-25)).
- Done when: None — fixtures land in Task 2 (deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Classification + drain-cause fixtures
- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: fixtures — provision-barrier, `provisionStep`, polish-worktree, and sweep dispatch
  deaths each classify env-died soft (titled `drain-cause`, End state 9); polish-dispatch death stamps
  drain cause on each demoted finding (same token); `held:land-failed` still produces the filing
  dispatch (or the explicit handoff block) (titled `filing-on-held`, End state 20); the in-band
  segmented-land marker round-trips its bounded re-dispatch (FLOOR_STATUSES idiom) with NO enum
  widening — the `KNOWN_LAND_DECISIONS` doc-parity rows and the verbatim MERGE_RESULT status pin in
  this file stay green (titled `segmented-land`, End state 19); fold (#1712 fix 3) fixtures: a
  sanctioned relaunch against a clean same-plan prior-generation holder provisions without Lead
  intervention, a dirty holder dies loud with the holder path named, a foreign-plan holder is never
  freed (titled `recovery-holder`, End state 27).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

### Task 3: Recovery docs
- Files: `skills/war/references/resume-and-recovery.md`
- Plan slice: document the in-band segmented-land marker and the filing-on-held behavior in the
  recovery doctrine — pointing at the template's land-decision arms for the authoritative status set
  (de-mirror; never restating the enum members as a list). Fold (#1712 fix 2): the Recovery-relaunch
  shared mechanics gain the mechanical pre-launch ref-holder enumeration step — for EVERY ref the
  relaunch will check out (integration branch, each task branch, the polish branch, the working
  branch), look up its holder via `git worktree list --porcelain` and verify it reads FREE before
  launch; clean prior-generation holders are freed (detach for `_refinery`, `worktree remove` for
  workless task worktrees), dirty ones adjudicated per the existing never-lose rule — one-at-a-time
  discovery is the recorded failure shape (r2/r3) (verified: issue #1712 (2026-08-25)).
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
  reserve-exhausted branch logging why the ladder stopped. Fold (#1694): route `minorsOf(reSeats)`
  on the ace-regression branch and `subSeats`' own Minor/Nits on the failing-subset arm through the
  disposition ladder (ask → `parkAsk`, follow-up → `minorsFiled`, note → `notes`), mirroring the
  approved arms — an ask raised on either arm parks, never drops (verified: issue #1694
  (2026-08-25)).
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
  assertions for the exact-equality and final-paragraph mandates — all titled with the literal token
  `ace-trailer` (End state 11's pattern). Fold fixtures (#1694): an ask
  raised by the ace-regression round parks on `asks[]`, and an ask raised by a failing bisection
  subset's re-audit parks on `asks[]` — neither drops.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1]
- target repo: superproject

## Phase 8 — Peripheral floors (file-disjoint, fully parallel)

### Task 1: provision-worktrees reuse hygiene
- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: close the four `reuse_hygiene` gaps (#1476), each FIXED with its own test row (titled
  with the literal token `reuse-gap`, End state 16's pin): porcelain read gains
  `--untracked-files=all`; the deliberate-git-rm ambiguity is disambiguated (staged-deletion shape
  exempted) — the documented-accepted branch is taken ONLY if disambiguation proves infeasible, and
  then the header-documentation text gets its own asserting test row (never a prose-only waiver);
  SIGPIPE from the porcelain pipeline classifies as env error, never a hygiene finding;
  `cmd_ensure_refinery_worktree` gains the same hygiene arm (a header-note exemption follows the same
  only-if-infeasible + asserted-header rule). Fail-open
  discipline unchanged — never a die, never a non-zero return on the reuse path. Fold (#1712 fix 1):
  on a worktree-add failure over an existing branch, look up the holder via
  `git worktree list --porcelain` and append `checked out at <path>` to the die text, for BOTH
  `ensure-worktree` and `ensure-refinery-worktree` (End state 26); test rows for both die texts.
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
  flag per key refused, valid values still recorded — titled with the literal token `bare-flag`
  (End state 12's pattern).
- Done when: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: auditor-guard deny-message classification
- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`
- Plan slice: classify the `residue` BEFORE composing the deny message — chain/control operators
  (`&&`, `;`, `|`, newline continuations) name the one-command-per-call rule; glob/expansion
  metacharacters name the metacharacter rule; the #1421(b) ergonomics guidance (split chains into
  separate calls; use Read/Grep/Glob instead of shell/git grep) — ALREADY present in today's single
  unconditional deny message (#1412 fix 1) — is retained on the chain-operator branch where the
  186-denial churn actually occurred. Message-only: allowlist, decision,
  and exit codes byte-unchanged (binding guardrail). Test rows: chain-operator denial names its rule,
  glob denial names its rule, allow path untouched — case names carry the literal token
  `chain-operator` (End state 13's presence pin).
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
  Stubbed-gh test case for the degraded path plus the modern path unchanged — case names carry the
  literal token `gh-degraded` (End state 14's presence pin).
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
  unchanged; exit 0/1/2 classification census row stays green — new case names carry the literal
  token `prefix-covered` (End state 15's presence pin). Read duty: the distinguishing-prefix
  precedent is `skills/red-team/assets/assert-no-repo-escape.sh`/`.test.sh` case 28 — read it before
  implementing (Evidence-consumed roll-up).
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
  campaign's phases landed on, which stacks on the live master at/above the landed 0.20.0
  ask-disposition release (master 40afddb — A8 resolved).
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
- Fold batch (operator-ratified scope additions, 2026-08-25 volley): seven war-followup issues
  folded in per the refresh assessment — #1691 (P5 Task 2
  positive-value sha fixture), #1692 (P5 Tasks 1–2 + End state 23: gate-audit-family dispositions
  route through `dispositionOf`, ask parks via `parkAsk` — narrowed to that lane after red-team
  round 1 proved the polish panel already routes), #1693 (P5 Task 1
  audit-sha copy-site guard on `minorsOf` + fixture — additive to, not the same root cause
  as, #1480's own-token floor), #1694 (P7 Tasks 1–2: ace-regression + failing-subset arms route
  through the disposition ladder), #1696 (P1 Task 1 test-section banner restoration), #1704 (P3
  Tasks 1–2 + End state 24: `preMerged` id-dialect normalization + loud drop-logging), #1712
  (operator-ratified 2026-08-25: recovery-relaunch ref-holder hygiene, all three fixes — fix 1 die
  text names the holder, P8 Task 1 + End state 26; fix 2 pre-launch ref-holder enumeration step, P6
  Task 3; fix 3 sanctioned auto-free of clean same-plan holders, P6 Tasks 1–2 + End state 27).
  End-state numbering is append-only (23–27); #1708 was assessed and NOT folded here — it is owned
  by (folded into) the doc-truth / contracts-pin plan, not left unowned.
- Every retirement/absence grep any task emits (Phase 3 Task 2's census grep and SKILL.md
  provenance-sentence de-mirror; Phase 5 Task 1's "outside any try" comment correction; Phase 5
  Task 4's ADR 0013 supersession — the ADR is append-only, so its old 1:1 filing prose is superseded
  by the appended amendment, never grepped out) is a completeness floor only: after the grep,
  hand-scan the target file's same-scope tests and comments and list each straggler as a
  survey-derived correction — case-insensitively, since sentence-initial capitalization evades
  case-sensitive greps (spec §8).
- ADJUDICATION (red-team round 1, D11/A6): the DECISION — in-band segmented-land marker, no enum
  widening, `KNOWN_LAND_DECISIONS` contingency pre-authorized in one commit — remains
  operator-ratified (2026-08-25, interactive volley). Its ANCHOR was re-based AI-declared after the
  red-team gate falsified the ratification's premise (no "merge-task INCOMPLETE re-dispatch shape"
  exists anywhere in the engine; `held:phase-incomplete` is a Lead-side-only land decision): the
  marker now follows the FLOOR_STATUSES retry-loop idiom, the engine's real bounded re-dispatch
  shape, and the contingency's Files were completed with the enum's actual drift-guard set (the four
  doc-parity surfaces). A new MERGE_RESULT status member stays outside the pre-authorization.
- End-state check discrimination (red-team round 1): suite-invoking End states were re-scoped so
  each is red at base — every such row is a `grep -F '<token>'` presence pin on the owning suite
  file (the matched line is the printed decisive token; the owning task titles its new
  fixtures/cases with the row's literal token, and each token was verified absent at base), with
  execution riding the task's Done when + the gate. The gate's suggested
  `--test-name-pattern` form was measured VACUOUS and rejected: an unmatched pattern exits 0 on
  Node 24.17, contrary to the finding's claim. End states 17 and 25 are disclosed invariant rows
  (green at base by design), each with its compensating catch stated inline.

## Open decisions

None — the four conversion-time forks are settled. D11 (in-band segmented-land marker — anchor
re-based on the FLOOR_STATUSES retry-loop idiom after red-team round 1, see the Notes adjudication
row; enum contingency pre-authorized in Phase 6 Task 1's single commit), #1560 (exact-value trailer
equality), and #1562 (reserve 2 slots) are operator-ratified (2026-08-25, interactive volley); D6's
no-residual stance is self-decided and recorded as a conscious deviation under Notes.
