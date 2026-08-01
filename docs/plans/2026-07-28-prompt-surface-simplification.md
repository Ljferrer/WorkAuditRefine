# Prompt-surface simplification — port the memory subsystem's size governance to every prompt-bearing prose surface

Source spec: [docs/specs/2026-07-28-prompt-surface-simplification-design.md](../specs/2026-07-28-prompt-surface-simplification-design.md)
(ratified via `/grill-with-docs` 2026-07-28 over an `agent-architecture-audit` evidence pass;
design tree D1–D6 resolved there — this plan carries no re-litigation). The spec must be committed
on the working branch before `/war` runs: task workers cite its sections and measured baselines.

## Commander's Intent

- **Purpose:** stop the prompt-surface ratchet — every window pays only for doctrine it needs this
  turn — by porting the memory subsystem's proven size governance (budgets + tighten +
  archive-as-location) to every prompt-bearing prose surface, with zero behavior change.
- **Method:** branch-frequency tiers decide placement (only every-invocation doctrine stays
  inline; everything rarer becomes a `when <trigger>, read references/<file>` pointer); eviction
  is byte-identical move, never rewrite; compression only for provable cross-surface redundancy
  naming the survivor; an instruction-survival lens audits every shrink task; guards re-anchor in
  the same task as the text they pin — and the guard set is DISCOVERED, never enumerated: before
  moving any block, grep the surface's repo path across `**/*.test.mjs`, `**/*.test.sh`, and
  `.tours/` at the task base; every suite pinning moved text joins the same-task re-anchor
  (adjudication E). A presence key re-anchors by moving its read to the destination file; an
  OLD-absent / whole-file key re-anchors as a UNION scan over origin + every destination, never
  a relocated read (adjudication I); budget test enforces advisory/hard lines with ratchet-down
  semantics. Docs-tier workers run fable/high (run config).
- **End state:**
  1. `prompt-surface-budgets.test.mjs` exists — one row per budgeted surface including the
     `workflow-template.js` literal-share measurement (non-vacuous: zero extracted blocks reds);
     it reds on a 1-byte hard-line crossing, and removing any row's constant fails loudly.
  2. Every evicted block appears byte-identical in its `references/` destination; every
     compression commit names the surviving canonical copy.
  3. Zero doc-contract rows deleted or loosened; every moved extraction region re-anchored in the
     same task; full gate green at every land.
  4. Every trigger pointer states its condition; no surviving inline block in
     `skills/war/SKILL.md` is reachable only through a branch marker — judged by the
     `instruction-survival` seat (adjudication M: a judgment check, not a bare grep; the marker
     examples — `if docker`, `on resume`, `when held:`, `--afk`, submodule — are the floor).
  5. `skills/war/SKILL.md` ≤ 65% of its byte size measured at Task 2.1's rebased base
     (adjudication A supersedes the spec's "≤ 60% of 95,586 B": the literal was already stale at
     the plan base — 96,608 B — and the tier census puts the verbatim-move floor above 60%;
     record the measured base and resulting byte ceiling in the done report).
  6. Post-ratchet, every budgeted surface is under its advisory line — advisory = post-shrink
     × 1.10 ceil-KB, hard = post-shrink × 1.25 ceil-KB (adjudication D supersedes the spec's
     advisory = 80%-of-hard, whose product pinned advisory AT the measured size with zero
     headroom); a surface whose computed hard would exceed its placeholder (it grew) is a
     blocking done-report flag for Lead adjudication, never a silent note. Constants carry the
     formula comment and post-shrink derivation.
  7. The ADR (next free number) records D1–D6 and the rejected alternatives; `CONTEXT.md` gains
     **surface budget**, **prose temperature**, **trigger pointer**; `CLAUDE.md` carries the
     hot/cold law summary.
  8. No engine logic, exit code, schema, or floor script changed — prose and test re-anchors
     only.
  9. All four release slots bumped to the next free patch above the live base;
     `version-slots.test.mjs` green; blurb authored against the checklist.
  10. ADR 0041's `## Relationship to prior ADRs` names ADR 0029 (Decision point 2) and ADR 0024
     (§(C)) with matching reference-section lines; every pre-existing 0041 line byte-unchanged
     (additive insertion only); the landing commit cites #1200.

