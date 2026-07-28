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
  the same task as the text they pin; budget test enforces advisory/hard lines with ratchet-down
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
     `skills/war/SKILL.md` is reachable only through a branch marker (greppable).
  5. `skills/war/SKILL.md` ≤ 60% of its 95,586 B baseline.
  6. Post-ratchet, every budgeted surface is under its advisory line; constants carry the D5
     formula comment and post-shrink derivation.
  7. The ADR (next free number) records D1–D6 and the rejected alternatives; `CONTEXT.md` gains
     **surface budget**, **prose temperature**, **trigger pointer**; `CLAUDE.md` carries the
     hot/cold law summary.
  8. No engine logic, exit code, schema, or floor script changed — prose and test re-anchors
     only.
  9. All four release slots bumped to the next free patch above the live base;
     `version-slots.test.mjs` green; blurb authored against the checklist.

## Build order (for /war)

Phases are strictly sequential (each shrink phase re-measures against the prior landed tip; the
`workflow-template.js` same-file law allows it in at most one task per phase):
Phase 1 governance → Phase 2 Lead surface → Phase 3 auditor family → Phase 4 refiner family →
Phase 5 worker+servitor families → Phase 6 periphery → Phase 7 ratchet + release.

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
  `skills/war/SKILL.md`, each `agents/*.md`, `skills/lessons-learned/SKILL.md`, and the
  prompt-literal share of `skills/war/assets/workflow-template.js` measured by template-literal
  extraction (blocks ≥ 200 B), with a non-vacuity assert (zero extracted blocks = red,
  fail-closed). Each row asserts `size ≤ hard` and logs a warning above `advisory`
  (advisory = 80% of hard). **Constants at this phase are placeholders: pre-shrink measured size
  × 1.25 rounded up to the KB** — recorded in a comment as placeholders awaiting the Task 7.1
  ratchet (this resolves the spec's D6-orders-the-test-first vs D5-derives-from-post-shrink
  tension: machinery and delete-the-feature check live from Phase 1; real budgets land in
  Phase 7 by ratchet-down, which D5 classifies as a normal change). The comment also carries the
  D5 formula and the raising-requires-ADR-justification rule.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Lead surface (the centerpiece)

### Task 2.1: `skills/war/SKILL.md` shrink

- Files: `skills/war/SKILL.md`, `skills/war/references/setup.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/references/docker-gate.md`, `skills/war/references/submodule-flows.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: Apply spec §4.3 to the 95,586 B surface: classify every block by branch-frequency
  tier (D4); move tier ≥ 2 blocks **verbatim** into the named `references/` files (the four names
  above are the expected carve — crash-heal/Setup, resume/reconciliation, docker-gate probing,
  submodule flows; the worker may re-partition topics but every evicted block must land
  byte-identical somewhere under `skills/war/references/`, reported per-block in the done
  report); leave a trigger pointer (`when <trigger>, read references/<file>`) at each eviction
  site; compress only provable cross-surface redundancy, naming the surviving canonical copy in
  the commit body. Re-anchor every `skill-doc-contracts.test.mjs` extraction region whose pinned
  text moved — same task, and a moved region's row must still red on its content's absence at the
  new home (no row deleted or loosened). Target: End state 5 (≤ 60% of baseline). Record the
  post-shrink byte size in the done report for Task 7.1.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Auditor family

### Task 3.1: Auditor card + dispatched literals

- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Same §4.3 pass over the auditor pair, in one commit (standing/dispatched split):
  shrink `agents/war-auditor.md` by tier classification (its full-ladder and checklist content is
  tier-1 for a seat — expect modest movement; the guard-grammar teach prose is the candidate);
  shrink the auditor-facing prompt literals in `workflow-template.js` (`auditPrompt()` and the
  gate-audit seat prompt) to skeleton + standing-card pointer where the card already carries the
  full text — the evidence-precedence D4 tiered-copies pattern, applied to the whole prompt, not
  just the ladder. Re-anchor every `workflow-template.test.mjs` both-surfaces/registry row whose
  pinned tokens moved; zero rows deleted or loosened. Record post-shrink sizes (card + auditor
  literal share) in the done report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Refiner family

### Task 4.1: Refiner card + dispatched literals

- Files: `agents/war-refiner.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Same pass over the refiner pair — the largest card (31,957 B) and the largest
  literal family (merge/land/provision/polish dispatches). Tier discipline: the serial-merge and
  land steps are tier-1 (every phase); provision-failure taxonomies, re-land loops, and
  submodule escalation arms are branch-gated — candidates for `references/` moved verbatim with
  trigger pointers on both the card and the literal (a dispatched agent Reads the reference on
  demand; the pointer carries the trigger). Re-anchor affected `workflow-template.test.mjs` rows
  same-task; zero deleted/loosened. Record post-shrink sizes in the done report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 5 — Worker and servitor families

### Task 5.1: Worker + servitor cards + dispatched literals

- Files: `agents/war-worker.md`, `agents/war-servitor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Same pass over the two remaining role pairs, one commit (both pairs touch
  `workflow-template.js`, so the same-file law folds them into this one task; the two cards are
  small — expect the literal side to carry most of the shrink). Re-anchor affected registry rows
  same-task; zero deleted/loosened. Record post-shrink sizes in the done report.
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
  zero rows deleted/loosened. Record post-shrink size.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 6.2: Entry-map and glossary dedup

- Files: `CLAUDE.md`, `CONTEXT.md`
- Plan slice: Apply spec §4.4 to the two top-level surfaces: CLAUDE.md keeps summaries (entry
  map), CONTEXT.md keeps definitions (glossary), operative procedure lives in exactly one
  operative home — where a paragraph in either file restates procedure now carried by a SKILL.md
  or card (landed in Phases 2–5), replace it with the one-line summary + pointer. Every removal
  is a compression naming the surviving canonical copy (commit body per removal); no doctrine may
  lose its last home (the survival lens verifies against the phase-2–5 landed tips). The ratified
  byte-identical pointer line at the top of CLAUDE.md is untouched. File-disjoint from Task 6.1;
  same wave.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 7 — Ratchet and release

### Task 7.1: Budget ratchet — placeholder → post-shrink constants

- Files: `skills/war/assets/prompt-surface-budgets.test.mjs`
- Plan slice: Replace the Task 1.2 placeholder constants with the D5 values derived from the
  **measured post-shrink sizes at this task's rebased base** (hard = post-shrink × 1.25 rounded
  up to the KB; advisory = 80% of hard), updating the derivation comment (formula + measured
  bytes + base). Ratchet-down only — if any computed hard line would exceed its placeholder,
  keep the placeholder and flag it in the done report (that surface failed to shrink; the audit
  seat verifies End state 6 against the landed sizes, not the report's claim). The placeholder
  comment marker must be gone (OLD-absent: grep for the placeholder marker returns zero).
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
- deps: [7.1]
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

- **D5's 1.25 multiplier** — `/red-team` adjudicates (too tight starves routine growth between
  tighten passes; too loose never fires).
- **End state 5's ≤ 60% target** — feasibility unproven until a tier census of
  `skills/war/SKILL.md` exists; `/red-team` should sample-classify a few sections and confirm or
  re-set the number before execution.
- **The instruction-survival lens definition** — a minted domain lens (open namespace); its seat
  prompt shape (old text vs skeleton + reference diff at `content-at-pin`) is stated in spec §4.3
  but the lens name and depth are for `/red-team` to pin so every shrink task's roster carries it
  uniformly.
