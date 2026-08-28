# Red-team report — in-run-finding-resolution

**Verdict:** ADJUDICATED (gate-emitted, round 1; `routeUpstream: false`)
**Rounds:** 1

Plan: `docs/plans/2026-08-27-in-run-finding-resolution.md` (merged arm — its own source
of truth) · repo under test: clean clone @ `20407a0` (master, 0.20.1) · artifactKind:
`impl-plan` · assets: 0.20.1 (operator-directed mid-run switch from the session-loaded
0.20.0 cache) · mode: interactive (operator present; grill answered live).

## Attack surface / Executed proof

8/8 probes on-target, 0 dropped, 0 off-target: 6 spine lenses + 2 bespoke
(`default-flip-old-absent` executed against End state 9; `fold-anchor-and-reserve-check`
executed against the four fold sites + the reserve premise). 3 executed / 5 analyzed;
7 fail, 1 warn at round 0 → 25 blockers / 11 needsDecision / 17 minors, deduplicated to
12 roots. Lead-run drift-guard passes: `unguarded-new-mirror` vacuous-pass,
`guard-split-deps-edge` pass, backstop-legitimacy pass. Escape guard: snapshot + baseline
both exit 0 (no probe-authored residue).

## Findings and resolutions applied (round 1)

**Operator-ruled (4):**
1. **ES9 × ADR append-only (Critical family, 9 findings)** — 'demotes on budget' lives
   inside ADR 0013's ratified 2026-08-20 amendment; it cannot be absent AND
   byte-untouched. RULED: append-only law wins — Task 2 appends a dated note with
   explicit supersession language; End state 9's ADR conjunct retargeted to NEW-present
   (`floor-retry reserve`, zero-hit at base); OLD-absent kept for the three living-doc
   homes; Task 3's guard rows scope to the living docs with the ADR exemption stated in
   the row comment. #1850 (living-ADR direction) noted as ratified-but-deferred until
   after this plan. **Probe-proven resolved**: the patched check re-run red on a stale
   living-doc surface and green on complete execution — findings removed.
2. **Lens mechanism (ES7)** — the gate-audit labels carry no lens token; segment-before
   would yield `phase-1`. RULED: family-prefix rule (first segment `gate-audit` ⇒
   `execution-evidence`; else trailing-segment with `:rebut` strip) — subsumes every
   future family label, zero record-shape churn; wrong-yield negative control pinned.
3. **Interactive ruled-ask litter (Purpose contradiction)** — RULED: extend, with the
   vehicle corrected for Checkpoint timing (asks are ruled post-land, after the ladder
   closes): next-phase decompose-injection as a first-class task, or a final-phase
   polish-style dispatch bounded at one round; filing ONLY on cannot-execute or
   execution-failure; ruled-ask adjudication rows written in standing-row format so
   interactive rulings compound into `--afk` citation sources. New D15/PIN-17/18,
   End state 12, SKILL.md Checkpoint edit.
4. **CONTEXT.md bytes + sink count** — RULED: evict-to-fund (in-task ADR-0042 eviction,
   coldness criterion stated, guard rows re-anchor lock-step, ~1 KB slack, never a
   raise); #1790's fix covers all THREE measured sinks (~:2610, :2686, :2729) via one
   parametrized fixture + no-silent-discard negative control.

**Mechanically patched + adjudicated (7 families):** stale fold line cites re-anchored
(#1810 → :893; #1789 → :3340 — the cited :2613 was #1790's code; #1790 → :2607-2611);
End state 10's vacuous `re-audit` needle replaced (`born at a re-audit` +
`disposition-prompt-widened` fixture predicate, both zero-hit at base); the
`file-followups.md` standing leg added to Task 1 (its ~:5918 pin moves lock-step);
byte-budget rows completed (CONTEXT.md 632 B hard headroom; workflow-template.js
prompt-literal 5,359 B); Done-whens widened (Task 1 + `reference-link-integrity`,
Task 3 + `war-pipeline-structure.test.sh`) and A3's check restated; Evidence-consumed
rows added for #1731's cited artifacts (#1563, #1547, #1726, #1562, #1549, #1664,
#1550; journal unread-with-reason); the reserve law rescoped (subset commits only —
the batch ace keeps `< roundLimit`; re-entry adds a NEW `< roundLimit − 2` gate).

## Adjudications

| Adjudicated value | Supersedes | Provenance |
|---|---|---|
| ES9 ADR conjunct = NEW-present (`floor-retry reserve` note); ADR text append-only | plan-body OLD-absent grep over the ADR home | operator-ratified (2026-08-27) |
| Lens extraction = family-prefix rule | plan-body two-suffix enumeration | operator-ratified (2026-08-27) |
| Ruled asks execute in-run via decompose-injection / final-phase polish dispatch; filing on non-execution only | landed ruled-ask filing parity (unconditional filing) — SKILL.md edit in Task 3 | operator-ratified (2026-08-27) |
| #1790 scope = all three sinks; CONTEXT.md funded by in-task eviction, ~1 KB slack | plan-body one-sink claim; unstated CONTEXT funding | operator-ratified (2026-08-27) |
| Batch-ace gate stays `< roundLimit`; re-entry gate is new at `< roundLimit − 2` | plan-body "reserve is landed law for subset/absorb" overclaim | operator-ratified (2026-08-27) |

All 23 remaining listed findings carry `adjudicated: true` (patched, not re-verified —
ADR 0043); the 9 ES9-family findings were removed as probe-proven resolved.

## Residual risk

Minors auto-noted/fixed in the same patch pass (stale cross-references, needle
decisiveness annotations, the retire-count reword to "five war-followups + four
enhancements"). The plan-4 contention note stands (plan 4 re-amended post-land). The
three deferred-validation rows are unchanged and legitimacy-complete.
