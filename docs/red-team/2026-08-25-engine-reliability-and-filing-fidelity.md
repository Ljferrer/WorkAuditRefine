# Red-team report — 2026-08-25-engine-reliability-and-filing-fidelity

**Verdict:** ADJUDICATED
**Rounds:** 1

Gate-emitted (`red-team-gate.mjs --rounds=1 --round-limit=3`): `ADJUDICATED`, `routeUpstream: false`.
Run under the 2026-08-25-survey-debt campaign, AFK self-adjudication. artifactKind: `impl-plan`.
Verification base: worktree tip `e804250` (= master `40afddb`, 0.20.0, with the plan committed).

## Attack surface / Executed proof

- 12 probes expected, 12 on-target, 0 dropped, 0 off-target (coverage whole).
- 6 spine lenses + 6 bespoke (3 drift-guard spine probes, `check-discrimination` + `baseline-behavior-repro` executed in throwaway `git clone --no-hardlinks` sandboxes, `anchor-check` analyzed — the sole clean pass).
- 11 probes returned fails; every fail adversarially confirmed (23 agents total, zero unreproduced findings).
- `default-flip-old-absent` drift probe: **vacuous** — the plan flips no defaults (new absent-default knob + new floors only). `ff-topology`: not triggered — no merge-topology evidence anchors (token grep + hand-read of the evidence-pipeline prose).
- Escape guard: pre-run snapshot taken; post-run `--baseline` diff exit 0 (no probe residue, no foreign deltas).

## Findings and resolutions (round 1 — all patched, stamped `adjudicated: true`)

Gate counts: 27 blockers / 22 needsDecision / 11 minors, deduplicating to eight root causes; the
counts overlap because multiple lenses confirmed the same roots. All 49 blocker/needsDecision
findings were patched in the plan in one sweep and adjudication-stamped (ADR 0043 — evidence rows
retained, never deleted). Root causes:

1. **#1692 fold over-claim** — the polish panel already routes `dispositionOf`/`parkAsk` on both terminal arms at 0.20.0; the fold is narrowed to the gate-audit-family lane with an explicit no-second-pass instruction (double-park would break `parkAsk`'s exactly-once contract).
2. **D11/A6 false premise** (Critical family) — no "merge-task INCOMPLETE re-dispatch shape" exists in the engine. Re-based on the real `FLOOR_STATUSES` retry-loop idiom; the segmented-land marker is an in-band field, never a status member; `MERGE_RESULT` widening is explicitly outside the pre-authorization (halts for re-plan). See Adjudications.
3. **Budget-Raise floor scope** — widened to any `hard:`/`advisory:` ceiling raise in `prompt-surface-budgets.test.mjs` (`FILE_BUDGETS` rows **and** `WORKFLOW_LITERAL_BUDGET`, default-deny against future siblings) — the latter is the ceiling this plan's own template growth would raise.
4. **Phase 2 Task 2 Critical knot** — `agents/war-refiner.md` has 68 B of headroom; the wiring is now byte-funded (same-commit byte-identical eviction into `skills/war/references/budget-raise-floor.md` behind a trigger pointer), the standing/dispatched twin edits are enumerated on all affected phases, Phase 2 Task 4 is a both-surfaces registry guard, and new End state 25 pins every touched budgeted surface under its ceiling.
5. **End state 2 honesty** — batching test proves ordering/batching semantics + a four-call-site census; wall-clock pacing is the deferred backstop.
6. **Check vacuity** — every suite-invoking End state re-scoped to a red-at-base `grep -F` presence pin on a fixture-title token (execution rides Done-when + gate). *Partial rebuttal of the gate's suggested mechanism:* an unmatched `--test-name-pattern` exits 0 on Node v24.17.0 (measured), so pattern-scoped checks would stay vacuous — printed-token pins used instead.
7. **#1693 fold precision** — `pinOrSentinel` is `integration_sha`-specific; the fold now specifies a new self-contained module-scope audit-sha validator with a sanctioned sibling copy + deps-edged regex-equality drift row.
8. **Notes hygiene** — retirement-grep floor rule restored with owners; #1708 clarified as folded into the doc-truth plan.

**Re-verification (executed cluster):** the patched plan's 27 `check:` rows were re-executed at base
in a fresh sandbox clone — 25 red-at-base, and the only 2 green are the disclosed invariant rows
(E17 version-slots, E25 budget suite), each carrying its compensating catch inline. The
check-vacuity findings are probe-proven resolved; they remain listed above per the ADR 0043
evidence-trail rule.

## Adjudications

| # | Decision | Provenance |
|---|---|---|
| 1 | D11/A6: the DECISION (in-band segmented-land marker, no enum widening, `KNOWN_LAND_DECISIONS` contingency pre-authorized in one commit) stands — **operator-ratified (2026-08-25)**; its ANCHOR re-based onto the `FLOOR_STATUSES` retry-loop idiom after the gate falsified the named shape — **AI-declared** | operator-ratified (2026-08-25) + AI-declared re-anchor |
| 2 | #1692 fold narrowed to the gate-audit-family lane (polish panel proven already compliant) | AI-declared (gate-proven), on an operator-ratified fold |
| 3 | #1712 folded, all three fixes (P8 T1 die-text holder + E26; P6 T3 ref-holder enumeration; P6 T1–2 sanctioned auto-free of clean same-plan holders + E27) | operator-ratified (2026-08-25) |
| 4 | Check-transport mechanism: `--test-name-pattern` rejected (exits 0 unmatched on Node 24, measured); printed-token `grep -F` pins adopted | AI-declared |

## Residual risk

- 11 minors: auto-fixed where mechanical (seatRef three-arm quote + `'unattributed'` preservation duty, Evidence-consumed per-issue roll-up, schemas.md run-config de-mirror, SKILL.md #1413 provenance de-mirror, ES4 ratchet-down qualifier, ES9 widened to both dispatch sites); the rest noted in the plan's Notes.
- Advisory lint: 1 hit (`hardcoded-version: 0.20.0`) — factual landed-release citations; the release phase stays directive-form.
- The plan's own `## Deferred validations (backstops)` rows stand as legitimacy-complete (checked per backstop-legitimacy: each names check, why-deferred, runner); wall-clock pacing (E2) joins them.
