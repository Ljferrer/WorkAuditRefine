# Red-team report — docs/plans/2026-08-06-war-strategy-mirror-guards.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-17 · **Round limit:** 3 (config `run.redteamRoundLimit`) · **routeUpstream:** false
- **Base:** `96fc992` (`dev/2026-08-06-war-strategy-mirror-guards`, cut from master AFTER the
  PR #1491 latitude-amendment merge and the plan-10 merge — the stack is fully plowed, so the
  branch is byte-identical to master; every probe sandboxed via `git clone --no-hardlinks`).
- **artifactKind:** impl-plan (merged arm — Part 1 is its own source of truth)
- **Escape guard:** pre-run `--snapshot` exit 0 · post-run `--baseline` exit 0 — no probe residue, no ref deltas
- **ff-topology:** derived **vacuous** — token grep + hand-read of the evidence prose found no
  merge-topology anchors (End state 10 is explicitly range-level). Probe correctly not added.

## Attack surface / Executed proof

14/14 probes on target, 0 dropped, 0 off-target: 6 spine lenses + 8 bespoke (`base-census-repro`,
`anchor-check`, `equality-atoms-extractable`, `default-flip-old-absent`, `sibling-pin-survival`,
`endstate-checks-executable`, `latitude-clause-vs-endstates`, `guard-split-and-mirror-discipline`).
7 executed, 7 analyzed on `Explore`; redteam seats on opus/high per run config. 22 agents, 0 errors.

**The plan's central mechanism reproduced FEASIBLE at base**: all five atoms extract non-empty from
both surfaces with the plan's own awk-range/normalize/span-trim recipe; after exactly the two
stated connective edits the D4/D5/D12 atoms normalize byte-equal (no residual diff); the tag-set
keyword projection agrees across surfaces; the D14 marker fragment exists on both sides. The
`default-flip-old-absent` drill: OLD-connective-retained compares unequal (the guard reds), and a
deleted section extracts empty, caught by the mandated non-empty asserts — the design's fail-loud
arm is real. All four sibling pin substrings live in the machine SKILL §2 step-1 region and are
pinned by the pipeline suite (post-plan-4 `_hit_i` helpers); the reconstructed retired phrases do
not match the plan's replacement wording in any casing. Every dated-snapshot count reproduced at
`96fc992` (both suites exit 0; `against the draft` = 1; doctrine-side pin census 0; `_hit_i` = 6;
the Context-9 six-surface latitude census all-zero).

Gate accounting: 14 probes → **20 blockers + 9 needsDecision (21 unique stamped findings), 21
minors**. The blockers collapse to **18 roots** (probe/confirm convergence).

## Findings and resolutions applied (all patched in place, stamped `adjudicated: true`)

Grouped by family; every patch is in the plan file, marked with a dated `/red-team` annotation.

**A — false anchors / half-applied 2026-08-15 amendment (5 roots):**
1. Task 2.1(c) targeted "the drafter's `## AI-Commander's Intent` authoring duty in
   `skills/war-machine/SKILL.md` §2" — **no such construct exists** (that duty lives in
   `references/afk-conversion.md`). Re-anchored to §2 step 1's drafter-charter parenthetical
   (keeps End state 14 satisfiable; afk-conversion.md stays untouched).
2. Pivotal "sibling suite is read-only" was stated absolutely while Task 2.1 edits that file —
   the 2026-08-15 amendment had scoped only the Non-goals twin. Rescoped to Phase 1 with the
   sanctioned Phase-2 exception named (as its Non-goals twin already was).
3. Task 2.2(e)/End state 16 cited "ADR 0013 §3" — the ADR has no numbered sections. Re-anchored
   to a new `## Amendment (2026-08-17)` section clarifying Decision 3, per the file's own
   amendment convention.
4. Context 8 (reflexivity) and Context 6(b) ("zero file overlap") stated Phase-1 truths
   unscoped — both scoped to Phase 1 with the Phase-2 exceptions named.
