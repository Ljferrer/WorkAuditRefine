# Prompt-surface simplification — port the memory subsystem's size governance to every prompt-bearing prose surface

Ratified via `/grill-with-docs`, 2026-07-28. Grounded in an `agent-architecture-audit` evidence
pass (measurements below); five decisions grilled one at a time; design tree resolved below.

## 1. Context — the gap / problem

Every prompt-bearing prose surface in this repo has grown monotonically across 22 patch releases
with **zero shrink events**, measured at `origin/master` (`fa3c838`) against the 0.14.38 base:

| Surface | Now | @ 0.14.38 | Growth | Window it enters |
|---|---|---|---|---|
| `skills/war/SKILL.md` | 95,586 B (~24k tok) | 71,829 B | +33% | every `/war` Lead, before any work |
| `CONTEXT.md` | 98,947 B | 80,030 B | +24% | on-demand (glossary) |
| `workflow-template.js` prompt literals | 164,234 B (74% of the 224,165 B file, 238 blocks ≥ 200 B) | — | +17% (file) | every dispatched worker/auditor/refiner/servitor prompt |
| `agents/war-refiner.md` | 31,957 B | — | — | per refiner spawn |
| `agents/war-auditor.md` | 20,559 B | 17,996 B | +14% | per seat spawn |
| `skills/lessons-learned/SKILL.md` | 38,711 B | — | — | per housekeeping invoke |
| `README.md` | 48,889 B (10,158 B = `## Status`) | — | — | humans |

The audit's diagnosis: a **one-way ratchet with no counterweight**. Auditor findings and incident
lessons only ever *add* doctrine (a qualifier, a guard, a procedure); nothing ever files "this is
too big" — the same mechanism already diagnosed on the `## Status` paragraph, operating on every
surface. The irony is exact and is the design opportunity: the **memory subsystem already solved
this problem shape** — advisory line (17,000 B) → operator-gated `tighten` pass → hard refusal
(24,400 B), with **temperature-is-location** (archive = move, never delete). The prompt surfaces,
which cost tokens on *every dispatch*, have no budget, no advisory, no eviction path. Progressive
disclosure exists (`references/` — schemas.md 53 KB properly deferred) but nothing forces new
doctrine to choose skeleton-vs-full placement; the default landing spot is the operative surface.

## 2. Pivotal constraints

