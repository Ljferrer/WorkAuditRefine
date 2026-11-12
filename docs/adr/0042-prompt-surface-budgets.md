# Prompt-surface budgets and the hot/cold law

**Status:** accepted (design ratified 2026-07-28; implementation tracked by
[the spec](../specs/2026-07-28-prompt-surface-simplification-design.md) and
[the plan](../plans/2026-07-28-prompt-surface-simplification.md))

Every prompt-bearing prose surface in this repo grew monotonically across the 0.14.38 → 0.14.67
release window (measured at `fa3c838`) with zero shrink events — `skills/war/SKILL.md` +33%,
`CONTEXT.md` +24%, the dispatched-prompt literals of `workflow-template.js` growing with the file.
The mechanism is a one-way ratchet with no
counterweight: auditor findings and incident lessons only ever *add* doctrine; nothing ever files
"this is too big". The memory subsystem already solved this exact problem shape — an advisory line,
an operator-gated `tighten` pass, a hard refusal, and temperature-is-location (archive = move,
never delete; [ADR 0015](0015-files-canonical-memory-with-derived-index.md),
[ADR 0038](0038-index-projection-bounded-two-column-view.md)). This ADR ports that governance to
the prompt surfaces, which — unlike memory — cost tokens on *every dispatch*.

## Decision

**Prompt-bearing prose surfaces carry standing, test-enforced byte budgets, and new doctrine
defaults to cold storage.** The resolved design tree (D1–D6):

