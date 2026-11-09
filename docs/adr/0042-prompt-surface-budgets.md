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
  skeleton. A pointer without a trigger is a defect.
- **D5 — Budget formula and the ratchet-down rule.** Per surface: **hard = post-shrink size × 1.25
  rounded up to the KB; advisory = post-shrink size × 1.10 rounded up to the KB** (red-team
  adjudication superseded the spec's original advisory = 80%-of-hard, whose product pinned the
  advisory line *at* the measured size with zero headroom). Constants live in the budget test with
  a comment naming this formula and the post-shrink measurement they derive from. Ratchet-down
  semantics: **lowering** a budget is a normal PR; **raising** one requires the commit body to cite
  this ADR and name the tier-1 doctrine that must stay inline and why it can be neither evicted
  nor compressed. Crossing the advisory line warns (a log line); crossing the hard line is a red
  test.
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

## Amendment (2026-11-05): the glossary moved to GLOSSARY.md

#2636 moved the glossary out of `CONTEXT.md` into `GLOSSARY.md` as a byte-identical move
(ADR 0042 D3). `CONTEXT.md` is now the router: per role and per task, it names the file to read
next. Each `CONTEXT.md` citation above that names the glossary now means `GLOSSARY.md`.

The `CONTEXT.md` budget row moved to `GLOSSARY.md` unchanged (hard 131,072 B, advisory
111,616 B), and `CONTEXT.md` takes a new 2,048 B hard budget. No budget rose.

## Amendment (2026-11-09): a budget forces a justification, and least start licenses a raise

Operator rulings of 2026-11-09 on #2782. They bind every later session.

**Ruling 1: a byte budget exists to force judicious token spend. It does not exist to forbid
growth.** A change that spends more bytes on a budgeted surface and makes each dispatch load less
context is a valid reason to raise that budget. This widens D5's raise rule, which admitted only
tier-1 doctrine that must stay inline. A raise now cites this ADR and one of two reasons in the
commit body:

- *Tier-1 doctrine* (D5, unchanged): the text must stay inline, and the body says why it can be
  neither evicted nor compressed.
- *Net context saving* (new): the added bytes cut the context a dispatch loads. The body states
  the bytes added and the measured or estimated tokens saved per dispatch.

The measured example: `ToolSearch` on the `tools:` line of `agents/war-evidence-auditor.md` costs
12 B and cuts first-turn context from 341,316 to 26,296 tokens. A `tools:` line on
`agents/war-refiner.md` costs 43 B and cuts 21,159 tokens
([ADR 0060](0060-enforce-each-rule-at-the-highest-level-that-can-express-it.md) holds the table).

**Ruling 2: prompts are managed by least start.** This is the Interpreted Context Methodology
(ICM) with progressive disclosure: each subagent starts with only what its dispatch needs, and
the prompt tells it where to find a conditional rule when it meets the condition. D4's pointer
shape, `when <trigger>, read references/<file>`, now covers dispatched prompts and agent cards as
well as docs. The Workflow sandbox reads no files, but the agent it spawns does, so a dispatched
prompt can carry a pointer. With prompts managed this way, budgets may be raised liberally, each
raise with its cited reason.

What does not change: dedup and eviction come first, eviction is a byte-identical move (D3), a
raise without a cited reason is refused by `assert-budget-raise-cited.sh`, and lowering a budget
is a normal PR.

Byte budgets measure the card body and the template literals. They do not measure the tool
surface or the plan data a prompt carries, and the 2026-11-09 investigation found the largest
per-dispatch costs there. A byte line is a proxy. Tokens per dispatch are the target.

## Decision log

- 2026-11-05 · the glossary moved to `GLOSSARY.md` and took the `CONTEXT.md` budget row unchanged; `CONTEXT.md` took a new 2,048 B hard budget · issue #2636
- 2026-11-09 · D5's raise rule widened: a net context saving is a valid cited reason to raise a budget; D4's pointer shape extended to dispatched prompts and agent cards (least start) · issues #2782, #2783, #2784
