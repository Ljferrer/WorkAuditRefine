# Red-team report — 2026-08-06-references-pointer-integrity

- **Verdict: ADJUDICATED** (gate-emitted, `red-team-gate.mjs --rounds=1 --round-limit=3`; ADR 0043)
- **Rounds:** 1
- **Date:** 2026-08-18 · **Mode:** `--afk` (Lead self-adjudication) · **artifactKind:** impl-plan (merged arm)
- **Base:** probes ran against a dedicated clone at the **stacked base** `f2eb0ff` (dev tip, plans 1–12 landed) — not master; the plan text as patched IS the dispatched text.

## Attack surface

11 probes (6 spine + 5 bespoke: `baseline-census-repro`, `evasion-repro`, `anchor-constructs`, `default-flip-old-absent`, `backstop-judge-grading`), 22 agents (opus/high), 0 errors, 11/11 on-target, 0 dropped. Lead-run drift guards: `unguarded-new-mirror` vacuous-pass (template edits an explicit Non-goal), `guard-split-deps-edge` pass (C1 same-task ownership; C2 content edges). `ff-topology` not triggered (ES18 range-level). Escape guard clean both ends on the clone.

## Executed proof

All three mechanical defect premises **reproduce** at the stacked base: the wrap evasion (current single-space regex misses the wrapped caveat; the `\s+` form catches both), the `headerRegion` fail-open (whole-file return on a heading-less input), and the missing OLD-shape guard (a bare `](skills/` added to a card leaves `workflow-template.test.mjs` green). Witnesses all present at the base; censuses reproduced (13 line-hits, 4/3/3/1/2; `owner-relative` 8; ADR head 0046).

## Findings → resolutions (all patched in place, adjudicated)

1. **Refiner-card hard budget (Critical, needsDecision — 8 probes).** `war-refiner.md` is 34,760 B vs its 34,816 B hard line: **56 B headroom**, while the plan (on a stale 32,368 B snapshot claiming ~2.4 KB) adds 66 B of prefixes + a ~200 B D3 line — Task 1.2 as written reds `prompt-surface-budgets.test.mjs` at its own merge. **Adjudicated:** new Task 1.2 (h2) — a mandatory pre-flip **ADR 0042 byte-identical eviction** (≥ 400 B pure-reference block → `references/refiner-recovery.md` + anchored trigger pointer; never prose-thinning, never a decisive rule, hard constants untouched); D3 stays on all five cards; net arithmetic recorded.
2. **ES13 had no suite regex of record and an evadable pin (Major ×2).** Nothing pattern-matches `no path form resolves`; the `grep -Fc` pin evades by re-case/wrap — violating the batch's own retirement-pin law (plan 12 G16). **Patched:** Task 1.1(b) gains a third retirement pattern `/no\s+path\s+form\s+resolves/i` with wrapped control (C7 intermediate pin: ≤ 1 until Task 1.4 retires the carrier, then 0 — the recorded task-split-intermediate-state idiom); ES13's grep re-spelled collapsed-stream `-i`.
3. **Purpose over-claim (Major, needsDecision).** "A dispatched seat on ANY target repo can resolve every pointer" — no End state checks resolution, and the auditor guard *denies* `$`/`{`/`}` outright. **Adjudicated:** Purpose scoped to Bash-capable-seat resolution + the recorded auditor residual (harness substitution unverified / D3 fallback).
4. **A2 probe unrunnable (Major, needsDecision).** No card-injection path exists (`agent()` dispatches a prompt against a registry-named card). **Adjudicated:** backstop 1 discharged-as-unrunnable; A2 recorded **unverified-by-construction**; the ADR's seat-capability matrix words the auditor row fallback-first; backstop 6 (foreign-repo field evidence) is the remaining live-observation path. **D3 RATIFIED** — its role is now central.
5. **ES10's standing lock vacuous on the committed corpus (Major, needsDecision).** All five scanned files carry headings, so the fail-closed flip never fires in a real run. **Adjudicated:** Task 1.1(c) adds a committed synthetic-fixture assert pair (`headerRegion(<heading-less>) === null` + non-null control); backstop 2 narrowed; ES10 check extended.
6. **Budget valves prospective-but-already-tripped (Major).** Every named advisory is already over at the live base (war-auditor +1,394 B, war-worker +46 B, SKILL.md +1,085 B, CONTEXT.md +1,498 B — and plan 5's ≤ 111,616 B retarget was **never achieved**). **Patched:** live numbers throughout; ADR 0042 citations unconditional; backstop 5 narrowed to exact post-edit counts.
7. **Setup-scout link TEXT is the path (Minor, needsDecision).** Keeping "link text unchanged" would leave the retired `../` path displayed raw while the target-only census reads 0. **Adjudicated:** text rewritten together with the target where the text IS the path (~22–44 B, ample advisory room).
8. **Smaller corrections:** A5's QUALIFIED_HEADERS count is five (incl. `glossary-cold.md`), not four; the "walks OUT of the repo" straggler pin is now case-insensitive **and comment-leader-tolerant wrap-form** (`grep -ioE 'walks out of( *//)? *the repo'` → 2 — Lead-executed: the plain collapsed form still read 1, the Task 5.1 copy being wrap-split around a `//` leader); ES6/7/10 pins re-spelled to the retirement-pin law's collapsed-stream `-i` forms (all base values Lead-executed: 1/1/1/1).

## Adjudications

| Row | Decision | Provenance |
|---|---|---|
| Refiner hard budget | Task 1.2 (h2) eviction (ADR 0042 byte-identical move); hard constant untouched; D3 on all five cards | AI-declared, AFK round 1 |
| D3 | Ratified (A3) — now the auditor's sole deterministic resolution path on the plugin repo | AI-declared, AFK round 1 |
| A2 | Unverified-by-construction (no card-injection path); matrix worded fallback-first | AI-declared, AFK round 1 |
| Purpose | Scoped to Bash-capable seats + recorded auditor residual | AI-declared, AFK round 1 |
| ES13 lock | Third retirement pattern in Arm 3 (C7 intermediate pin ≤1 → 0 at Task 1.4) | AI-declared, AFK round 1 |
| ES10 lock | Committed synthetic-fixture assert pair | AI-declared, AFK round 1 |
| Retirement pins | All OLD-absent pins on the plan-12 G16 law (collapsed-stream `-i`; comment-leader tolerance where the needle lives in JS comments) | AI-declared, AFK round 1 |
| ADR number / version literals | Non-authoritative; next-free at land (0047 at verification, head 0046) | AI-declared, standing |

## Residual risk

29 auto-noted Minors ride the gate output (mostly dated-count restatements the plan already mandates re-measuring, plus the per-entry AI-declared backstop flags, ratified by this round per the plan's Open-decisions delegation). The foreign-repo field-evidence backstop remains the only live observation of end-to-end resolution — by design.