- **D1 — Scope: prompt-bearing prose only.** SKILL.md files, standing agent cards,
  dispatched-prompt literals, `CLAUDE.md`/`CONTEXT.md` dedup. Engine logic and test suites are out
  of scope, and `README.md` is out of scope too — a human release surface (red-team adjudication
  dropped the spec's README-pointers arm; the trailing release-slot bump is its only touch).
- **D2 — Mechanism: full memory-pattern port.** A one-time shrink pass now, plus standing
  per-surface byte budgets (advisory + hard, enforced by
  `skills/war/assets/prompt-surface-budgets.test.mjs`), with `references/` as the archive
  analogue. Cold storage is unbudgeted, exactly like the memory roots' `archive/`.
- **D3 — Meaning preservation: move-verbatim + survival lens.** Eviction is a **byte-identical
  move** to a `references/` file plus a trigger pointer left behind — rewrite-while-moving is
  banned. Compression is allowed only for provable cross-surface redundancy, and the commit body
  must name the surviving canonical copy. A dedicated instruction-survival audit lens judges every
  shrink task; doc-contract suites stay green with their guards re-anchored in the same task.
- **D4 — The hot/cold law: branch-frequency tiers decide placement.** A block's temperature is how
  often a window pays for it unused that turn: every-phase > once-per-run > branch-gated >
  incident-only. Only tier-1 (every-invocation) doctrine stays inline; everything rarer becomes a
  pointer whose shape is fixed — `when <trigger>, read references/<file>` — the trigger *is* the
  skeleton. A pointer without a trigger is a defect. **Prompts are managed by least start** (operator
  ruling of 2026-11-09 on #2782): this is the Interpreted Context Methodology (ICM) with progressive
  disclosure. Each subagent starts with only what its dispatch needs, and the prompt tells it where
  to find a conditional rule when it meets the condition. The pointer shape covers dispatched
  prompts and agent cards as well as docs. The Workflow sandbox reads no files, but the agent it
  spawns does, so a dispatched prompt can carry a pointer.
- **D5 — Budget formula and the ratchet-down rule.** Per surface: **hard = post-shrink size × 1.25
  rounded up to the KB; advisory = post-shrink size × 1.10 rounded up to the KB** (red-team
  adjudication superseded the spec's original advisory = 80%-of-hard, whose product pinned the
  advisory line *at* the measured size with zero headroom). Constants live in the budget test with
  a comment naming this formula and the post-shrink measurement they derive from. Ratchet-down
  semantics: **lowering** a budget is a normal PR; **raising** one requires the commit body to cite
  this ADR and one of two reasons. *Tier-1 doctrine*: the text must stay inline, and the body says
  why it can be neither evicted nor compressed. *Net context saving*: the added bytes cut the
  context a dispatch loads, and the body states the bytes added and the measured or estimated
  tokens saved per dispatch. A byte budget exists to force judicious token spend; it does not exist
  to forbid growth (operator ruling of 2026-11-09 on #2782). The measured example: `ToolSearch` on
  the `tools:` line of `agents/war-evidence-auditor.md` costs 12 B and cuts first-turn context from
  341,316 to 26,296 tokens, and a `tools:` line on `agents/war-refiner.md` costs 43 B and cuts
  21,159 tokens ([ADR 0060](0060-enforce-each-rule-at-the-highest-level-that-can-express-it.md)
  holds the table). With prompts managed by least start (D4), budgets may be raised liberally, each
  raise with its cited reason. Dedup and eviction come first, and a raise without a cited reason is
  refused by `assert-budget-raise-cited.sh`. Byte budgets measure the card body and the template
  literals. They do not measure the tool surface or the plan data a prompt carries, and the
  2026-11-09 investigation found the largest per-dispatch costs there: a byte line is a proxy, and
  tokens per dispatch are the target. Crossing the advisory line warns (a log line); crossing the
  hard line is a red test. The glossary budget row sits on `GLOSSARY.md`, and `CONTEXT.md` (the
  router) carries its own small hard budget; `prompt-surface-budgets.test.mjs` owns the numbers.
- **D6 — Vehicle: one plan, phased per role-family.** A role's standing card and its
  dispatched-prompt literal move in the same commit, so every role-family shrink touches
  `workflow-template.js` — at most once per phase, forced by file-disjointness.

Guards follow their text ([ADR 0025](0025-drift-guard-discipline.md)): every
doc-contract extraction region whose pinned text moves to `references/` re-anchors in the same
task as the move.

## Considered options

- **Shrink-only (rejected).** A one-time pass with no standing budgets leaves the ratchet
  mechanism intact — the same monotonic growth resumes at the next release, and nothing ever
  fires "too big" again. The counterweight is the point.
- **Budgets-only (rejected).** Budgets set from pre-shrink sizes lock in the current bloat as the
  sanctioned baseline; the first routine doctrine addition then trips a hard line calibrated to
  nothing, forcing either an arbitrary raise (discrediting the ratchet rule on day one) or an
  unplanned eviction under pressure.
- **Size-threshold placement (rejected).** "Blocks over N bytes go cold" confuses size with
  temperature: a long every-invocation procedure belongs inline no matter its size, and a short
  incident-only note still costs every window it sits in. Branch frequency, not byte count, is
  what a window pays for.

## Relationship to prior ADRs

- [ADR 0015](0015-files-canonical-memory-with-derived-index.md) and
  [ADR 0038](0038-index-projection-bounded-two-column-view.md) — the donor pattern: memory's
  advisory/hard budgets, the tighten pass, and temperature-is-location. This ADR ports them;
  the memory subsystem itself is untouched.
- [ADR 0025](0025-drift-guard-discipline.md) — guards follow text: the re-anchor
  discipline that makes the shrink pass safe is the same standing duty applied to moves.

## Decision log

- 2026-11-05 · the glossary moved to `GLOSSARY.md` and took the `CONTEXT.md` budget row unchanged; `CONTEXT.md` took a new 2,048 B hard budget · issue #2636 · retired: docs/adr/0042-prompt-surface-budgets.md @ b31d2203
- 2026-11-09 · D5's raise rule widened: a net context saving is a valid cited reason to raise a budget; D4's pointer shape extended to dispatched prompts and agent cards (least start) · issues #2782, #2783, #2784 · failed because: the old rule admitted only tier-1 doctrine as a reason, so it blocked a 12 B `tools:` edit that saves about 315,000 tokens per dispatch · retired: docs/adr/0042-prompt-surface-budgets.md @ ca893c4f
