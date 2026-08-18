# Red-team report — 2026-08-06-gate2-publication-guard

- **Verdict: ADJUDICATED** (gate-emitted, `red-team-gate.mjs --rounds=1 --round-limit=3`; ADR 0043 — every blocker patched in place and adjudication-rowed; patches not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-18 · **Mode:** `--afk` (Lead self-adjudication per the plan's own Open-decisions row: "/red-team — the sole downstream ratifier under `--afk`") · **artifactKind:** impl-plan (merged arm — the plan is its own source of truth)
- **Plan tip at patch:** the `dev/2026-08-06-gate2-publication-guard` branch (cut from master `a7a54da`); the plan text as patched by this round IS the dispatched text.

## Attack surface

12 probes (6 spine + 6 bespoke), each adversarially confirmed: `claims-vs-reality`, `executable-proof`, `coverage-vs-source` (merged arm), `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`; bespoke `baseline-census-repro`, `d22-decoy-repro`, `g13-ordering-and-bareness`, `default-flip-old-absent` (drift-guard spine #2), `anchor-constructs`, `backstop-judge-grading`. 22 agents (opus/high), 0 errors, 12/12 on-target, 0 dropped. Lead-run drift guards: `unguarded-new-mirror` vacuous-pass (no new inline mirror), `guard-split-deps-edge` pass (every D22 arm rides Task 1.1 with its prose; Task 1.2 carries the `deps: [1.1]` content edge). `ff-topology` not triggered (no merge-topology evidence anchors; End state 11 is range-level `git log --grep`). Escape guard clean both ends (`--snapshot`/`--baseline`, exit 0).

## Executed proof

- **`d22-decoy-repro` PASS — the plan's central defect premise reproduces at the live tip**: the live `D22_ORDERED_SPAN` match against the extracted Gate-2 region still terminates inside the termination sentence's prose `ensure-origin` mention, before the `provision-worktrees.sh ensure-origin` push-invocation offset.
- `baseline-census-repro`: G12 witnesses all present at the live tip (`clock read` 4, `backticks` 1, `D31_ARMS_COLLIDED` 2 — predecessors 9/10 landed); token censuses hold (SKILL.md 4 `ensure-origin` tokens on 3 lines, resume-and-recovery 2 on 1 line, setup.md 0/1); zero-hit witnesses hold; no pre-probe fetch in the region (Context 1 premise verified).
- `g13-ordering-and-bareness`: ordering fact verified — every in-region fetch-family token sits after the probe; the three existing D22 negative-reference constructs exist.
- `executable-proof`: proved the retirement-grep evasions (re-case → all four OLD-absent pins false-pass; comment re-wrap → three of four false-pass) with reproduced sandbox evidence.

## Findings → resolutions applied (all patched in place, adjudicated)

1. **ES5 RESIDUAL pin collides with an out-of-scope second carrier** (Major; 9 probes independently). `RESIDUAL, recorded rather than waived` now greps **2** file-wide — the D31 block landed a second carrier 2026-08-17 (#1487). The whole-file `→ 0` check could never pass a correct implementation. **Patched:** ES5 re-scoped to the D22-unique lead sentence (`… — TWO fragments`, 1 at live base → 0); Context 5, G16, Note 7(a), Task 1.1(c) restated; the D31 residual explicitly out of scope and staying.
2. **Retirement greps evadable by re-case and re-wrap** (Major ×2, `executable-proof`; the recorded `retirement-grep-…-case-insensitive` + wrap-split classes — and Task 1.1(d) is itself a comment re-wrap). **Patched:** every OLD-absent pin in ES5/7/8 now runs case-insensitively over a newline-collapsed stream (`tr '\n' ' ' | grep -io… | wc -l`); G16 gains the retirement-pin law; ES7 adds the sanctioned-replacement-substring caution (never reintroduce the retired count phrases in any casing).
3. **The re-anchored terminal arm shipped with zero committed both-ways proof** (Major, needsDecision; `intent-vs-plan` + `backstop-judge-grading`). G14's seven references contained none discriminating the G6 headline fix — the exact blind-spot class the plan's own Pivotal constraint forbids; only the uncommitted ES4 offset drill covered it. **Adjudicated + patched:** **reference (f)** added (push invocation dropped / bare in-region `ensure-origin` prose retained, asserted red) — G6, G14 (three updated + five new = **eight**), Task 1.1(c), ES4 (standing lock now = terminal arm + reference (f)), ES5, backstop #2 all updated.
4. **A7 falsified — the byte-budget advisory is already tripped at the live base** (Major needsDecision + 5 Minors). SKILL.md is 65,229 B vs the 64,512 B advisory (+717 B) before this plan adds a byte; "measurable only at the rebased base" was false, and `prompt-surface-budgets.test.mjs` (a gate member) is the deterministic measurer. **Adjudicated + patched:** Pivotal bullet, A7 row, and backstop #5 restated live; the ADR 0042 justification citation is now **unconditional** in the Task 1.1 commit body. AFK adjudication: additive prose on an over-advisory surface is sanctioned (advisory is warn-only; hard 73,728 B far; ADR 0042's justification rule is the designed valve); a shrink pass is out of scope.
5. **Backstop #4's census half over-deferred** (Minor needsDecision). The `ensure-origin` census is a pure per-file token count — mechanizable, D30 precedent, and its hand-held form is the exact rot this plan repairs. **Adjudicated + patched:** the census is mechanized as a default-deny D-row (ES7, Task 1.1(d)); backstop #4 narrowed to the genuinely-unmechanizable lesson-body prose scan.
6. **Two stale Context facts** (Minors). The "no 2026-08-06 survey manifest" sentence (one now exists, created 2026-08-13, corroborating the same grouping) and the region's "sole `fetch` token" undercount (three fetch-family tokens, all post-probe). **Patched:** both corrected in place.

## Adjudications

| Row | Decision | Provenance |
|---|---|---|
| A1 fetch idiom (one-command refresh, not fork-point state) | Ratified as carried | AI-declared, AFK round 1 |
| A2 fail-closed fetch posture | Ratified as carried | AI-declared, AFK round 1 |
| A3 comment-currency duty | Ratified as carried; extended with the census D-row (finding 5) | AI-declared, AFK round 1 |
| A4 worker edits committed lesson | Ratified as carried (precedent: plans 2/6/10 footprints) | AI-declared, AFK round 1 |
| A7 budget headroom | **Falsified**; replaced with unconditional ADR 0042 citation (finding 4) | AI-declared, AFK round 1 |
| Reference count | seven → **eight** (reference (f), finding 3); ES7 count-equals-enumeration follows | AI-declared, AFK round 1 |
| ES5 pin | whole-file bare literal → D22-unique `— TWO fragments` sentence, collapsed-stream `-i` form | AI-declared, AFK round 1 |
| Retirement-pin law | all OLD-absent pins `-i` + wrap-tolerant (G16) | AI-declared, AFK round 1 |
| Version literals | non-authoritative (standing); release resolves from live slots at land time | AI-declared, standing |

## Residual risk (auto-noted Minors)

- The five AI-declared backstop entries carry no human ratification (per-entry Minors) — ratified by this AFK round per the plan's Open-decisions delegation; the operator can re-open any at the PR.
- The AI-Commander's-Intent human upgrade path (`/war-strategy <plan>`) remains available; judged identically to operator intent this round.
- Dated snapshots (offsets, censuses, byte counts) re-measured at the rebased base by Task 1.1 as the plan already mandates.
- SKILL.md remains over its advisory byte line repo-wide — a standing WARN on every gate run, predating this plan; a shrink pass is a separate concern (not filed as an issue; the budget suite already surfaces it every run).
