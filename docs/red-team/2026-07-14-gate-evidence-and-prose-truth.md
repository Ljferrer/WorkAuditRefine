# Red-team report — 2026-07-14-gate-evidence-and-prose-truth

- **Plan:** `docs/plans/2026-07-14-gate-evidence-and-prose-truth.md`
- **Source spec:** `docs/specs/2026-07-14-gate-evidence-and-prose-truth-design.md`
- **artifactKind:** `impl-plan` (per-task `Files:` under `## Build order`; not red-first)
- **Run:** 2026-07-15, campaign `2026-07-14-survey-debt` (plan 1 of 3), self-adjudicating under AFK
  with two operator volleys (backstop adjudication; sweep-scope adjudication)
- **Verdict:** **CLEARED** (round 3: 11/11 probes pass, on-target, 0 blockers / 0 needsDecision / 0 minors)

## Attack surface / executed proof

Three Workflow rounds (`wf_1c65e029-e5a` → `wf_ddfb7aba-b3d` → `wf_76460056-c78`), model opus /
effort high (run config `agents.redteam`), provision `[]` (no manifest, empty `run.provision`).

| Round | Probes | Executed / analyzed | Verdict | Outcome |
|---|---|---|---|---|
| 1 | 14 (6 spine + 8 bespoke) | 5 / 9 | BLOCKED — 10 blockers, 3 needsDecision, 7 minors | 7 plan patches + 2 operator adjudications |
| 2 | 11 (5 spine + 6 re-verify) | 4 / 7 | BLOCKED — 7 blockers (6 targeted re-verifies all passed; spine found new defects, 2 of them introduced by round-1 patches) | 6 plan patches + 1 operator adjudication |
| 3 | 11 (5 spine + 6 re-verify) | 4 / 7 | **CLEARED** — 11 pass, 0 findings | — |

Coverage was whole every round (`onTarget == expected`, no off-target, no dropped probes).
`ff-topology` derivation: **not triggered** — token grep plus hand-read of the evidence-pipeline
prose found no merge-commit-topology anchors (End state 4's `git log --follow` and End state 6's
`merge-base --is-ancestor` are not first-parent/`^1` anchors). Recorded, not skipped.

**Escape guard:** exit 0 after round 1; exit 1 after rounds 2–3 — routed through the diagnosis
pre-flight (action-provenance first) and cleared both times: the only stray working-tree file was
the plan file itself, modified by the Lead's own sanctioned patches (the one write `/red-team`
authorizes). The `suite/`/`probe.mjs`/`wt-*.js` cruft one probe reported existed only inside its own
sandbox `cp -R` copy (untracked session dirs), never in the repo; the probe itself diagnosed it as a
copy artifact. Baseline suites verified green on a clean `git archive` copy: 795 pass / 0 fail.

## Findings and resolutions applied

### Round 1 (10 blockers → 7 patches)

1. **End state 2's first clause was vacuous** (executable-proof, endstate-discrimination,
   claims-vs-reality, consistency, intent-vs-plan — 5-probe convergence). `grep -c 'resolveGate'
   workflow-template.js` already returns 1 at base — from *prose* inside the emitted
   STALE-LOOKING-BUT-CORRECT calibration prompt (byte-mirrored with `agents/war-auditor.md`), not
   code. Mentally deleting all of Task 1.1 still passed the clause. **Patched:** End state 2 now
   anchors on named constructs (the guarded normalization statement; the mirror declaration in the
   extracted block) and names the D2 behavioral row as arbiter; it explicitly warns any composition
   grep must pin a token absent from the calibration prompt.
2. **Task 2.3 fixed only one of two backticked `_refinery` literals** (claims-vs-reality,
   dependency-feasibility, snippet-fidelity — independent convergence). The landed plan's `**#815:**`
   test-mapping sub-bullet (L48) restates the backticked form; the shipped test regex has no
   backticks; Task 2.3's scope, End state 8's grep, and End state 11's sweep list all missed it —
   the plan would land green while the landed doc still lied about its own test, the exact #893
   class. **Patched:** Task 2.3 now reaches both bullets, protects the two correct surfaces (End
   state #8 at L19; the L59 prose noun), and carries a grep-floor + manual-survey sweep; End state 8
   counts the backticked form (expect exactly 1 — the prose noun); End state 11 lists 2.3 as
   sweep-bearing.
3. **End state 8's absence guard was case-sensitive** (executable-proof; proven by sandbox
   mutation — the re-cased copy false-negated). **Patched:** `grep -c -i`, anchored on the interior
   token, per the recorded sentence-case false-negative class.
4. **The `classOf` misattribution had an unenumerated second surface** (default-flip-old-absent):
   the D14 block comment in `skill-doc-contracts.test.mjs` — not under `docs/specs/`, invisible to
   the #887 sweep; every End-state-10 check was bullet-scoped. **Patched:** enumerated and corrected
   in Task 2.1 (which already owns the file).