5. Note 10(ii) attributed `agents/war-auditor.md` to plan 5; the owner is plan 6 Phase 2
   (roadmap concurs). Corrected; the contention-safety conclusion survives.

**B — Phase-2 verification gaps (4 roots):**
6. Task 2.2(d) directed growing "the D3 both-surfaces directive registry row that anchors the
   intent threading" — **no such row exists**, and the registry's worker surfaces are captured
   from an intent-LESS fixture (`workerIntentClause` = `''` there), so the new regexes could
   never fire. Reworded: a NEW registry row captured from a latitude-bearing-intent fixture run
   (with the `REGISTRY.length` floor + enumerating message bumped same commit), or the standalone
   intent-present/latitude tests as the second arm.
7. Phase 2's new pins had no mutation-proof duty and no backstop rows (the Pivotal protocol
   says "every new guard"). Added mutation-proof steps to Tasks 2.1/2.2 and backstop rows
   Red-proof 5 (Phase-2 pins) and Red-proof 6 (delete-the-feature on a runtime surface).
8. Task 2.1's lock-step pins covered only the SKILL side + machine twin, leaving the
   interview beat (`plan-interview.md`) unpinned — the third authoring surface. Added its
   presence pin to the pin list.
9. End state 10 covered only Phase-1 issue citations. Added the Phase-2 twin (#1431 range-level
   + Phase-2 mutation proofs verbatim).

**C — overclaims narrowed to the mechanism's teeth (5 roots):**
10. Purpose/Method never mentioned Phase 2 (End states 13–16 sat under a Phase-1-only Purpose).
    Both extended with the latitude goal and mechanisms.
11. Context 1 claimed the law is "stated twice" — the D5 rule has a THIRD in-tree restatement
    inside the merged-template fence (byte-frozen region, carrying the retired connective).
    Scope-noted as a known unguarded third copy; **follow-up filed: #1494**.