## Build order (for /war)

Phases are strictly sequential (each shrink phase re-measures against the prior landed tip; the
`workflow-template.js` same-file law allows it in at most one task per phase):
Phase 1 governance → Phase 2 Lead surface → Phase 3 auditor family → Phase 4 refiner family →
Phase 5 worker+servitor families → Phase 6 periphery → Phase 7 ratchet + release.

Phase 7 runs in **two waves**: wave 1 = Task 7.1 ∥ Task 7.3 (file-disjoint — the budget suite vs
`skill-doc-contracts.test.mjs`), wave 2 = Task 7.2, the release bump, `deps: [7.1, 7.3]` so the
version bump stays the trailing act and its blurb is written over the finished phase.

## Phase 1 — Governance

### Task 1.1: Doctrine record — ADR, glossary terms, hot/cold law summary

- Files: `docs/adr/0042-prompt-surface-budgets.md`, `CONTEXT.md`, `CLAUDE.md`
- Plan slice: Author the ADR per spec §7 — resolve the number as the **next free** in the live
  `docs/adr/` listing at the task base (0042 as measured 2026-07-28 assumes the
  audit-evidence-precedence ADR lands first; re-resolve either way — the `Files:` literal is
  non-authoritative) — recording D1–D6 (spec §3), the budget formula and ratchet-down rule, the
  move-verbatim discipline, the hot/cold law, and the rejected alternatives (shrink-only;
  budgets-only; size-threshold placement), cross-referencing ADR 0015/0038 (donor memory budgets)
  and ADR 0025 (guards follow text). Add the three glossary terms to `CONTEXT.md` per spec §6 —
  **surface budget**, **prose temperature**, **trigger pointer**, each with its `_Avoid_:` line.
  Add the hot/cold law summary to `CLAUDE.md` (spec §4.2): new doctrine defaults to a
  `references/` file + trigger pointer unless tier-1, pointer shape fixed. Before writing, grep
  the doc-contract suites for assertions reading `CONTEXT.md` or `CLAUDE.md` (the ratified
  pointer-line test among them) and land additions outside every pinned extraction region.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Budget test — machinery first, placeholder constants