5. **The mandated composition point would crash on an absent `plan`** (dependency-feasibility;
   premises verified: no-default destructure at 202, entry validation never checks `plan`, the
   `plan &&` guard at 237 proves reachability). An unconditional `plan.gate = resolveGate(plan.gate)`
   would TypeError a plan-less zero-task phase into `held:workflow-error`, falsifying Task 2.2's own
   rationale. **Patched:** guarded form `if (plan) plan.gate = resolveGate(plan.gate)` mandated;
   absent-`plan` = no-op distinct from the null-gate arm; a plan-less/zero-task fixture arm added to
   the prompt-assert set; the fail-closed alternative explicitly rejected (spec §9 cut, recorded in
   Task 1.2's ADR).
6. **Backstop 1 could never fail** (backstop-legitimacy): the `--resolve-gate` belt composes the
   gate regardless, so the teed log is byte-identical whether engine composition works, is broken,
   or is absent — zero discriminating power. **Operator adjudication: DROPPED** (detection stays at
   the test layer, consistent with ratified Q12). The surviving double-run backstop genuinely
   discriminates (observable only with the new engine installed).
7. **Backstop 3 named a fictional runner** (backstop-legitimacy): `/survey-corps` mines memory
   lessons and open issues — it has no doc-drift mining; "only if it re-rots" fires after the
   failure; "the spec mandates no new guard" was false (the spec says no test *cascade*).
   **Operator adjudication: DEMOTED** to `## Notes / conscious deviations` as an accepted residual
   (the plan's own Q9 precedent). A residual with no runner is honest; a backstop with a fictional
   one is not.

### Round 2 (7 blockers → 6 patches; targeted re-verifies of round 1 all passed)

8. **Round-1 patch over-reach (Lead's):** the patched End state 10 declared a repo-scoped OLD-absent
   grep — inventing scope the spec never carries (criterion 10 is bullet-scoped), falsely flagging
   the plan's own source spec (which pairs `classOf` with the re-run while *describing the defect*),
   and vacuous on its motivating surface anyway (the D14 pairing wraps across two comment lines —
   invisible to any line-based grep). 3-probe convergence. **Patched:** reverted to bullet-scoped;
   surfaces enumerated each with its own closing mechanism; source spec marked "Not a surface"; the
   D14 sweep now mandates a multi-line matcher.
9. **Round-1 patch false claim (Lead's):** Task 1.1 asserted "a literal MIRRORED inline marker does
   not exist anywhere in the repo" — it exists 5× (`war-config.mjs` ×4, `land-decision.mjs` ×1). The
   convention is two-sided. **Patched:** false claim removed; Task 1.1 now adds the canonical-side
   `// MIRRORED inline in workflow-template.js. Keep in sync.` above `export function resolveGate`
   and appends `resolveGate` to the mirror-side block-head export list. (Root cause: the Lead wrote
   a round-1 probe's unverified "no matches" into the plan as fact — verify-before-adopting was
   skipped; recorded as a process lesson.)
10. **End state 7 / Task 2.2's only verification was case-sensitive** (executable-proof) — same
    class as finding 3, on the plan's other `requiresTest:false` guard. **Patched:** `grep -rin` on
    both surfaces, with the kept legitimate `zero-task` mention excluded by pairing the floor with a
    claim token.
11. **Guard-row misclassification** (consistency-placeholders): Task 2.1 classed both named rows as
    "guarding already-correct prose" (mental-delete exempt), but the docker-bullet row guards prose
    this very task corrects — End state 9 and grill Q6 already said so. **Patched:** only the
    2026-06-25 CAS row is exempt; the docker row carries a `Red-proof:` block.
12. **#887 sweep scale undisclosed** (dependency-feasibility, needsDecision): the 6-token grep
    matched 77 of 90 spec files (86% of the corpus) inside one already-loaded task. **Operator
    adjudication: NARROWED** to gate-mechanics tokens (`resolveGate|classOf|plan.gate`, ~15 files);
    rationale and the source-spec verified-correct carve-out disclosed in the plan.
13. **Stale Q29 map entry** (consistency minor): still routed #892 to "explicit backstop entry"
    after the demotion. **Patched:** points at the accepted-residual note.

### Round 3 — all resolutions verified

All six targeted re-verify probes passed (several with executed proof — the re-cased End-state-7
copy now correctly detects the residual; both sweep magnitudes confirmed at 77 → 15), and the five
re-run spine lenses found nothing new. No blocker reached its 2-round ceiling; no residual open
questions.

## Drift-guard spine probes

- **`unguarded-new-mirror`:** PASS — the new inline `resolveGate` mirror ships its D2 behavioral
  registry row (canonical-computed pre-composed fixture, `>= 8` floor bump) in the same Task 1.1.
- **`default-flip-old-absent`:** the round-1 finding (D14 second surface) — resolved per finding 4;
  scope adjudicated per finding 8.

## Adjudications

| # | Decision (operator, 2026-07-15) | Supersedes |
|---|---|---|
| 1 | Backstop "live-run refiner-executes-composed-gate" **dropped** — non-discriminating (belt composes regardless; log byte-identical under broken/absent engine composition) | Plan-body backstop entry 1 |
| 2 | Backstop "#892 unguarded prose" **demoted to Notes** as accepted residual — declared runner (`/survey-corps` doc-drift mining) does not exist; "spec mandates no new guard" was false | Plan-body backstop entry 3 |
| 3 | #887 sweep grep **narrowed** to `resolveGate\|classOf\|plan\.gate` (15 files) from the 6-token form (77/90 files) | Task 2.1 sweep grep literal |

No version/release-slot literals were adjudicated (the plan is directive-form throughout; Phase 3
resolves the next free patch at land time).

## Residual risk

- Round-1/2 minors were resolved by the blocker patches (the vacuous-grep and case-sensitivity
  minors shared roots with blockers) or auto-noted; round 3 reports zero minors.
- Accepted residuals recorded in the plan's `## Notes / conscious deviations`: the Q9
  double-composition residual (operator-ratified at conversion) and the demoted #892 unguarded-prose
  residual (adjudication 2). Both documented, neither presented as a deferred validation.
- The surviving backstops (2): the belt-and-suspenders double-run live check (runner: operator of
  the next `/war` run via the teed gate log) and the out-of-footprint survey stragglers (runner: the
  Lead files follow-up issues at phase close from the `Survey:` blocks).
