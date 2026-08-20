# Raise the realized absorb rate — ace bisection, touched-doc drift guards, source-derivable eligibility, cross-seat consolidation (#1547 items 1–4)

Authored by `/war-strategy` (with-artifact conversion of issue #1547, items 1–4; item 5 deferred per the
issue's own ranking). Interview transcript decisions are tagged `(user)`; code facts were verified at base
`ff1b85e` and re-verified by `/red-team` sandbox probes at `f22686b`.

## Context — the gap / problem

In a recent two-phase campaign ~70% of Minor/Nit findings were disposed `absorb` but only ~15% landed —
the rest demoted to `war-followup` issues through two mechanical failure modes plus a doc-rot class with
no lawful in-phase repair lane (verified: issue #1547 (2026-08-19)). The structural diagnosis: ADR 0013
makes `absorb` the narrowest, most fragile channel while `follow-up` costs the auditor nothing
(verified: issue #1547 (2026-08-19)).

The engine facts behind each failure mode, verified at `ff1b85e`:

- **Whole-batch demotion.** On an ace re-audit regression the engine sets `r.aceReverted = aceSha` and
  demotes the entire `aceable` list in one loop — `for (const f of aceable) demote(f, 'follow-up', …)` —
  with no per-finding attribution (verified: `workflow-template.js` approve-branch regression arm at
  `ff1b85e`). The forward-revert is a prompt clause on the merge dispatch, safe only because "aceSha is
  the single ace commit = the task-branch TIP at revert time, so its revert is the clean inverse of HEAD
  and cannot conflict" (verified: `aceRevertClause` comment in `workflow-template.js` at `ff1b85e`).
- **Budget shape.** `const roundLimit = run.roundLimit ?? 3`; the ace charges exactly one `fixRounds`
  slot; `auditRound` panels are unmetered by `roundLimit` (verified: `workflow-template.js` ace block +
  `fixRounds` sites at `ff1b85e`). No drift guard binds the `?? 3` fallback to
  `DEFAULTS.run.roundLimit` — `workflow-template.test.mjs` exercises `roundLimit` only behaviorally with
  explicit overrides, and `war-config.test.mjs` never reads the fallback (verified: red-team sandbox
  grep of both suites at `f22686b`).
- **Per-seat litter.** `minorsFiled` receives seat findings verbatim with no cross-seat dedup
  (`minorsOf(seats)` flattens `seats.flatMap(…)`); the file-followups dispatch dedups only against open
  issues, by exact title, from a snapshot taken once before the batch (verified: FILE-FOLLOWUPS DISPATCH
  banner in `workflow-template.js` at `ff1b85e`). Observed cost: the same finding filed 3× and one gap
  filed 6× by different seats under different wording — #453/#455/#457 and #430/#440/#446 among them
  (user). Findings already carry an optional `line: { type: 'number' }` in `AUDIT_VERDICT`, so a
  proximity key needs no schema change (verified: `AUDIT_VERDICT` finding schema at `ff1b85e`).
- **Doc-rot lane.** Every in-phase repair lane for pre-existing rot in a touched doc is closed by rule
  (fix-round = blockers only; ace = auditor ruled non-mechanical; polish sweep = `phaseClose` absorbs
  only; next-phase fold-in = no next phase in a final phase) (verified: issue #1547 (2026-08-19),
  corroborated by the recorded lessons
  [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and
  [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]]).
- **Doctrine homes.** ADR 0013's body pins the routing ladder, not attempt counts — nothing in its
  ratified prose is falsified by bisection; the house convention is append-an-amendment, body
  byte-unchanged (verified: `docs/adr/0013-commanders-intent-and-disposition-routing.md` at `ff1b85e`).
  ADR 0025's forcing functions are all keyed to facts the plan creates or flips, never to docs the plan
  merely touches (verified: `docs/adr/0025-drift-guard-discipline.md` at `ff1b85e`). The operative absorb
  eligibility adjectives ("mechanical, self-contained, single-file, non-load-bearing") live on the
  standing auditor card only, and ADR 0013's 2026-07-10 addendum ratifies standing-card-only placement
  for lens-calibration clauses (verified: `agents/war-auditor.md` absorb block + ADR 0013 addendum at
  `ff1b85e`).
- **Issue #1547's "tier-name-sweep pattern" does not exist under that name** — no in-repo construct
  matches; the real doc-value drift-test exemplars are `version-slots.test.mjs` (README `## Status`
  re-derived from `plugin.json`) and `war-config.test.mjs`'s agent-card-frontmatter guard (verified:
  repo-wide grep at `ff1b85e`).
- **The corroboration idiom to lift**: the retired-token sweep's dedup clause — "an open retired-token
  issue naming the same mechanism gets this phase's hits as a comment, never a duplicate" (verified:
  `skills/war/SKILL.md` § Retired-token sweep at `ff1b85e`).

## Pivotal constraints

- The Workflow sandbox cannot `import` — `workflow-template.js` constants are hand-mirrored; items 1 and
  4 both rewrite `workflow-template.js` + its test, so they occupy **separate phases**, never same-phase
  tasks (verified: CLAUDE.md execution architecture at `ff1b85e`).
- **ADR 0042 byte ceilings — `prompt-surface-budgets.test.mjs` is the live arbiter.** Every budgeted
  surface this plan edits is re-measured at task base (the war-strategy D12 staleness rule), and the
  HARD ceilings bind at every gate. The two tightest at `f22686b`: the prompt-literal share of
  `workflow-template.js` (`WORKFLOW_LITERAL_BUDGET`: 61,920 B against 62,464 hard — **544 B** of
  headroom) and `agents/war-refiner.md` (34,773 B against 34,816 hard — **43 B**) (verified: red-team
  sandbox suite run + `wc -c` at `f22686b`; dated snapshots). Additions to budgeted surfaces are
  **compression-funded in the same task**; a budget **raise** is lawful only with the commit body citing
  ADR 0042's justification rule, and such a raise is not a floor violation.
  `skills/war-strategy/SKILL.md` and `skills/red-team/SKILL.md` are unbudgeted.
- The DISPOSITION RULE sentences are byte-compared across `agents/war-auditor.md` and `auditPrompt()`
  (verified: the DISPO byte-compare test in `workflow-template.test.mjs` at `ff1b85e`) — this plan leaves
  them byte-untouched.
- ADR bodies are byte-unchanged; changes append as amendments (verified: ADR 0013 amendment convention at
  `ff1b85e`).
- Enum discipline: no new `MERGE_RESULT.status` member, no new `HARD_ESCALATION_REASONS` member (ADR
  0005; the existing no-enum-leak test pins this).
- The ace path never turns a mergeable task into a hold or escalation; Critical/Major blocking, the
  never-rewrite discipline, and the forward-revert contract are untouched (user; issue #1547 non-goals).

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Bisection sequencing | subsets apply serially at the tip; each failed subset is forward-reverted at the tip before the next subset commits — the revert-at-tip invariant is preserved verbatim; the bisection loop owns in-loop reverts, and the merge dispatch's revert clause fires only for a final failed tip not yet reverted in-loop (no sha is ever reverted twice) | (user) |
| D2 | Regression recovery order | **culprit-first**: named culprits are excised and the remainder re-applies as ONE subset; blind halving only on ambiguous attribution; depth cap = hard constant 2, no `run.*` knob | (user) |
| D3 | Subset partition | findings touching the same file never split across subsets | (user) |
| D4 | Budget arithmetic | batch ace charges one `fixRounds` slot exactly as today; each additional subset commit charges one more; the revert itself is uncharged; exhaustion mid-bisection demotes the remaining subsets to follow-up **by design**; panels stay unmetered | (user) |
| D5 | `run.roundLimit` default | flips 3 → 6, a full default-flip with OLD-absent duty. The knob is the repo's single shared retry bound ("one knob, one mental model"), so all four bounded loops move: **fix rounds + the no-test sub-loop** — where 6 was priced: it funds the single-failing-branch bisection path (culprit-first excision, or one regressing half through depth 2); a both-halves-regress ladder is pathological (≥2 independent regressors in a pre-screened mechanical batch + failed culprit attribution + split-straddling), exhausts at 6, and demotes the remainder **by design** — a twice-regressed batch has empirically refuted its own absorb disposition, and item 4's consolidation floor files that remainder as one clustered issue; **reland-CAS** — benefits: idempotent contention retries in a multi-session environment; **phase-resume** — neutral: the knob governs transient-cleared deaths only; the outage-ongoing case stays governed by the don't-resume-into-a-live-outage doctrine. Documented side effect: an ordinary stuck task burns up to 6 audited rounds before escalating. The economy preset's explicit 2 is untouched; the sibling knob `run.redteamRoundLimit` (default 3) is out of scope and stays 3 | (user) |
| D6 | Resume idempotency | every subset commit carries a deterministic machine-checkable trailer keyed `Ace-Subset:` (value shape after the key is latitude); each subset dispatch preflights the **bisection range** for the trailer — never the tip alone, so a reverted subset's trailer still matches and a failed subset is never re-committed after a mid-sequence death — before committing; dead-attempt dirt gets a worktree-local discard of uncommitted changes, never any shared ref; engine-side progress markers rejected on ADR 0008 grounds (git is resume truth) | (user) |
| D7 | Consolidation layers | (a) engine-side deterministic collapse before the filing dispatch — key = same file + line-window, title-fallback only when `line` is absent — merged rows carry `seats[]` corroboration; (b) the filing dispatch clusters remaining candidates by file + root cause, one issue per cluster (the rendered candidate rows carry each finding's `file` and `line` so file-clustering is possible) | (user) |
| D8 | Third dedup surface | an open `war-followup` match receives this batch's finding as a **corroboration comment**, never a new issue — the retired-token sweep's dedup idiom lifted verbatim | (user) |
| D9 | Clustering floor | the filing dispatch returns a `clusters[]` manifest — every ordinal in exactly one cluster; clustering may only **merge** engine clusters, never split; issues filed ≤ post-collapse rows — engine-asserted | (user) |
| D10 | Item-2 home | authoring rule 8 in war-strategy §3 + falsifier bullet + decisive-slots row in `plan-interview.md`; a 4th drift-guard spine probe on both red-team prose surfaces; an ADR 0025 amendment; NO auditor-lens duty (a duty without a repair lane regenerates discover-but-can't-fix litter) | (user) |
| D11 | Decompose backstop | one ADR 0042-shaped pointer-line bullet in `/war`'s decompose step; the full trichotomy text lives at `skills/war/references/touched-doc-accuracy.md` (name pinned so End state 9 stays checkable; its outbound links are swept by `reference-link-integrity.test.mjs`'s directory scan — the sweep covers links, never existence, so End state 9 greps the file's own content) — decompose is the only chokepoint every run passes through, and mid-run slice fold-ins never re-enter plan-authoring | (user) |
| D12r | "Source-derivable" scope | derivable from a **machine-readable in-repo source** (config/manifest/enum/version slot), never prose claims generally; the "explicitly defer" arm must be a legitimacy-complete backstop row (named runner + timing), never a bare defer | (user) |
| D13 | Item-3 surface | one clarifying passage appended to the `disposition:'absorb'` block in `agents/war-auditor.md` ONLY (lens-calibration carve-out; mirrored DISPOSITION RULE sentences byte-untouched), containing the write-footprint clause verbatim; a presence guard pins a stable mid-sentence token of the passage, hosted in `skill-doc-contracts.test.mjs` | (user) |
| D14r | Ratification | ONE amendment appended to ADR 0013 covering bisection semantics + eligibility clarification, explicitly naming the roundLimit 3→6 flip; a one-line cross-reference amendment on ADR 0012; the ADR 0025 amendment for item 2; **no new ADR number** | (user) |
| D15 | Shape | one merged plan, four phases (bisection → consolidation → doctrine → release); doctrine-first rejected (ADRs ratify landed mechanics; riskiest phase lands first); roadmap rejected (one subsystem, ~9 tasks) | (user) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Journal replay + the `Ace-Subset:` bisection-range preflight suffice for mid-bisection resume; a death between a subset commit and its journal write can still duplicate, and the re-audit panel + forward-revert bound the damage | interview (user); recon of resume semantics at `ff1b85e` | a resumed phase duplicates one subset commit; caught by the panel, reverted at tip | backstop row 1 |
| A2 | [assumed: the roundLimit-literal census in Task 1.2 (verified at `f22686b`) stays complete at task base — if wrong: a stale "3" survives outside the OLD-absent assert's scope] | red-team census at `f22686b`; grep is a floor | one stale doc literal | T1.2's base-time re-enumeration + mandated same-scope manual survey |
| A3 | [assumed: seats populate `finding.line` often enough for the line-window key to bite — if wrong: the title fallback dominates and paraphrase dupes persist] | `line` is optional in `AUDIT_VERDICT` (verified at `ff1b85e`) | consolidation under-delivers; litter rate stays high | backstop row 3 |
| A4 | 6 slots fund the dominant bisection path (1 fix round + batch + 2 halves + 2 quarters along a single failing branch); a both-halves-regress ladder needs 8, exhausts at 6, and demotes the remainder by design | (user) | pathological double-regression batches truncate — accepted; the 6→8 raise is data-priced (backstop row 1) | End state 1's exhaustion-demotes test |
| A5 | [assumed: additions to budgeted surfaces are compression-funded within the HARD ceilings, suite-arbitered at task base — if wrong: the task takes the lawful fallback, an ADR 0042-cited budget raise in the commit body] | red-team sandbox suite run at `f22686b` | a red `prompt-surface-budgets` test at merge, or an ADR-cited raise commit | gate (the suite is a gate member) |

## Non-goals / deferred

- **Item 5 (`ask` disposition at the audit→merge boundary): deferred — a committed follow-on per #1547,
  tracked as #1550, not rejected** (the issue ranks it last deliberately; with items 1–3 landed most of
  what would be worth asking mid-phase becomes mechanical absorb work).
- **Bisection of the phase-close sweep's discard arm: deferred — tracked as #1549, not rejected.** The
  sweep queue is bounded by construction (`phaseClose`-routed and release-slot-adjacent findings only),
  the sweep runs at phase close with the land pending (subset re-audits there cost land latency), and
  the motivating campaign's sweep losses were infrastructure deaths, not regression discards. Activation
  is data-priced: `/war-review` trailer evidence of an actual sweep-discard loss.
- Zero follow-up issues — design decisions **should** route as issues; the goal is issues that carry
  decisions rather than typing (verified: issue #1547 (2026-08-19)).
- Any change to Critical/Major blocking, the never-rewrite discipline, or the forward-revert contract.
- An auditor-lens touched-doc duty (rejected — D10).
- Engine-side fuzzy/semantic matching (rejected as non-deterministic — D7).
- A new ADR number (D14r).
- Implementing the realized-vs-intended absorb-rate metric — it feeds #1492 (backstop row 2).

## New domain terms · Recommended ADRs

- **Ace bisection** — the regression-recovery ladder on a failed ace batch: culprit-first excision, then
  bounded serial subset re-application (depth ≤ 2), only finally-failing subsets demoting.
- **Ace-Subset trailer** — the deterministic commit trailer (`Ace-Subset:` key) that makes subset commits
  machine-checkable for resume preflights and `/war-review`.
- **Touched-doc accuracy duty** — the authoring trichotomy: a task whose slice rewrites a doc picks
  guard / de-mirror / explicitly-defer for every machine-source-derivable fact it renders authoritative.

Recommended ADRs: none new — amendments to ADR 0012, ADR 0013, and ADR 0025 (D14r). The two Phase-1
terms land in `CONTEXT.md` via Task 1.3; the Phase-3 term via Task 3.1.

## Commander's Intent

- **Purpose:** findings WAR itself rules absorbable land in-phase — the realized absorb rate approaches
  the intended rate — and what still routes out arrives as one decision-carrying issue per root cause,
  never litter.
- **Method:** make absorb cheap to be wrong about on the per-task ace path (culprit-first excision, then
  bounded bisection, salvaging the good majority on regression); give touched-doc facts a lawful
  in-phase repair lane (guard / de-mirror / defer at authoring, red-team-enforced, decompose pointer
  backstop); reclassify machine-source-derivable doc facts as mechanical on the standing auditor card;
  consolidate cross-seat duplicates before filing (deterministic collapse + clustered filing +
  corroboration comments).
- **Mechanism latitude:** the culprit-attribution parsing shape in the regression re-audit prompt; the
  subset partition/halving order beyond the same-file rule; the trailer's value shape after the
  `Ace-Subset:` key; the preflight's exact git invocation (the bisection-range scan is the floor); the
  title-normalization function and the line-window size for the collapse key's fallback and window; the
  `clusters[]` assertion's fail-open log wording; the trichotomy references file's prose; the
  presence-guard token choice; demotion-reason string wording; the fallback drift-guard's extraction
  regex shape — substituting any of these mechanisms while the End states and binding guardrails hold is
  not a plan deviation and warrants no issue.
- **Binding guardrails:** forward-revert only, and only ever of the current tip — never history rewrite,
  never `reset --hard` on task branches (a worktree-local discard of uncommitted dead-attempt dirt is the
  sole exception, never any shared ref) · **culprit-first ordering**: named culprits are excised and the
  remainder re-applied as ONE subset before any blind bisection, which is reserved for ambiguous
  attribution · the ratified budget arithmetic: batch = 1 slot, +1 per subset commit, revert uncharged,
  demote-on-exhaustion, depth cap 2, same-file findings never split · **the collapse key structure**:
  same file + line-window primary, title fallback only when `line` is absent · **the resume idempotency
  contract**: every subset commit carries the `Ace-Subset:`-keyed trailer and each subset dispatch
  preflights the bisection range for it (never the tip alone) before committing · the ace path never
  turns a mergeable task into a hold or escalation, and Critical/Major blocking is untouched · the
  filing floor: issues filed ≤ post-collapse rows, every ordinal in exactly one cluster, clustering
  merges only, an open-issue match gets a corroboration comment and never a new issue · the mirrored
  DISPOSITION RULE sentences and all ADR bodies stay byte-untouched (amendments append) · prompt-surface
  HARD byte ceilings hold at every gate — a raise is lawful only via ADR 0042's justification rule cited
  in the commit body, and such a lawful raise is not a floor violation · no new `run.*` knob · no new
  `MERGE_RESULT.status` or `HARD_ESCALATION_REASONS` member · `roundLimit` lands at exactly 6 with the
  OLD-absent duty discharged. The latitude clause never waives a check, gate, or backstop (ADR 0017).
- **End state:**
  1. On an ace re-audit regression the engine excises named culprits and re-applies the remainder as one
     subset, blind-halves only on ambiguous attribution, applies subsets serially at the tip with depth
     ≤ 2, never splits same-file findings across subsets, demotes only finally-failing subsets, and
     demotes the remainder on budget exhaustion ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  2. Every subset-commit dispatch prompt mandates the `Ace-Subset:`-keyed trailer and a bisection-range
     preflight for it (never tip-only), with the dead-attempt dirt clause worktree-local only ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  3. `DEFAULTS.run.roundLimit === 6`, a drift-guard row binds `workflow-template.js`'s fallback literal
     to it by extraction + equality, and the old default literal is absent across the enumerated
     surfaces · check: `node --test skills/war/assets/war-config.test.mjs`
  4. `minorsFiled` rows collapse pre-filing on the file + line-window key (title fallback iff `line`
     absent) into rows carrying `seats[]` corroboration; the filing return carries a `clusters[]`
     manifest the engine asserts (every ordinal exactly once, merge-only, issues ≤ post-collapse rows);
     an open `war-followup` match routes as a corroboration comment, never a new issue ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  5. war-strategy §3 carries authoring rule 8 (guard / de-mirror / defer, machine-readable-source scope)
     and `plan-interview.md` carries the falsifier bullet + decisive-slots row ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh`
  6. `/red-team` carries the 4th drift-guard spine probe (touched-doc-fact-coverage — Lead-run, never a
     `SPINE` array member) on both prose surfaces, with the probe-count three→four flip landing via the
     scaffold test's OLD/NEW count-pin update ·
     check: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
  7. war-strategy's authoring-rule count flip (three→four) lands with the retired-count OLD-absent arms
     extended in `war-pipeline-structure.test.sh` (the existing `two authoring` / `two drift-guard`
     precedent, extended with the `three …` forms) ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh`
  8. `/war`'s decompose step carries the ADR 0042-shaped pointer bullet naming the touched-doc duty ·
     check: `grep -qi 'touched-doc' skills/war/SKILL.md`
  9. The trichotomy text lives at `skills/war/references/touched-doc-accuracy.md` and carries the
     guard / de-mirror / defer trichotomy ·
     check: `grep -qi 'de-mirror' skills/war/references/touched-doc-accuracy.md`
  10. `agents/war-auditor.md`'s absorb block carries the source-derivable clarification with the
      write-footprint clause, presence-guarded by a stable token in `skill-doc-contracts.test.mjs` ·
      check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  11. ADR 0013 carries the appended amendment ratifying bisection + eligibility and explicitly naming the
      roundLimit 3→6 flip, body byte-unchanged ·
      check: `grep -qi 'bisection' docs/adr/0013-commanders-intent-and-disposition-routing.md`
  12. ADR 0012 carries the one-line cross-reference to the 0013 amendment ·
      check: `grep -qi 'regression-recovery' docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md`
  13. ADR 0025 carries the appended touched-doc scope-widening amendment ·
      check: `grep -qi 'touched-doc' docs/adr/0025-drift-guard-discipline.md`
  14. The four release slots sit lock-step at the next free patch above the live base ·
      check: `node --test skills/war/assets/version-slots.test.mjs`
  15. The full self-discovery suite is green at the landed tip · gate: `resolveGate` (`war-config.mjs`)
      self-discovery suite.

## Build order (for /war)

Phase 1 (ace bisection) → Phase 2 (filing consolidation) → Phase 3 (doctrine) → Phase 4 (release).
Strict order: phases 1 and 2 both rewrite `workflow-template.js` (phase edge, never same-phase tasks);
phase 3's ADR amendments ratify mechanics landed in phases 1–2.

## Phase 1 — Ace bisection (culprit-first, budget, trailer)

### Task 1.1: Engine rewrite + tests + fallback flip
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: rewrite the ace regression arm to the interview-ratified semantics **verbatim**:
  culprit-first excision (named culprits out, remainder re-applied as ONE subset; blind halving only on
  ambiguous attribution), serial subset application at the tip, hard depth cap 2, same-file findings
  never split across subsets, batch charges one `fixRounds` slot / each additional subset commit charges
  one more / the revert uncharged, budget exhaustion mid-bisection demotes the remaining subsets to
  follow-up (logged, by design), only finally-failing subsets demote. **The bisection loop owns in-loop
  forward-reverts**: each failed subset is reverted at the tip before the next subset commits (which
  dispatch performs the revert is implementer's choice), and the `r.aceReverted` / `aceRevertClause`
  semantics are reworked to match — the merge dispatch's revert clause fires only for a final failed tip
  not yet reverted in-loop; the merge always runs on a tip whose failed subsets are already reverted,
  and no sha is ever reverted twice. Subset dispatch prompts mandate the `Ace-Subset:`-keyed
  deterministic trailer (value shape latitude), open with the **bisection-range preflight** for that
  trailer (scan the range since the pre-batch base — exact invocation latitude, never tip-only — and
  return the existing sha without committing on a hit), and carry the dead-attempt dirt clause
  (worktree-local discard of uncommitted changes only, never any shared ref). Subset labels stay
  distinct and round-encoded (extend the existing `ace:<task>:r<n>` scheme). Flip the hand-mirrored
  fallback `run.roundLimit ?? 3` → `?? 6` in the same file. **Byte duty:** net prompt-literal growth
  stays within `WORKFLOW_LITERAL_BUDGET`'s hard ceiling (544 B headroom at `f22686b`), funded by
  compressing existing prompt literals in this file in this task — compression edits are **semantic
  diffs** the panel reviews as meaning-preserving, the correctness seat explicitly owning what
  compression dropped; the ADR 0042-cited budget raise is the lawful fallback. Replace the pinned
  single-attempt tests with bisection-semantics tests (happy path byte-identical to today: one commit,
  one re-audit); keep the no-enum-leak and never-blocks-a-land tests green. The happy-path ace dispatch,
  `aced[]`/`minorsFiled` return shapes, and `handoff.absorbed` grouping are unchanged.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: roundLimit default flip + fallback drift guard + OLD-absent
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `CLAUDE.md`, `agents/war-refiner.md`, `CONTEXT.md`, `skills/war/references/gastown-design-params.md`
- Plan slice: flip `DEFAULTS.run.roundLimit` 3 → 6 in `war-config.mjs` (the economy preset's explicit 2
  is untouched). Add the NEW drift-guard row in `war-config.test.mjs` binding `workflow-template.js`'s
  `run.roundLimit ??` fallback literal to `DEFAULTS.run.roundLimit` by extraction + equality (the
  `ROLE_MODEL` guard in the same suite is the precedent; regex shape latitude) — the flip task ships the
  guard for the fact it flips. Flip every doc surface carrying the old default literal — the census at
  `f22686b`, anchored by construct: `CLAUDE.md`'s execution-architecture sentence ("bounded fix rounds
  share `run.roundLimit`=3"), `agents/war-refiner.md`'s roundLimit bullet ("default 3"), `CONTEXT.md`'s
  **Retry budget** glossary term ("share `run.roundLimit` (default 3)"), and
  `skills/war/references/gastown-design-params.md`'s **round_limit** param row — which carries TWO
  literals in one sentence ("round_limit = 3" and "after 3 dissenting rounds"), both flip. Add
  OLD-absent asserts in `war-config.test.mjs`, context-scoped with a **word boundary before
  `roundLimit`** (or an explicit `redteamRoundLimit` exclusion): the sibling knob
  `run.redteamRoundLimit`'s default 3 (`skills/war-room/SKILL.md`'s config-keys row, `schemas.md`'s
  field comment, and the DEFAULTS line it shares with `roundLimit`) is **out of scope and must remain
  3**. Re-enumerate at the task's rebased base (the war-strategy D12 staleness rule) — the listed Files
  are the floor and **the base-time re-enumeration is licensed to EXPAND this task's Files list** — and
  run the mandated same-scope manual survey for stragglers the grep misses (A2).
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: Ace doc cascade (semantic)
- Files: `skills/war/SKILL.md`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `skills/war/references/schemas.md`, `CONTEXT.md`, `agents/war-auditor.md`, `agents/war-refiner.md`
- Plan slice: rewrite the batch-demote-on-regression narration to the landed bisection semantics on
  every prose home: `skills/war/SKILL.md`'s `--ace` bullet ("a **single** pre-merge ace-fix" and its
  Invariants echo), `design.md`'s disposition-routing/demotion-ladder paragraph, the
  `gastown-design-params.md` [HARD] severity+disposition row, `schemas.md`'s ace-related rows,
  `CONTEXT.md`'s Disposition / phase-close glossary terms, and the two agent standing cards' fix-loop /
  absorb-expectation narration. The demotion-ladder guarantee (every demotion logged, never dropped,
  zero unrouted findings on every exit path) is restated, now per-subset. Add the two Phase-1 glossary
  rows to `CONTEXT.md` (**Ace bisection**, **Ace-Subset trailer**). **De-mirror where possible**: the
  narration points at the canonical engine constructs instead of restating arithmetic — the plan's own
  trichotomy applied to itself. What the Done-when greps don't pin is an explicit
  **plan-faithfulness-seat responsibility** on this task's audit roster: narration fidelity on the
  remaining cascade surfaces, judged prose-against-code at `audit_sha`. **Byte duty:** among these
  Files the ADR 0042-budgeted surfaces are `skills/war/SKILL.md`, `CONTEXT.md`, `agents/war-auditor.md`,
  and `agents/war-refiner.md` — additions compression-funded/minimal per the Pivotal-constraints rule;
  `agents/war-refiner.md` (43 B of hard headroom at `f22686b`) must be **net-non-increasing**: the 3→6
  flip is net-zero, and any narration addition is paired with an in-file eviction to a `references/`
  pointer.
- Done when: `grep -qi 'bisect' skills/war/SKILL.md && ! grep -qi 'one commit in the task worktree' skills/war/SKILL.md`
- requiresTest: false
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

## Phase 2 — Filing consolidation (collapse, clusters, corroboration)

### Task 2.1: Engine collapse + clusters manifest + filing prompt
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: before the file-followups dispatch, deterministically collapse `minorsFiled` rows — key:
  same file + `line` within a window (window size latitude; reference realization ±10), falling back to
  normalized title **only when `line` is absent** (normalization function latitude) — merged rows carry
  a `seats[]` corroboration list. Extend the filing dispatch prompt: the rendered candidate rows carry
  each finding's `file` and `line` (today they render title/task/rationale only, making file-clustering
  impossible for the agent); cluster remaining candidates by file + root cause, file ONE issue per
  cluster with seats/tasks as corroboration in the body; on an open `war-followup` match, post this
  batch's finding as a **corroboration comment** on the existing issue, never a new issue (the
  retired-token sweep's dedup idiom, lifted verbatim). Extend `FOLLOWUP_FILING_RESULT` with a
  `clusters[]` manifest; the engine asserts: every ordinal in exactly one cluster, clustering only
  merges engine clusters (never splits), issues filed ≤ post-collapse rows — violations log fail-open
  (wording latitude) consistent with the existing non-conforming-return arm. Ordinal→issue stamping
  semantics unchanged (several rows may share one issue number). **Byte duty:** same rule as Task 1.1 —
  net prompt-literal growth within `WORKFLOW_LITERAL_BUDGET`'s hard ceiling, compression-funded
  (semantic-diff review discipline); this task **inherits whatever headroom Task 1.1 left**, so reaching
  the ADR 0042-cited raise fallback in this phase is anticipated and lawful, not an escalation. Tests
  cover the collapse key (line-window hit, title fallback, no-collapse control), the manifest asserts,
  and the corroboration-comment instruction presence.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: Filing doc mirrors
- Files: `skills/war/references/schemas.md`, `skills/war/SKILL.md`, `CONTEXT.md`
- Plan slice: document the landed filing behavior — **add** the filing-result documentation to
  `schemas.md` (the `FOLLOWUP_FILING_RESULT` shape lives only in `workflow-template.js` today; document
  it with `clusters[]` and the collapsed-row `seats[]`), update `skills/war/SKILL.md`'s follow-up filing
  floor clause (consolidation precedes filing; corroboration comments), and touch a `CONTEXT.md`
  glossary row only if a new term is rendered authoritative. **De-mirror where possible** (point at the
  canonical schema in the template rather than restating field lists); what the Done-when grep doesn't
  pin is an explicit **plan-faithfulness-seat responsibility** on this task's audit roster. Same
  byte-budget duty as Task 1.3 for the budgeted surfaces.
- Done when: `grep -qi 'clusters' skills/war/references/schemas.md`
- requiresTest: false
- requiresPackaging: false
- deps: [2.1]
- target repo: superproject

## Phase 3 — Doctrine (touched-doc duty, eligibility, amendments)

### Task 3.1: Touched-doc duty — authoring side
- Files: `skills/war-strategy/SKILL.md`, `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/war-strategy-structure.test.sh`, `docs/adr/0025-drift-guard-discipline.md`, `CONTEXT.md`, `skills/war/references/touched-doc-accuracy.md`, `skills/war/SKILL.md`
- Plan slice: add authoring rule 8 to war-strategy §3's drift-guard subsection — a task whose slice
  rewrites a doc owns the factual accuracy of what it renders authoritative: for every fact derivable
  from a machine-readable in-repo source (config/manifest/enum/version slot — never prose claims
  generally) the plan picks **guard** (a drift test binding doc value to source; exemplars:
  `version-slots.test.mjs`, `war-config.test.mjs`'s frontmatter guard), **de-mirror** (doc points at the
  source), or **explicitly defer** as a legitimacy-complete backstop row (named runner + timing), never
  silence. Flip **all three rule-count mirrors**: the §3 subsection heading ("three authoring rules" →
  four), the §4 gap-review row ("the three drift-guard rules in §3"), and `plan-interview.md`'s
  decisive-slots row ("task carve-outs per the drift-guard rules 5–7" → "5–8"). Add the falsifier
  bullet to `plan-interview.md`'s Stage-1 list. Extend `war-strategy-structure.test.sh` pins for the
  new rule's teeth — that suite stays deliberately **count-blind**; the rule-count OLD-absent guard
  lives in `war-pipeline-structure.test.sh` (Task 3.2, `deps` edge), matching the existing convention.
  Append the ADR 0025 amendment (heading names the **touched-doc** scope widening; body byte-unchanged)
  ratifying the fourth duty and its forcing functions. Create
  `skills/war/references/touched-doc-accuracy.md` (prose latitude; the name is pinned for End state 9)
  and add the one pointer-line bullet in `/war`'s decompose step, ADR 0042 shape (`when <trigger>, read
  references/<file>` — the bullet contains the token `touched-doc`), sited inside the
  `## Decompose + approve` region without colliding with the exactly-one `**Done-when intake` lead-in
  (the `skill-doc-contracts.test.mjs` D31 pin). Add the **Touched-doc accuracy duty** glossary row to
  `CONTEXT.md`.
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3.2: Touched-doc duty — enforcement side
- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`, `skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/war-machine/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: add the 4th drift-guard spine probe (**touched-doc-fact-coverage**, analyzed — Lead-run
  like its three siblings, never a `SPINE` array member: every task whose `Files:` rewrites a doc shows
  the guard / de-mirror / defer choice for its machine-source-derivable facts; failure ⇒
  `needsDecision`) to both prose surfaces (`skills/red-team/SKILL.md` + `references/lenses.md`, kept
  clause-parallel). **Two distinct count flips land here, each with its own guard home:** (a) the
  red-team **probe-count** three→four — update `workflow-scaffold.test.mjs`'s `ARM_NAMES` and OLD/NEW
  count-phrase pins; (b) war-strategy's **authoring-rule count** three→four (the wording flipped in Task
  3.1) — extend `war-pipeline-structure.test.sh`'s retired-count OLD-absent arms with the `three
  authoring` / `three drift-guard` forms, following the existing `two authoring` / `two drift-guard`
  precedent. Touch `skills/war-machine/SKILL.md`'s drafter directive so it consumes rule 8 by
  reference.
- Done when: `node --test skills/red-team/assets/workflow-scaffold.test.mjs && bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [3.1]
- target repo: superproject

### Task 3.3: Eligibility clarification + ADR amendments
- Files: `agents/war-auditor.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`, `docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: append the clarifying passage to the `disposition:'absorb'` block in
  `agents/war-auditor.md` ONLY (lens-calibration carve-out; the mirrored DISPOSITION RULE sentences and
  `auditPrompt()` stay byte-untouched): a doc fact deterministically re-derivable from a machine-readable
  in-repo source is **mechanical regardless of value count**; "single-file" reads on the fix's **write
  footprint** (the doc), not the source it reads from; only the accompanying policy question (mirror vs
  point-at-source) routes as an issue. Add a presence guard in `skill-doc-contracts.test.mjs` asserting
  a stable mid-sentence token of the passage (token choice latitude). Append the ADR 0013 amendment
  (heading contains "ace bisection") ratifying bisection-on-regression + this eligibility clarification
  and **explicitly naming the operator-ratified roundLimit 3→6 default flip**; append the one-line ADR
  0012 cross-reference ("ace regression-recovery semantics amended — see the 0013 amendment"); both ADR
  bodies byte-unchanged. `agents/war-auditor.md` is a budgeted surface (2,430 B of hard headroom at
  `f22686b`) — the passage rides within it.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Release

### Task 4.1: Version slots, lock-step
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together to the next free patch above the live base (resolved at land
  time, never a hardcoded semver): `plugin.json` `version`, `marketplace.json` `metadata.version` +
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, no badge), with the
  Status blurb naming this release's changes.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Mid-bisection resume behavior (a death between a subset commit and its journal write) · why deferred:
  needs a real death/resume in a live run · runner: **operator via `/war-review` at the first live run
  under a release carrying this plan** (the `Ace-Subset:` trailer is the observability hook). If that
  trailer data ever shows a both-halves-regress exhaustion demoting findings in practice, raise the
  default 6→8 as a one-line default flip with the standard OLD-absent duty — the raise stays available,
  data-priced (operator-ratified trigger).
- Realized-vs-intended absorb-rate movement · why deferred: needs field campaigns post-release · runner:
  **operator at the next #1492 classification window**.
- `finding.line` population rate (does the line-window collapse key bite?) · why deferred: needs live
  seat output · runner: **operator, same `/war-review` pass as row 1**.

## Notes / conscious deviations

- **deps-serialized same-file doc edits (operator-ratified deviation).** Tasks 1.2 and 1.3 both touch
  `agents/war-refiner.md`, `CONTEXT.md`, and `skills/war/references/gastown-design-params.md`; the
  `deps:[1.2]` edge on Task 1.3 serializes them instead of merging into one task — a deliberate
  deviation from the same-file→same-task heuristic (conflict cost exceeds the parallelism gain on small
  doc tasks; the hunks are disjoint constructs). Ratified at red-team.
- **End-state rows are split one-command-per-row** — the endstate-check dispatch records one command per
  condition row (recorded lesson), so compound conditions were decomposed rather than `&&`-chained
  (task-level `Done when:` commands may chain; they run through the assert-done-when floor, not the
  endstate dispatch).
- **Base-time expansion license.** Task 1.2's re-enumeration may EXPAND its Files list — a found stale
  literal in an unlisted file is in-slice, not an out-of-slice dilemma.
- **The byte census de-mirrors itself.** The Pivotal-constraints byte bullet cites
  `prompt-surface-budgets.test.mjs` as the live arbiter rather than enumerating surfaces — the
  trichotomy's de-mirror arm applied to this plan's own census.
- **Dispatched-prompt doctrine never moves card-side.** Funding the template's byte pressure by moving
  operative dispatched content onto standing agent cards was rejected: operative dispatched content
  stays in the template; item 3's gloss goes card-side because it is interpretive, not operative — the
  same principle, opposite placements.
- Issue #1547's "tier-name-sweep pattern" has no in-repo referent under that name; the plan cites the
  real exemplars (`version-slots.test.mjs`, `war-config.test.mjs`) instead.

## Open decisions

None.