- Files: `skills/war/assets/prompt-surface-budgets.test.mjs`
- Plan slice: Author the budget test per spec §4.1: one row per budgeted surface —
  `skills/war/SKILL.md`, each `agents/*.md`, `skills/lessons-learned/SKILL.md`, `CONTEXT.md`,
  and `CLAUDE.md` (adjudication F: both are prompt-bearing — CLAUDE.md loads every session,
  CONTEXT.md is the shared glossary; README.md is deliberately unbudgeted, a human release
  surface), plus the prompt-literal share of `skills/war/assets/workflow-template.js` measured
  by a PINNED algorithm (adjudication C): nesting-aware extraction of top-level template
  literals only, blocks ≥ 200 B, comments excluded — measure at this task's base and record the
  count in the derivation comment (≈ 108 blocks / ≈ 50.6 KB at fa3c838; the spec §1 row's
  164,234 B / 238 blocks / 74% is unreproducible — ~3× the file's total template-literal
  content — and is superseded). Non-vacuity assert stays (zero extracted blocks = red,
  fail-closed). Each row asserts `size ≤ hard` and logs a warning above `advisory`. **Constants
  at this phase are placeholders: hard = pre-shrink measured size × 1.25 ceil-KB, advisory =
  pre-shrink × 1.10 ceil-KB** — each constant's comment carries the literal marker
  `PLACEHOLDER-BUDGET` exactly once (Task 7.1's OLD-absent check greps this exact token) —
  recorded as placeholders awaiting the Task 7.1 ratchet (this resolves the spec's
  D6-orders-the-test-first vs D5-derives-from-post-shrink tension: machinery and
  delete-the-feature check live from Phase 1; real budgets land in Phase 7 by ratchet-down,
  which D5 classifies as a normal change). The comment also carries the adjudication-D formula
  and the raising-requires-ADR-justification rule.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: ADR 0041 attribution repair — name ADR 0029 and ADR 0024 (#1200)

- Files: `docs/adr/0041-audit-evidence-precedence.md`
- Plan slice: Operator-directed fold-in (2026-07-28) of follow-up #1200 — plan 1's phase-1 absorb
  that never landed, demoted to `follow-up` per the residual rule. Add two bullets to the ADR's
  `## Relationship to prior ADRs`, matching the existing 0007/0008/0025 bullet style, naming the
  two ADRs whose ratified rules 0041 ranks without attribution: **ADR 0029
  (capture grounds on the committed tip), Decision point 2** — the canonical source of
  `content-at-pin` rungs 1–2 (`git show <audit_sha>:<path>`; a working-tree grep "must never be
  the sole basis") and of `history` rung 1 (history verb chosen per claim shape); **ADR 0024
  (integrated-tip / captured-evidence verdicts), §(C)** — the canonical source of `execution`
  rung 1 (the captured gate-evidence artifact as the sole HARD basis for a provably-unrun
  finding) and rung 4 (absent artifact ⇒ SOFT `cannot-confirm`). Mirror both citations into the
  ADR's `## References` section in its existing entry style. **Verify before writing** (recorded
  spec-citation lesson): read 0029's `## Decision` point 2 and 0024's `### (C)` at the task base
  and confirm each actually carries the rule being attributed — if a rule's real home differs,
  cite the true home and say so in the done report rather than propagating #1200's shorthand.
  Additive only: every pre-existing line of 0041 stays byte-unchanged (word-diff-verifiable); the
  D26 doc-contract row matches token keys against the whole normalized ADR (`norm(adr0041)`), so
  purely additive text cannot un-match a key — re-confirm at the task base. The commit body cites
  #1200 (its close condition); the Lead closes #1200 at phase close citing the landed SHA.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Lead surface (the centerpiece)

### Task 2.1: `skills/war/SKILL.md` shrink

- Files: `skills/war/SKILL.md`, `skills/war/references/setup.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/references/docker-gate.md`, `skills/war/references/submodule-flows.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/land-decision.test.mjs`, `skills/red-team/diagnosis-preflight.test.sh`, `skills/war-machine/war-pipeline-structure.test.sh`, `skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`, `.tours/architect-war-system.tour`
- Plan slice: Apply spec §4.3 to the surface measured at this task's rebased base (96,608 B at
  plan authoring; the spec's 95,586 B is a stale fa3c838 snapshot — adjudication B). Classify
  every block by branch-frequency tier with the boundary PINNED (adjudication A settles the D4
  every-phase vs every-invocation ambiguity): **tier 1 = text the Lead reads on every `/war`
  invocation** — Setup, Decompose + approve, Per phase, Run manifest, Finish, Invariants stay
  inline; **tier ≥ 2 = any block reachable only through a branch marker** (`if docker`,
  `on resume`, `when held:`, `--afk`, submodule present). Move tier ≥ 2 blocks **verbatim** into
  the named `references/` files (the four names above are the expected carve — crash-heal/Setup,
  resume/reconciliation, docker-gate probing, submodule flows; the worker may re-partition
  topics but every evicted block must land byte-identical somewhere under
  `skills/war/references/`, reported per-block in the done report); leave a trigger pointer
  (`when <trigger>, read references/<file>`) at each eviction site; compress only provable
  cross-surface redundancy, naming the surviving canonical copy in the commit body. Guard
  re-anchoring is DISCOVERY-based (adjudication E): grep `skills/war/SKILL.md` across every
  `*.test.mjs` / `*.test.sh` / `.tours/` file at the task base and re-anchor every suite pinning
  moved text in this same task — the Files list carries the inventory measured at `0dc004a`
  (`war-config.test.mjs` ~15 `readDoc` rows incl. the byte-identical pointer line,
  `land-decision.test.mjs` 2 pinned lines, `diagnosis-preflight.test.sh` 3 presence greps,
  `war-pipeline-structure.test.sh`, `workflow-scaffold.test.mjs`, `doc-cli-consistency.test.mjs`,
  the architect tour). Presence keys relocate their read; OLD-absent / whole-file keys become
  UNION scans (adjudication I). A region pinned by a single ordered/positional key is ATOMIC —
  it moves whole or stays whole; **D22's Gate-2 publication flow is pinned inline as tier-1 and
  excluded from the eviction census** (adjudication J — its ordering claim is about SKILL.md's
  own step order). The done report lists every pinned region's disposition
  (stayed / moved-whole / union-re-anchored); no row deleted or loosened. Target: End state 5
  (≤ 65% of the measured base — adjudication A). Record the base and post-shrink byte sizes in
  the done report for Task 7.1.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Auditor family

### Task 3.1: Auditor card + dispatched literals

- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war/references/auditor-teach.md`
- Plan slice: Same §4.3 pass over the auditor pair, in one commit (standing/dispatched split):
  shrink `agents/war-auditor.md` by tier classification (its full-ladder and checklist content is
  tier-1 for a seat — expect modest movement; the guard-grammar teach prose is the candidate;
  the card measures 23,823 B at the plan base, not spec §1's 20,559 B — plan 1 added the
  evidence-precedence ladders; adjudication B); shrink the auditor-facing prompt literals in
  `workflow-template.js` (`auditPrompt()` **plus all three gate-audit-family seats** —
  `execution-evidence`, `integrated-tip`, `end-state` — which sit outside `auditPrompt()` and
  inherit nothing from it; adjudication M corrects the one-seat phrasing) to skeleton +
  standing-card pointer where the card already carries the full text. **Registry carve-out
  (adjudication G):** the shrink set EXCLUDES every token/span anchored by a
  `workflow-template.test.mjs` registry / both-surfaces row (grep the registry at the task
  base) — those rows pin runtime-generated prompt strings that cannot re-anchor to a file, so
  registry-pinned skeletons stay verbatim and the shrinkable residue is what remains; if the
  residue makes a literal's shrink negligible, report the measured residue rather than forcing a
  cut. Card evictions land under `skills/war/references/` as `<role>-<topic>.md`
  (adjudication H; `auditor-teach.md` is the expected carve, re-partition allowed) with trigger
  pointers on the card. Re-anchor discovery-based (adjudication E). Zero rows deleted or
  loosened. Record post-shrink sizes (card + auditor literal share) in the done report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Refiner family

### Task 4.1: Refiner card + dispatched literals

- Files: `agents/war-refiner.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/refinery-surface.test.sh`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/references/refiner-recovery.md`
- Plan slice: Same pass over the refiner pair — the largest card (31,957 B) and the largest
  literal family (merge/land/provision/polish dispatches). Tier discipline: the serial-merge and
  land steps are tier-1 (every phase); provision-failure taxonomies, re-land loops, and
  submodule escalation arms are branch-gated — candidates for `references/` moved verbatim
  (destination `skills/war/references/<role>-<topic>.md`, adjudication H; `refiner-recovery.md`
  is the expected carve) with trigger pointers on both the card and the literal (a dispatched
  agent Reads the reference on demand; the pointer carries the trigger). The registry carve-out
  (adjudication G, as stated in Task 3.1) applies identically: registry / both-surfaces-pinned
  spans are excluded from the literal shrink. Re-anchor discovery-based (adjudication E) — the
  base inventory adds `refinery-surface.test.sh` (presence checks pairing the card with the
  dispatched gate-run prompts) and `war-config.test.mjs` (`readDoc('agents/war-refiner.md')`) to
  `workflow-template.test.mjs`; zero deleted/loosened. Record post-shrink sizes in the done
  report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 5 — Worker and servitor families

### Task 5.1: Worker + servitor cards + dispatched literals

- Files: `agents/war-worker.md`, `agents/war-servitor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/red-team/diagnosis-preflight.test.sh`, `hooks/validate-worktree-scope.test.sh`, `hooks/clean-surface-hook-only-confinement.test.sh`, `skills/war/references/worker-servitor-edges.md`
- Plan slice: Same pass over the two remaining role pairs, one commit (both pairs touch
  `workflow-template.js`, so the same-file law folds them into this one task; the two cards are
  small — expect the literal side to carry most of the shrink). The registry carve-out
  (adjudication G) applies; card evictions land under `skills/war/references/` as
  `<role>-<topic>.md` (adjudication H; `worker-servitor-edges.md` is the expected carve).
  Re-anchor discovery-based (adjudication E) — the base inventory adds
  `diagnosis-preflight.test.sh` (worker/servitor card presence greps) and the two hooks suites
  to `workflow-template.test.mjs`; zero deleted/loosened. Record post-shrink sizes in the done
  report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 6 — Periphery

### Task 6.1: lessons-learned skill

- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/references/tighten.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: Same §4.3 pass over the 38,711 B housekeeping skill; its existing `references/`
  (seeding.md, migration.md) shows the pattern is already half-applied — finish it (the tighten
  procedure and eviction mechanics are branch-gated relative to the skill's default invoke).
  The named new reference file is the expected carve, re-partition allowed as in Task 2.1.
  Re-anchor `lessons-learned-doc-contract.test.mjs` regions same-task (its banner-numbering
  convention is documented in the file's own corrected comment — cite an `(N)` with its banner);
  its six-key `doesNotMatch` OLD-absent set (surfaces 1–6, four of them inside the tighten
  section this task evicts) re-anchors as a UNION scan per adjudication I, never a relocated
  read; zero rows deleted/loosened. Record post-shrink size.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 6.2: Entry-map and glossary dedup

- Files: `CLAUDE.md`, `CONTEXT.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: Apply spec §4.4 to the two top-level surfaces: CLAUDE.md keeps summaries (entry
  map), CONTEXT.md keeps definitions (glossary), operative procedure lives in exactly one
  operative home — where a paragraph in either file restates procedure now carried by a SKILL.md
  or card (landed in Phases 2–5), replace it with the one-line summary + pointer. Every removal
  is a compression naming the surviving canonical copy (commit body per removal); no doctrine may
  lose its last home (the survival lens verifies against the phase-2–5 landed tips). The ratified
  byte-identical pointer line at the top of CLAUDE.md is untouched. **Guard exposure
  (adjudication L):** CONTEXT.md glossary blocks are extraction-pinned by
  `skill-doc-contracts.test.mjs` (D19 `**Adjudication**` `_Avoid_`, D24 `**Staged phase
  script**`, D26 audit-evidence terms vs ADR 0041) and CLAUDE.md by `war-config.test.mjs`
  (`RETIRED_CLAIM_SURFACES`; the byte-identical pointer line at `SURFACES`) — re-anchor affected
  rows in this task, discovery-based (adjudication E). **Do NOT touch any region pinned by
  `lessons-learned-doc-contract.test.mjs`** (its CONTEXT.md `**Advisory line**` / `**Tighten
  pass**` surfaces) — that suite belongs to Task 6.1 in this same phase; file-disjointness is
  preserved by this constraint, verified by grep at the task base. File-disjoint from Task 6.1;
  same wave.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 7 — Ratchet and release

### Task 7.1: Budget ratchet — placeholder → post-shrink constants

- Files: `skills/war/assets/prompt-surface-budgets.test.mjs`
- Plan slice: Replace the Task 1.2 placeholder constants with the values derived from the
  **measured post-shrink sizes at this task's rebased base** (hard = post-shrink × 1.25 ceil-KB;
  advisory = post-shrink × 1.10 ceil-KB — adjudication D supersedes the spec's 80%-of-hard
  advisory, whose product pinned advisory AT the measured size), updating the derivation comment
  (formula + measured bytes + base). Ratchet-down only — if any computed hard line would exceed
  its placeholder the surface GREW: keep the placeholder and raise a **blocking done-report flag
  for Lead adjudication** (accept with an ADR-justification note, or a re-shrink follow-up —
  never a silent note; the audit seat verifies End state 6 against the landed sizes, not the
  report's claim). A surface no shrink task targeted (`agents/war-setup-scout.md`) ratchets to
  its own measured size without a flag — unchanged is not failed (adjudication M). OLD-absent
  check, runnable and pinned: `grep -rin 'PLACEHOLDER-BUDGET'
  skills/war/assets/prompt-surface-budgets.test.mjs` returns zero, and the suite gains the
  equivalent self-assertion in this task so the gate itself carries it.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 7.2: Version bump — all four release slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four version slots in lock-step to the **next free patch above the live
  integration base at land time** (never a plan literal; re-read the slots at the rebased tip —
  first action is the dep rebase, which also makes Task 7.1's final budget constants readable for
  the blurb). Replace the README `## Status` paragraph in place, authored against the
  `### Status-blurb authoring checklist` and answering each item in the done report;
  `version-slots.test.mjs` is the arbiter. Describe: the governance port (budgets + hot/cold
  law), the measured shrink per surface (cite the landed budget constants, not draft numbers),
  and the zero-behavior-change boundary — scoping that label per checklist item 5 (prose and
  test re-anchors moved; no engine code path, exit code, schema, or floor script did).
- requiresTest: false
- requiresPackaging: false
- deps: [7.1, 7.3]
- target repo: superproject

### Task 7.3: D29 doctrine-mirror guard — bind ADR 0042 ↔ CONTEXT.md ↔ CLAUDE.md (#1208)

- Files: `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **Operator-directed addition (2026-07-29)** — issue #1208 was folded into Task 6.2's
  dispatch and did NOT land: the `D28` label was consumed by 6.2's own glossary-compression row,
  and the three-surface mirror Task 1.1 authored is still hand-synced with no suite reading any of
  it (measured at `5df7e47`: `0042`, `trigger is the skeleton`, `when <trigger>`,
  `Doctrine placement` all return ZERO across `skills/**/*.test.mjs`). This task supplies the
  missing mechanical guard for **End state 7**, whose content phase 1 landed but left unpinned.
  Write **one row under the next free label — `D29`; `D28` is taken** (verify at the rebased base
  before choosing, and never reuse a label). Shape it on the existing D26 row (the ADR 0041
  both-surfaces mirror) — the nearest landed precedent. Extraction: per-term for the three
  `CONTEXT.md` entries (**surface budget**, **prose temperature**, **trigger pointer**; bolded
  term → next bolded term or `###`, each non-vacuously reaching its own `_Avoid_` line) plus
  construct extraction of `CLAUDE.md`'s `## Doctrine placement` (heading → next `##`).
  Token-anchored keys: `/when\s+<trigger>,\s+read\s+references\//i`,
  `/trigger\s+is\s+the\s+skeleton/i`, `/byte-identical/i`, a **paired** lowering/raising key so
  the ratchet direction cannot invert, and the ×1.10 / ×1.25 pair. **Every key asserted on BOTH
  the mirror block and `norm(adr0042)`**, so a one-sided edit reds while sanctioned rewording
  latitude does not. Zero rows deleted or loosened; additive only. Non-vacuity is the acceptance
  bar: a one-sided mutation of ANY of the three surfaces must red the row — demonstrate it in the
  done report per surface (mutate, observe red, revert), not by assertion.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Non-monotonic growth interval — at least one budgeted surface shrank or held over the next ~5
  releases · why deferred: only future releases can produce the measurement; this run can only
  land the counterweight · runner: the next campaign wrap-up (or any release ≥ 5 patches out)
  re-runs the spec §1 growth measurement and reports per surface.
- Hot/cold law adherence — new doctrine after this plan actually defaults to `references/` +
  trigger pointer · why deferred: authoring behavior, not a state this run can pin · runner: the
  advisory-line warnings in `prompt-surface-budgets.test.mjs` (first mechanical signal) plus the
  next `/war-review`'s doc-surface pass.
- Advisory-warn visibility — the budget test's above-advisory log line is actually visible in
  refiner gate output when first crossed · why deferred: needs a real crossing, which the
  post-ratchet state deliberately avoids · runner: the first release where any surface crosses
  its advisory line.

## Notes / conscious deviations

- **Run config (operator-directed, 2026-07-28): default profile, all worker tiers fable/high.**
  Launch with `.claude/war/config.json` on the default (`balanced`) profile plus the operator's
  worker override — `agents.worker: { model: 'fable', effort: 'high', docs: { model: 'fable',
  effort: 'high' }, fix: { model: 'fable', effort: 'high' } }` — so every worker spawn (base,
  docs-tier, and fix/ace rounds) runs fable/high. Auditor, servitor, and red-team stay at the
  profile defaults (`DEFAULTS` in `war-config.mjs` is the arbiter). With all three tiers pinned
  identically, the docs-vs-base classification (Tasks 1.1/6.2 all-`*.md`; every card+literal or
  shrink+re-anchor task mixed) no longer changes model or effort anywhere — it remains dispatch
  bookkeeping only.
- **#1200 fold-in (operator-directed, 2026-07-28).** Task 1.3 and End state 10 land a campaign
  residual from plan 1 (the un-landed ADR-attribution absorb, filed as #1200) — deliberately
  outside the source spec's scope; the operator's direction ("Add #1200 to Plan 2") is the
  authority. File-disjoint from Tasks 1.1/1.2, same wave, `deps: []`. Threaded as an adjudication
  row at launch so plan-faithfulness seats read the amended plan as authoritative rather than
  flagging spec drift.
- **Adjudicated at red-team (2026-07-28; the report's `## Adjudications` block at
  `docs/red-team/2026-07-28-prompt-surface-simplification.md` is the authority):** every spec §1
  byte literal is a dated `fa3c838` snapshot and non-authoritative — re-measure at the task base
  (adjudication B: SKILL.md 96,608 B, `war-auditor.md` 23,823 B, `CONTEXT.md` 100,984 B,
  `workflow-template.js` 227,469 B at `0dc004a`); the spec's literal-share row
  (164,234 B / 238 / 74%) is unreproducible and superseded by Task 1.2's pinned algorithm
  (adjudication C); D1's "README pointers" arm is deliberately dropped — README.md is a human
  release surface, §5's table governs (adjudication F); the operator's fable/high worker
  override lives in the Lead's UNCOMMITTED `.claude/war/config.json` (campaign-managed) — the
  committed copy does not carry it, so a probe reading the committed file sees the old tiers
  (adjudication M).
- **Instruction-survival lens, pinned (adjudication K):** minted lens `instruction-survival`,
  depth `deep`, seated on EVERY shrink task's roster (2.1, 3.1, 4.1, 5.1, 6.1, 6.2); seat prompt
  shape per spec §4.3 — the old text vs the skeleton + reference, diffed at `content-at-pin`.
- **Placeholder-constants two-step (Tasks 1.2 → 7.1)** resolves the spec's internal ordering
  tension (D6 wants the counterweight first; D5 derives constants from post-shrink sizes):
  machinery lands in Phase 1 with pre-shrink × 1.25 placeholders, the Phase 7 ratchet lands the
  real values — ratchet-down is a normal change by D5's own rule.
- **One mega-task was rejected**: all four role families touch `workflow-template.js`, so a
  single task could hold them — rejected for blast radius and audit legibility; phase-per-family
  keeps each diff reviewable and the same-file law satisfied (`workflow-template.js` appears in
  exactly one task per phase).
- **`CLAUDE.md` is touched in two phases** (1.1 law summary; 6.2 dedup) — legal across phases;
  6.2's worker rebases onto a tip already carrying 1.1's addition.
- **Reference-file names in `Files:` lists are expected carves, not contracts** — a worker may
  re-partition topics within the task's declared directory; every evicted block must land
  byte-identical under that directory, reported per-block.

## Open decisions

All three resolved by `/red-team` self-adjudication under AFK (2026-07-28; the report's
`## Adjudications` block is the authority):

- **D5 multipliers** — hard = post-shrink × 1.25 ceil-KB (kept); advisory decoupled to
  post-shrink × 1.10 ceil-KB (adjudication D — the spec's 80%-of-hard advisory multiplied out to
  exactly 1.0 × post-shrink: zero headroom, End state 6 unsatisfiable on a KB boundary).
- **End state 5 target** — re-set to ≤ 65% of the size measured at Task 2.1's rebased base
  (adjudication A; the full tier census put the verbatim-move floor at ~60.5% of the stale
  baseline before pointer residue, so 60% would require compression D3 does not authorize).
- **Instruction-survival lens** — `instruction-survival` / `deep`, on every shrink task's roster
  (adjudication K).