12. End state 2's universal "rewording ANY atom reds" was unsatisfiable for the tag-set atom
    (keyword-sequence granularity by design) and D14 (marker presence; Note 5's own concession).
    Narrowed to the mechanism's stated teeth, in ES2 and Purpose.
13. End state 15 / guardrails claimed "absent a clause every surface reads byte-identically to
    today" while Task 2.2 appends unconditional prose to those surfaces. Restated: clause-less
    intent → same adjudication outcome; intent-absent run → byte-identical dispatched prompts.
    ES15's multi-file `grep -c` also made "≥ 1 in each" undecidable — now run per file.
14. End state 8's check was case-sensitive (a re-cased reintroduction evaded it) and anchored on
    the phrase that moves. Hardened: `grep -in`, location-explicit (step 1's derive-then-apply
    clause, step-2-application half).

**D — the Intent latitude clause's own defects (3 roots — the dogfooded #1491 bullets):**
15. "awk/sed vs a node one-liner" licensed a substitution three binding passages forbid (the
    suite's bash-3.2/plain-tools floor). Scoped to POSIX awk-vs-sed idiom choice within the floor.
16. "the assembly method of the re-cased fixtures" licensed deriving fixtures from the `rN`
    variables — exactly what the fixture-independence constraint forbids (it would make the #1308
    control tautological). Carved out: independent restatement only; fixture independence added
    to Binding guardrails.
17. End state 13's ADR 0017 bound sentence was unpinned, so the Phase-2 wording latitude could
    dilute it — the clause swallowing part of its own End state. Pinned the literal
    `never waives a check, gate, or backstop` (Task 2.1 pin + ES13 check), removing it from the
    latitude by construction.

**Also folded from minors:** ES5 narrowed (substitution to a *different letter* — case flips are
invisible to `grep -qiF` by design; the deletion carve-out scoped to trailing `rNb` fragments);
the tag-set projector tokens sharpened to colon-bearing word-boundary-safe forms (`check:` etc. —
"checkable" never counts); banner currency (D12) extended to both edited suites; a
`workflow-template.js` prompt-budget pre-flight added to Task 2.2 (61,075 B vs the 62,464 B hard
line at base); mutation-drill latitude item narrowed to technique-never-coverage; Note 10 now
records the three amendment passes (2026-08-15 fold · 2026-08-17 PR #1491 intent bullets ·
2026-08-17 red-team hardening).

## Adjudications

| # | Adjudicated value | Supersedes | Provenance |
|---|---|---|---|
| 1 | Task 2.1(c) anchors on §2 step 1's drafter-charter parenthetical in `skills/war-machine/SKILL.md` | "the drafter's `## AI-Commander's Intent` authoring duty" (nonexistent) | AI-declared (option (i) of the probe's fix — keeps ES14 satisfiable, zero new files) |
| 2 | ADR 0013 edit = appended `## Amendment (2026-08-17)` clarifying Decision 3 | "ADR 0013 §3 amendment" (no §3 exists) | AI-declared |
| 3 | Task 2.2(d) = new intent-fixture-anchored registry row (floor bump same commit), or standalone intent-test growth | "grow the D3 … registry row that anchors the intent threading" (no such row; intent-less fixtures) | AI-declared |
| 4 | ES15 invariant = behavioral (clause-less same outcome; intent-absent byte-identical prompts) | "absent a clause every surface reads byte-identically" | AI-declared |
| 5 | ES2/Purpose narrowed: sentence atoms red on reword; tag-set at keyword-sequence granularity; D14 at marker presence | the universal any-atom-reword-reds claim | AI-declared (A2/A3 fallbacks left unexercised — spec-carried) |
| 6 | Context 1 scoped to the two law-statement bullets; fence third copy = known unguarded, #1494 | "stated twice" as a completeness claim | AI-declared |
| 7 | Latitude items scoped (POSIX-idiom-only; independent fixtures; technique-never-coverage); guardrails + fixture independence + Phase-1 freezes; ADR 0017 bound pinned | the 2026-08-17 PR #1491 bullet wording | AI-declared |
| 8 | Release version resolves from live slots at land time (base 0.17.10 → next free 0.17.11 if unchanged) | any version literal anywhere in plan/roadmap | AI-declared (standing campaign rule) |

## Residual risk

- 21 gate minors, none patched-worthy beyond the folds above; the two structural notes kept as-is:
  the `Dn` design-row/law-atom namespace collision (cosmetic; a rename sweep would churn every
  D-row reference for no mechanical gain) and the human-upgrade-path note (AFK run — the
  AI-Commander's Intent stays AI-declared; ADR 0014 markers carried throughout).
- Backstop-legitimacy (Lead-run): all 6 rows pass (concrete deferral reasons, named runners +
  timing, no cheaper pre-merge proxy); per the AI-declared rule each carries the standing
  operator-attention Minor. The two rows added this round (Red-proofs 5–6) inherit the same shape.
- `judge:`-tag grading: ES10 (both halves) justified-judged — range exists only post-merge; the
  command is named in the tag; mutation proofs are deliberately-uncommitted done-report evidence.
- The live-run latitude backstop (plan 11's own) is dischargeable by plans 12–13, whose intents
  carry the clause (PR #1491) — tracked with the before/after study in #1492.
- Foreign-repo caveat: none — repo is the campaign superproject, sandboxed clone.

## Loop accounting

Round 1 = the single full grill sweep (18 roots, self-adjudicated under the operator's standing
--afk directive; none met the unresolvable bar). Every patched blocker is stamped
`adjudicated: true` in the gate working copy and retained in the finding set — none deleted; the
persisted task output (`wg8jlmbbk.output`) is unedited evidence. Re-verify attempts: 0 (no patched
blocker changed what an executed probe measures at BASE — the patches change the plan's directives,
not base state; the probes' base-state findings stand as evidence).
