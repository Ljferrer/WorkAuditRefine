# Red-team report — 2026-07-28-prompt-surface-simplification

Plan: `docs/plans/2026-07-28-prompt-surface-simplification.md` (amended `0dc004a`, incl. the
operator-directed #1200 fold-in as Task 1.3). Source spec:
`docs/specs/2026-07-28-prompt-surface-simplification-design.md`. Artifact kind: `impl-plan`.
Run: Workflow `wf_d40ba28d-d1a`, 23 agents (12 probes + 11 adversarial confirms), repo = a
detached clean worktree of the campaign branch at `0dc004a`. Escape guard clean (exit 0).
Probes ran on opus/high per the resolved `agents.redteam` config block.

## Verdict

**Gate verdict: `BLOCKED`** — 12/12 probes on-target (fingerprint-anchored), 0 dropped;
1 pass, 11 fail; 23 status-aware blockers, 19 `needsDecision`, 9 minors → **40 unique findings**
after cross-probe dedup, rooted in **13 defects**.

**Terminal state: OPERATOR-ADJUDICATED CLEAR (ratified, not AI-declared — ADR 0014 provenance;
restamped 2026-07-28 under the operator directive making /red-team's BLOCKED advisory to the Lead
once every root is patched with an adjudication row).** All 13 roots are patched into the plan in
place under AFK self-adjudication; the `## Adjudications` table below is the authority when any
seat disputes a superseded literal. The patched probes were **not re-run**: under the directive a
re-run is owed only where an EXECUTED probe proved the finding by running something AND the patch
changes what that same probe would measure — no root here meets both arms (the executed probes'
measurements were adopted by the patches, not contradicted by them).

## Attack surface / executed proof

- Spine: 6/6 ran (`claims-vs-reality`, `executable-proof`, `coverage-vs-source`,
  `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`).
- Bespoke: 6/6 ran — `baseline-repro` (executed), `tier-census-sample`,
  `literal-extraction-feasibility` (executed), `doc-contract-reanchor-census`,
  `cited-anchor-check`, `task13-attribution-anchors` (**the one clean pass** — the #1200
  fold-in's citations verified: 0029 Decision point 2 and 0024 §(C) carry the attributed rules).
- Executed sandbox proofs: one verbatim block eviction reds `diagnosis-preflight.test.sh`
  (proving the guard-inventory gap); a full-state template-literal scanner with exact backtick
  accounting (1,014/1,014) disproving the spec's literal-share row; byte re-measurement of every
  spec §1 baseline.
- `ff-topology`: **not derived** — no `^1` / `--first-parent` / three-dot / merge-commit token in
  the plan, and the hand-read confirms phases re-measure at the prior landed tip (tip-state, not
  merge topology).
- Lead-run checks: backstop-legitimacy 3/3 pass (concrete deferral reasons, runner + timing
  named, no cheaper pre-merge proxy); `unguarded-new-mirror` vacuous pass (no new inline mirror
  const); `default-flip-old-absent` analyzed pass-with-note (Task 7.1's OLD-absent is now pinned
  to the `PLACEHOLDER-BUDGET` token and carried in-gate — adjudication M closed the note).

## Findings → resolutions (13 roots, all patched)

1. **Guard-suite under-enumeration** (Critical ×2, Major ×8; five probes independently) — shrink
   tasks named one guard suite each while the shrunk surfaces are pinned by up to seven
   (`war-config.test.mjs` alone has ~15 `readDoc('skills/war/SKILL.md')` rows). → Adjudication E:
   discovery-based re-anchoring in Method + every shrink task; Files lists extended with the
   measured inventory.
2. **Task 6.2 removal-shaped with `requiresTest: false` and no guard access** → Adjudication L:
   `requiresTest: true`, Files += the two pinning suites, explicit no-touch constraint for
   Task 6.1's suite (file-disjointness by constraint).
3. **Advisory arithmetic** — 0.8 × 1.25 = 1.0 exactly; advisory sat AT the measured size and End
   state 6 was unsatisfiable on a KB boundary; deferred-validation 3's rationale false.
   → Adjudication D: advisory decoupled to post-shrink × 1.10 ceil-KB; grew-surface = blocking
   flag with a Lead-adjudication arm (also closes the End-state-6 vs Task-7.1 dead end).
4. **Stale baselines** — SKILL.md 96,608 B (not 95,586), war-auditor.md 23,823 B (not 20,559),
   both grown by plan 1's own landed work. → Adjudication B: all spec §1 literals are dated
   fa3c838 snapshots, non-authoritative, re-measure at task base.
5. **≤ 60% infeasible by moves alone** — full census: verbatim-move floor ~60.5% before pointer
   residue, ~63.2% after. → Adjudication A: End state 5 re-set to ≤ 65% of the measured base;
   tier-1 boundary pinned to the every-invocation reading (Setup/Decompose/Run-manifest/Finish
   stay inline), resolving the D4 ladder ambiguity that would otherwise evict the Lead's entry
   procedure.
6. **Spec literal-share row impossible** — 164,234 B claimed vs 131,454 B total non-comment
   bytes; true ≥ 200 B literal mass ≈ 108 blocks / ≈ 50.6 KB (22.6%). → Adjudication C: pinned
   extraction algorithm in Task 1.2 (nesting-aware, top-level, ≥ 200 B, comments excluded),
   measured at base.
7. **Both-surfaces registry rows cannot re-anchor to a runtime prompt string** (all 14 D3 rows
   list a dispatched surface). → Adjudication G: registry-pinned spans are carved OUT of the
   literal shrink; residue is the shrink set; End state 3 preserved absolutely.
8. **Card evictions had no destination directory** (no `agents/references/` exists; three
   non-equivalent homes possible). → Adjudication H: `skills/war/references/<role>-<topic>.md`;
   expected-carve files added to Files lists of 3.1/4.1/5.1.
9. **OLD-absent keys loosen if relocated** (six `doesNotMatch` keys in the lessons-learned suite,
   four inside the evicted tighten section). → Adjudication I: presence keys relocate; absence /
   whole-file keys become UNION scans over origin + every destination.
10. **Atomic-region splice risk** — D22's single ordered-regex Gate-2 region would silently
    split. → Adjudication J: atomic-region rule; D22 pinned inline tier-1, excluded from the
    eviction census; per-region disposition list in the done report.
11. **Purpose vs budgeted set** — "every prompt-bearing prose surface" excluded CONTEXT.md
    (100,984 B, the largest) and CLAUDE.md; D1's README arm had no task. → Adjudication F:
    CONTEXT.md + CLAUDE.md budget rows added to Task 1.2; README deliberately unbudgeted
    (human release surface), stated in Notes.
12. **Instruction-survival lens unwired** — named in Method, carried by no task. →
    Adjudication K: `instruction-survival` / `deep` on every shrink task's roster (2.1–6.2),
    stated as a plan-level Notes directive the Lead wires at decompose.
13. **Small-precision set** → Adjudication M: Task 3.1's "the gate-audit seat" corrected to all
    three gate-audit-family seats; `PLACEHOLDER-BUDGET` marker literal pinned (1.2) with a
    runnable case-insensitive grep + in-gate self-assertion (7.1); never-targeted
    `war-setup-scout.md` ratchets without a false "failed to shrink" flag; End state 4 handed to
    the `instruction-survival` seat (judgment, marker list as floor); run-config Note clarified
    (the fable/high override is the Lead's uncommitted campaign-managed config).

## Adjudications

Machine-readable; precedence: task instruction > red-team adjudication > plan body literal >
spec literal. Threaded into every `/war` seat of this plan's run.

| # | supersedes | ruling | applies at | note |
|---|-----------|--------|-----------|------|
| A | End state 5 "≤ 60% of its 95,586 B baseline"; Task 2.1 "the 95,586 B surface"; spec D4 tier ladder ambiguity | End state 5 = ≤ 65% of SKILL.md's size measured at Task 2.1's rebased base; tier 1 = text read on every /war invocation (Setup, Decompose, Per phase, Run manifest, Finish, Invariants inline); tier ≥ 2 = reachable only through a branch marker | Task 2.1, End-state seat | census: verbatim-move floor ~60.5% pre-pointer, ~63.2% post; 60% needs unauthorized compression |
| B | every spec §1 byte literal (95,586 / 20,559 / 98,947 / 224,165 / 48,889) | dated fa3c838 snapshots, non-authoritative; measure at the task's rebased base (96,608 / 23,823 / 100,984 / 227,469 / 45,645 at 0dc004a) | all phases | same treatment the plan gives ADR numbers and version slots |
| C | spec §1 workflow-template literal-share row "164,234 B / 238 blocks / 74%" | unreproducible (exceeds the file's non-comment total); pinned algorithm: nesting-aware top-level template literals, ≥ 200 B, comments excluded, measured at base (≈108 blocks / ≈50.6 KB at fa3c838) | Tasks 1.2, 7.1 | exact backtick accounting 1,014/1,014, stack balanced |
| D | spec D5 "advisory = 80% of hard" (× 1.25 = 1.0 exactly); Task 7.1 silent failed-to-shrink note | hard = post-shrink × 1.25 ceil-KB; advisory = post-shrink × 1.10 ceil-KB; a grown surface keeps its placeholder AND raises a blocking done-report flag for Lead adjudication | Tasks 1.2, 7.1; End state 6 | restores deferred-validation 3's rationale |
| E | per-task single-suite guard enumeration ("re-anchor every skill-doc-contracts / workflow-template row") | guard set is discovery-based: grep the surface path across **/*.test.mjs, **/*.test.sh, .tours/ at the task base; every pinning suite joins the same-task re-anchor; Files lists carry the 0dc004a inventory | Tasks 2.1, 3.1, 4.1, 5.1, 6.1, 6.2 | proven: one verbatim eviction reds diagnosis-preflight.test.sh |
| F | Task 1.2 row set (SKILL.md + agents/*.md + lessons-learned only); spec D1 "README pointers" arm | budget rows += CONTEXT.md and CLAUDE.md; README.md deliberately unbudgeted (human release surface; §5 table governs, D1's README arm dropped) | Tasks 1.2, 7.1 | CONTEXT.md is the largest prose surface (100,984 B) |
| G | Tasks 3.1/4.1/5.1 unqualified "shrink the … literals to skeleton + pointer" | registry / both-surfaces-pinned spans are EXCLUDED from the literal shrink (rows pin runtime prompt strings, no file re-anchor exists); the residue is the shrink set; negligible residue is reported, not forced | Tasks 3.1, 4.1, 5.1; End state 3 | all 14 D3 registry rows list a dispatched surface |
| H | unspecified eviction home for agent-card content (no agents/references/ exists) | destination = skills/war/references/<role>-<topic>.md; expected carves: auditor-teach.md, refiner-recovery.md, worker-servitor-edges.md (re-partition allowed) | Tasks 3.1, 4.1, 5.1 | existing plugin-rooted dir; dispatched agents Read it on demand |
| I | re-anchor recipe "repoint the read at the destination file" applied uniformly | presence keys relocate their read; OLD-absent / whole-file keys re-anchor as UNION scans over origin + every destination; done report states per-row which | Tasks 2.1, 6.1, 6.2; Method | relocating an absence key silently narrows the guard |
| J | implicit whole-region movability of every pinned extraction region | a region pinned by a single ordered/positional key is ATOMIC (moves whole or stays whole); D22's Gate-2 publication flow is pinned inline tier-1 and excluded from the eviction census | Task 2.1 | per-region disposition list required in the done report |
| K | Open-decision placeholder for the lens name/depth/wiring | minted lens `instruction-survival`, depth `deep`, on every shrink task's roster (2.1, 3.1, 4.1, 5.1, 6.1, 6.2); seat prompt: old text vs skeleton + reference at content-at-pin | Lead decompose; all shrink-task audits | plan schema has no roster field — the Lead wires it |
| L | Task 6.2 `Files: CLAUDE.md, CONTEXT.md` with requiresTest: false | Files += skill-doc-contracts.test.mjs, war-config.test.mjs; requiresTest: true; regions pinned by lessons-learned-doc-contract.test.mjs are NO-TOUCH (Task 6.1's suite, same phase — disjointness by constraint) | Task 6.2 | the only removal-shaped task had the least guard affordance |
| M | Task 3.1 "the gate-audit seat prompt" (one seat); unpinned placeholder marker; End state 4 "(greppable)"; Task 7.1 false-flag on never-targeted cards; Notes' claim the committed config carries fable/high | three gate-audit-family seats named; marker literal `PLACEHOLDER-BUDGET` + runnable grep + in-gate self-assert; End state 4 judged by the instruction-survival seat (marker list as floor); war-setup-scout.md ratchets unflagged; the override lives in the Lead's uncommitted campaign config | Tasks 3.1, 1.2, 7.1; End state 4; Notes | precision set, one row |
| N | — (prior adjudication, carried) | Task 1.3 / End state 10 fold-in of #1200 is operator-directed (2026-07-28, "Add #1200 to Plan 2"), outside the source spec's scope by design; the amended plan is authoritative — never spec drift | all phase-1 seats | citations verified by the task13-attribution-anchors probe (clean pass) |

## Residual risk (auto-noted minors)

- End state 4 is now explicitly judgment-based (the `instruction-survival` seat) — accepted; a
  purely mechanical marker grep cannot decide "reachable only through".
- The registry carve-out (G) may leave Phases 3–5 with modest literal shrink — the plan now says
  measure-and-report rather than force; the budget rows still land either way.
- The adjudicated clear is not re-proven (operator-ratified directive, 2026-07-28 — not mere
  precedent); the recorded 2026-07-26 lesson that a same-wave adjudication once proved
  insufficient is acknowledged — mitigation: every seat of this run receives the full A–N table,
  and disputes resolve to it, not to superseded literals.
- Spec file left byte-unchanged (decision record); the plan + this table carry every deviation.
  The `.tours/architect-war-system.tour` references to moved SKILL.md sections are in Task 2.1's
  Files and slice (tour rot is a recorded lesson class).