- **Unpinned ≠ non-load-bearing.** The 43 doc-contract/structure suites pin only a fraction of
  prose tokens; most operative doctrine (the Lead's procedural steps) is unpinned. "Tests green"
  is therefore a floor, never sufficient proof that a shrink preserved meaning.
- **Standing/dispatched split.** A role's standing card and its dispatched-prompt literal move in
  the same commit — so every role-family shrink is one task touching `workflow-template.js`, and
  two such tasks collide in one phase. Phase-per-role-family is forced by file-disjointness.
- **Guards follow their text.** A doc-contract row's extraction region reds when its pinned text
  moves to `references/`; every move must re-anchor its guards in the same task (ADR 0025 — the
  discipline enforces the pass's own safety).
- **The archive rule.** Eviction must be a *move*, never a deletion — evicted doctrine stays
  greppable and Read-able on demand, exactly like archived lessons.
- **Zero behavior change.** The pass touches no engine logic, no exit codes, no schemas, no test
  assertions (re-anchoring excepted) — the truth-sweep validation posture.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Scope | **Prompt-bearing prose only** — SKILL.md files, standing agent cards, dispatched-prompt literals, CLAUDE.md/CONTEXT.md dedup, README pointers. Engine logic and test suites out of scope |
| D2 | Mechanism | **Full memory-pattern port** — one-time shrink pass now, plus standing per-surface byte budgets (advisory + hard, test-enforced), with `references/` as the archive analogue |
| D3 | Meaning preservation | **Move-verbatim + survival lens** — eviction is a byte-identical move + skeleton pointer (rewrite-while-moving banned); compression only for provable cross-surface redundancy naming the surviving copy; a dedicated instruction-survival audit lens on every shrink task; doc-contract suites green with guards re-anchored in-task |
| D4 | Hot/cold rule | **Branch-frequency tiers** — temperature = how often a window pays for text unused that turn: every-phase > once-per-run > branch-gated > incident-only. Only tier 1 stays inline; every pointer carries its trigger condition |
| D5 | Budget formula | **Post-shrink × 1.25 (rounded up to the KB) = hard line; advisory = 80% of hard** — recorded as constants in the budget test; ratchet-down semantics (lowering = normal PR; raising = requires the ADR's named justification). Multiplier flagged for `/red-team` adjudication |
| D6 | Vehicle | **One plan, phased per role-family** — governance phase first, then Lead surface, then one role-family per phase (`workflow-template.js` at most once per phase), periphery + release trailing |

## 4. Mechanics

### 4.1 The budget test (the counterweight — governance phase)

A new `skills/war/assets/prompt-surface-budgets.test.mjs`: one row per budgeted surface —
`skills/war/SKILL.md`, each `agents/*.md`, `skills/lessons-learned/SKILL.md`, and the **prompt-
literal share of `workflow-template.js`** (measured by the same ≥ 200 B template-literal
extraction used in the audit, so engine-code growth never trips a prose budget). Each row asserts
`size ≤ hard` and warns (log line, not failure) above `advisory`. Constants carry a comment naming
the D5 formula and the post-shrink measurement they derive from. Raising any constant requires
citing the ADR's justification rule in the commit body — the test comment says so.

### 4.2 The hot/cold law (D4) — the progressive-disclosure rule of the land

Recorded in the ADR and summarized where authors land doctrine (`CLAUDE.md` releasing/authoring
notes): new doctrine defaults to a `references/` file + trigger pointer unless it is tier-1
(every-invocation path). A pointer's shape is fixed: `when <trigger>, read references/<file>` —
the trigger is the skeleton. Existing precedent to cite, not invent: the evidence-precedence
spec's D4 tiered copies (full ladders on the card, skeleton in the prompt).

### 4.3 The shrink passes (per phase)

Per role-family and per surface, apply in order: (1) classify each block by tier (D4);
(2) tier ≥ 2 blocks move verbatim to `references/<skill-or-role>/<topic>.md` with a trigger
pointer left behind; (3) compress only provable cross-surface redundancy, naming the surviving
canonical copy in the commit body; (4) re-anchor every doc-contract extraction region that
followed moved text, same task; (5) measure, and record the post-shrink size for the budget
constants. The instruction-survival lens (D3) audits each task: old text diffed against skeleton +
reference file at `content-at-pin`; any dropped operative instruction is a Critical finding.

### 4.4 Dedup targets (audit finding 3)

One fact in ≤ 5 places (CLAUDE.md → CONTEXT.md → SKILL.md → card → literal) shrinks to: canonical
home + guarded mirrors only where a window genuinely needs the copy (the both-surfaces split), +
pointers elsewhere. CLAUDE.md keeps summaries (it is the entry map — its job); CONTEXT.md keeps
definitions (glossary — its job); operative procedure lives in exactly one operative home.

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/war/assets/prompt-surface-budgets.test.mjs` | New budget test (§4.1) |
| `skills/war/SKILL.md` | Tier-2+ blocks → `skills/war/references/` with trigger pointers (the 95.6 KB centerpiece) |
| `skills/war/references/*.md` | New/expanded reference files (verbatim moved blocks) |
| `agents/war-auditor.md`, `agents/war-refiner.md`, `agents/war-worker.md`, `agents/war-servitor.md` | Per-role shrink, paired with their dispatched literals |
| `skills/war/assets/workflow-template.js` | Literal skeletons + pointers, one role-family per phase |
| `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/skill-doc-contracts.test.mjs` | Extraction-region re-anchors for moved text (same task as each move) |
| `skills/lessons-learned/SKILL.md` + its `references/` | Periphery shrink |
| `CLAUDE.md`, `CONTEXT.md` | Dedup per §4.4; hot/cold law summary |
| `docs/adr/<next-free>-prompt-surface-budgets.md` | The ADR (§7; number resolved from the live listing at land time) |
| `.claude-plugin/*`, `README.md` | Release slots (trailing phase) |

## 6. New domain terms (CONTEXT.md)

- **Surface budget** — the advisory/hard byte pair a prompt-bearing surface may not exceed,
  test-enforced. _Avoid_: treating advisory as blocking; raising a hard line without the ADR's
  justification rule; budgeting `references/` (cold storage is unbudgeted, like `archive/`).
- **Prose temperature** — a block's branch-frequency tier (every-phase / once-per-run /
  branch-gated / incident-only). _Avoid_: size as temperature; a tier-1 claim for text reachable
  only through a conditional.
- **Trigger pointer** — the inline residue of an evicted block: `when <trigger>, read
  references/<file>`. _Avoid_: pointers without triggers; rewriting while moving (the move is
  byte-identical; the pointer is new text).

## 7. Recommended ADRs

- **ADR `<next-free>` — Prompt-surface budgets and the hot/cold law.** Records D1–D6, the budget
  formula and its ratchet-down rule, the move-verbatim discipline, and the rejected alternatives
  (shrink-only; budgets-only; size-threshold placement). Cross-references ADR 0015/0038 (the
  memory budgets being ported), ADR 0025 (guards follow text).

## 8. Open risks / implementation notes

- **The survival lens is judgment.** Move-verbatim makes eviction mechanically checkable, but
  compression and skeleton-writing are semantic — the lens is the control, and it is the same
  class of control the repo already trusts for audits. Flagged, accepted.
- **D5's 1.25 multiplier is a proposal, not a measurement** — `/red-team` adjudicates it (too
  tight starves routine doctrine growth between tighten passes; too loose never fires).
- **Literal-extraction fragility**: the budget test's ≥ 200 B template-literal measurement of
  `workflow-template.js` must tolerate engine refactors — anchor it on the same extraction the
  audit used and assert non-vacuity (zero extracted blocks = red, the fail-closed idiom).
- **Run config (operator-directed, 2026-07-28): default profile, all worker tiers fable/high** —
  `.claude/war/config.json` on the default (`balanced`) profile plus the worker override
  `agents.worker: { model: 'fable', effort: 'high', docs: { model: 'fable', effort: 'high' },
  fix: { model: 'fable', effort: 'high' } }`, so every worker spawn (base, docs-tier, fix/ace)
  runs fable/high — same directive as the evidence-precedence plan. Auditor, servitor, and
  red-team stay at profile defaults (`DEFAULTS` in `war-config.mjs` is the arbiter). With all
  three tiers pinned identically, the docs-vs-base classification (all-`*.md` vs mixed
  shrink+re-anchor tasks) no longer changes model or effort anywhere. The plan's Notes must carry
  this directive.

## 9. Non-goals / deferred

- **Engine logic, exit codes, schemas, floor scripts** — untouched (D1); a code-simplification
  pass is its own later spec with its own risk model.
- **Test-suite size** — tests never enter windows; maintenance cost only (D1 rejected arm).
- **`## Status` content redefinition** — separately diagnosed (release-note vs audit-trail); its
  own spec. This pass only inherits whatever the slot's rules are at execution time.
- **The memory subsystem itself** — it is the donor pattern, not a target; its budgets and
  `tighten` pass are untouched.
- **No new lint/AI judge for prose quality** — overclaim/quality judgment stays with auditor
  lenses and the authoring checklist (the recorded position: semantic judgments get no mechanical
  lint).

## 10. Validation criteria

1. Every evicted block appears byte-identical in its `references/` destination (`git diff`
   verifiable per move); every compression commit names the surviving canonical copy.
2. Zero doc-contract rows deleted or loosened; moved extraction regions re-anchored in the same
   task (the full gate is the arbiter).
3. Post-pass, every budgeted surface is under its advisory line, and the budget test reds on a
   1-byte crossing of any hard line (delete-the-feature check: remove one budget row constant and
   the test fails loudly, not vacuously).
4. Every trigger pointer in a shrunk surface states its condition; no surviving inline block in
   `skills/war/SKILL.md` is reachable only through a branch marker ("if docker", "on resume",
   "when held:") — greppable.
5. `skills/war/SKILL.md` measures ≤ 60% of its 95,586 B baseline at the pass's close (the
   centerpiece target; exact budget then set by D5's formula).
6. The growth measurement re-run at +5 releases shows at least one budgeted surface that shrank
   or held — the first non-monotonic interval in the repo's measured history (backstop-shaped;
   the runner is a future release, recorded in the plan's backstops).
