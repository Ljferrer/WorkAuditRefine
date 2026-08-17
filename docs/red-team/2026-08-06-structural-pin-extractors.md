# Red-team report — docs/plans/2026-08-06-structural-pin-extractors.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-17 · **Round limit:** 3 (config `run.redteamRoundLimit`) · **routeUpstream:** false
- **Base:** the STACKED base `99f64eb` (`dev/2026-08-06-structural-pin-extractors`, cut from plan 9's
  tip — PRs #1466 and #1483 both open beneath it). Byte-identity vs master FAILS for
  `workflow-template.js`/`.test.mjs` and `skills/war/SKILL.md` (plan 9 moved them), so every probe
  sandboxed from this base, never master. All three D12 witnesses verified live at it
  (`done_when_log_path` ≥ 1, `strictly stronger` = 0, `ABORTED` ≥ 1 — plans 3 and 6 LANDED).
- **artifactKind:** impl-plan (merged arm — Part 1 is its own source of truth)
- **Escape guard:** pre-run `--snapshot` exit 0 · post-run `--baseline` exit 0 — no probe residue, no ref deltas
- **ff-topology:** derived **vacuous** — no merge-topology anchors (End state 14 is explicitly
  range-level; the only `...` in the plan is a JS slice expression). Probe correctly not added.

## Attack surface / Executed proof

13/13 probes on target, 0 dropped, 0 off-target: 6 spine lenses + 7 bespoke (`base-census`,
`predecessor-witnesses`, `d6-borrow-repro`, `typeof-green-repro`, `d15-collision-trace`,
`endstate-checks-at-base`, `default-flip-old-absent`). 8 executed (sandboxed via
`git clone --no-hardlinks` — the repo is a linked worktree), 5 analyzed on `Explore`. 18 agents,
0 errors. Drift-guard spine: `default-flip-old-absent` ran executed (and found the two comment
retirements below); `unguarded-new-mirror` vacuous (zero production diff — `workflow-template.js`
untouched); `guard-split-deps-edge` vacuous (every guard rides the task authoring its fact; the D31
backtick key + SKILL.md clause are same-task same-commit by construction).

**Every substantive premise of the plan reproduced clean at the stacked base**: the D6 EOF-slice
guard-borrow false green (#1286's shape), both live arms guard-in-own-region under the D1 bound, the
typeof-conjunct delete leaving the suite green (#1334-1), all three D15 observables co-designable
(tightened keys match the live lead-in, reject both fixtures; untightened keys match the collided
fixture), both D9 keys matching the live line, the D10 insertion running green before and after, all
dated counts and zero-hit tokens holding (A2), and every End-state check executing at its stated
base value.

Gate accounting: 13 probes → **7 blockers (all Major), 3 needsDecision, 10 minors**.

## Findings and resolutions applied (all patched in place, stamped `adjudicated: true`)

The 7 blockers + 3 needsDecision collapse to **5 roots** — four probes converged on root 1.

### 1. Stale predecessor census: plan 5's landed edits to `skill-doc-contracts.test.mjs` denied (Major; 4 probes)

Context 10 / Note 5 / Task 1.2 claimed "No committed plan touches `skill-doc-contracts.test.mjs`
(verified: the nine committed plans' `- Files:` lines)" and called gate2 "unconverted". Reality at
the stacked base: plan 5 (`verdict-adjudication-integrity`, D18) added the D32 pointer-pair block to
that file and it is **landed** (~L1250–1330; `grep -Fc 'glossary-cold.md'` = 8); gate2 is a
committed plan whose Files line names both of Task 1.2's files; there are 14 committed plans. The
roadmap's contention row (`5 (red-team pass), 10, 12`) already recorded what the plan denied.
**Patched:** Context 10 rewritten (plan 5 as landed upstream editor, construct-disjoint; gate2
converted; correction provenance recorded); D12 + Task 1.2 gain a cheap witness —
`grep -Fc 'glossary-cold.md' skills/war/assets/skill-doc-contracts.test.mjs` ≥ 1 (8 at base), miss
⇒ halt. The operative conclusions (regions disjoint, this plan upstream of gate2) were re-verified
and stand.

### 2. End state 3's retirement grep was case-sensitive and wrap-fragile (Major; executed, confirmed)

`grep -c 'no contiguous copy of a dispatch label'` returns 0 (= pass) on a re-cased sentence-initial
restatement AND on the identical sentence soft-wrapped one word earlier — reproduced both against
copies of the live site. It also could not distinguish D3's scoping from A1's deletion fallback.
**Patched:** wrap- and case-tolerant form
(`tr '\n' ' ' | grep -oic 'copy of a dispatch label'` = 0; 1 at base; needle absent from D3's
sanctioned reword) plus a positive half — the reworded sentence carries the literal
`known contiguous label copies` (`grep -Fc` ≥ 1; 0 at base). Task 1.1 (d) mirrors both.

### 3. ES2's comment half was unpinned (Major, needsDecision; executed, confirmed)

Applying D1's bounding and leaving the "Region boundary (explicit)" comment byte-identical left End
state 2 fully green — the stale guard-branch-end claim survives with the code fixed, and the SOFT
hand-scan was scoped to "the EOF shape", the wrong bytes. **Adjudicated + patched:** ES2 gains
OLD-absent `grep -Fc 'matched dispatch label to the end'` = 0 (1 at base; the `2B guard branch`
literal deliberately NOT the anchor — it also appears in an unretired gloss) + NEW-present
`grep -Fc 'to the next label match'` ≥ 1 (0 at base; Task 1.1 (b) mandates the phrase); hand-scan
re-scoped to EOF-or-guard-branch-end shapes.

### 4. ES8/ES9's D31 comment retirements were NEW-present-only (Major, needsDecision; executed, confirmed)

The full mandated key-side deliverable lands with both stale comment claims byte-intact and every
gate green (reproduced: 23/23 suite, 1172/1172 full gate, with `catches every swap shape` and the
unqualified rule (b) sentence untouched) — the exact asymmetry vs sibling End states 3/11, over the
ADR 0025 class the plan exists to close. **Adjudicated + patched:** ES8 gains
`grep -Fc 'catches every swap shape'` = 0 (1 at base); ES9 gains the rule (b) pair — OLD-absent
`grep -Fc 'surfaced at the approval gate on interactive runs and refuses dispatch under --afk'` = 0
(1 at base, single-line anchor) + NEW-present `grep -Fc 'Legacy arm (checked first)'` ≥ 1 (0 at
base, mirroring the live SKILL.md wording). Task 1.2 (a)/(b) mirror the mandates. The rule (b)
literal ambiguity (two-line sentence) was settled by pinning the verified single-line substring.

### 5. End state 6's check was invariant to its own deliverable (Major; 2 probes)

The check grepped `workflow-template.js` — a file the plan itself proves Task 1.1 never touches —
so it read 6 before any work and 6 whether or not the census was ever written; the census was also
the one new guard with no demonstrated-RED. A sibling Minor: `grep -ioc` counts lines, not
occurrences (`-o` is inert under `-c`), so the pin could be measured wrong on a rebased base.
**Patched:** ES6 retargeted to the deliverable's surface (`grep -Fc 'must join the D6 sweep'`
in the test file ≥ 1; 0 at base — the census's mandated message literal), the pin VALUE re-measured
in occurrence semantics (`grep -io … | wc -l`; every `-ioc` mention in the plan corrected), and the
census's scratch-append demonstrated-RED added to Task 1.1 (g), D6's row, and the backstop register.

## Adjudications

| Row | Decision | Provenance |
|-----|----------|------------|
| ES2/ES8/ES9 comment retirements get mechanical OLD-absent halves (needsDecision "is gate-visibility wanted?") | YES — mirrors the plan's own ES3/ES11 sibling discipline; a validation in neither the gate, a floor, nor the backstops may not be waived in prose (ADR 0017) | AI-declared (2026-08-17) |
| ES2 anchor literal | `matched dispatch label to the end` (the `2B guard branch` alternative collides with an unretired gloss) | AI-declared (2026-08-17) |
| ES9 rule (b) anchor | the single-line substring `surfaced at the approval gate on interactive runs and refuses dispatch under --afk` (verified 1 at base); A3's friction valve concerns the arm keys' gaps, not comment literals — no conflict | AI-declared (2026-08-17) |
| ES3 positive discriminator | `known contiguous label copies` (0 at base; `fragment-built` REJECTED — already 1 at base, vacuous; caught by executing the candidate before committing it) | AI-declared (2026-08-17) |
| Task 1.2 witness | added (`glossary-cold.md` ≥ 1) — grounds the corrected census mechanically | AI-declared (2026-08-17) |

## Residual risk (minors, auto-noted)

- **AI-declared backstops + intent** (ADR 0014): every entry flagged for operator attention at the
  approval gate; the upgrade path is `/war-strategy docs/plans/2026-08-06-structural-pin-extractors.md`
  (settling A1 scope-vs-delete and A3 gap-friction in one volley). All six backstop entries carry
  concrete deferral reasons, runners, and timing (backstop-legitimacy check: pass). Judge-tag
  grading: ES10/ES12/ES14/ES16's `audit_sha` judgments are all justified — the evidence (a commit
  SHA or phase range) does not exist at any pre-merge gate; ES14 cites the ratified range-level
  lesson.
- Backstop enumeration corrected five → **nine** demonstrated-REDs (ES9's three clause-deletes and
  ES6's scratch-append were unregistered); Note 8's "Notes 1–7" → "Notes 1–9".
- SKILL.md budget truth: the advisory (64,512 B) is already tripped at base (65,123 B) — the plan
  now states the WARN is expected and binds against the hard line (73,728 B, ~8.6 KB headroom).
- ES3's fix-proposal needle in finding text (`grep -inc`) was NOT adopted verbatim — `-i` alone
  cannot survive a re-wrap; the adopted form joins lines first.
- Plan-9-style residuals accepted: the three hyphenated keep-green comment mentions remain the
  known census non-hits; nothing mechanical reads the Task 2.1 banner (the survey stays the only
  check, per D11's own statement).

## Round history

- **Round 1** (this run): 13 probes → BLOCKED (7 blockers / 3 needsDecision / 10 minors) → all 5
  roots patched in place → stamped → gate re-pipe → **ADJUDICATED** (blockers stay listed per
  ADR 0043; the persisted probe evidence at the task output file is unedited).
