# Red Team — 2026-08-25-ask-disposition (2026-08-25)
**Verdict:** ADJUDICATED — every blocker and needsDecision hole was patched into the plan and Lead-stamped after one operator grill sweep; no patched blocker was probe re-verified (ADR 0043).
**Rounds:** 1
<!-- Cumulative grill sweeps: seed 0 (no prior report) + 1 this run. -->

## Attack surface
Spine: claims-vs-reality · executable-proof · coverage-vs-source (merged arm; per-issue evidence join ran) · consistency-placeholders · dependency-feasibility · intent-vs-plan. Bespoke: command-diff, budget-arithmetic, anchor-check, default-flip-old-absent, issue-claims. Executed in sandbox: executable-proof, command-diff, budget-arithmetic, default-flip-old-absent. Lead-run: the four drift-guard spine probes (unguarded-new-mirror — vacuous pass; guard-split-deps-edge — pass, all edges present; touched-doc-fact-coverage — pass; default-flip-old-absent — delegated to the executed probe), backstop-legitimacy (both entries pass), `judge:`-tag grading (no judged tags; End state 15's non-runnable `gate:` justified). `ff-topology` not triggered (no merge-topology anchors, token scan + hand-read). artifactKind: impl-plan. Coverage 11/11 on-target, 0 dropped, 0 off-target.
Fallback: none — every analyzed probe ran on `Explore`.

## Executed proof
- All eight named check/gate suites run green at base `a60221a` in a `--no-hardlinks` clone (workflow-template, skill-doc-contracts, reference-link-integrity, doc-cli-consistency, land-decision, war-pipeline-structure, prompt-surface-budgets, version-slots).
- D12/D11 arithmetic confirmed exact: auditor card 28,672−26,990 = 1,682 B; SKILL.md 73,728−67,369 = 6,359 B; refiner card 34,816−34,622 = 194 B; the two evicted eligibility blockquotes measure 1,540 B.
- Sandbox demonstration: growing `agents/war-auditor.md` by ~3.4 kB left T1.1's five-suite Done-when green while `prompt-surface-budgets.test.mjs` red — the D9 failure mode, reproduced.
- CONTEXT.md append probes: +5,419 B reds the budget suite; seven glossary terms at measured in-file term costs (median 585 B, mean ~700 B, prior 8-term commit 702 B/term) cost 4.1–5.3 kB against 5,419 B hard headroom.
- CodeTour 0.0.61 (`dist/extension-node.js`): `line` resolves before `pattern`; `pattern` is consulted only when `line` is absent — a pattern beside a kept line is decorative (Lead-verified, operator rider).
- Escape guard: pre/post ref-diff clean (exit 0 with `--baseline`); no probe-authored residue.

## Findings
### Major (all patched + adjudicated; none probe re-verified)
- [Major·needsDecision] D12 omitted CONTEXT.md — the tightest touched budgeted surface (5,419 B hard headroom vs 4.1–5.3 kB of seven terms; open #1651 names exactly this) → D12 gains the CONTEXT.md row: ≤ 4,600 B whole-task net growth, suite-arbitrated via T2.3's Done-when; ordered fallback (in-file compression first, guard-home-co-owned eviction second); ~1 kB post-land residual accepted with #1651 kept open as the tracked restoration home.
- [Major·needsDecision] D10's tour re-anchor base unsatisfiable: step 4 (SKILL.md:122) sits below T2.1's Checkpoint insertions (dep-less sibling); step 2 (CONTEXT.md:106) already rotted at HEAD and further shifted by T2.3 (unedgeable — cycle) → D10 rewritten as the pattern-only anchor law: every touched step drops `line`, carries `pattern` alone; PIN-10 now carries the principle (a raw line anchor is lawful only into a file whose frozen base is sound for the anchoring task).
- [Major·needsDecision] D6's "SKILL.md render list" had no owner (ambiguous between the :107 Checkpoint handoff render and the :71 triple) → reclassified per operator as a homeless-ratified-fact ownership gap: it is the :107 handoff render; T2.1 owns the ninth `asks` entry (operator-action cluster, adjacent to follow-ups); T2.3 pins the 9-key order, not membership alone; End state 5 names it.
- [Minor·needsDecision] `demote()` "refuses ask loudly" had three non-equivalent implementations → semantics fixed: unconditional log() + re-route onto `asks[]`, never `minorsFiled`/`notes`, never a throw; exactly-once membership (dedup by finding identity) in End state 1's check; the sole ask→follow-up conversion is the Checkpoint `--afk` no-match arm; the throw-rejection rationale is recorded in the plan verbatim as the guard against a future "harden it to a throw" cleanup.
- [Major] `prompt-surface-budgets.test.mjs` was a touched guard suite outside every Done-when (D9's own failure mode, reproduced in sandbox) → appended to T1.1's and T2.3's Done-whens; D9 restated as six suites; PIN-9 guardrail updated.
- [Major] #1547's `## Evidence artifacts` section lists four artifacts, none in the Evidence-consumed block → all four added as unread-with-reason rows (target-repo/private/operator-local, unreachable from this checkout).
- [Major] End state 5 / T2.1 mis-anchored the producer and disposition-triple sentences into the Checkpoint (they live at the Decompose gate and Per-phase sections) → re-anchored; T2.1's slice states one operation per sentence.
- [Major] CONTEXT.md's **Adjudication** entry carries TWO producer edit sites (definition body + `_Avoid_` count line) while the plan named one, and the D19 guard is blind to the count → both sites named in T2.3 with a widened-count assertion beside the D19 row.

### Minor (auto-fixed in the plan)
- D12's over-advisory set was under-enumerated (four touched surfaces, not two; CLAUDE.md's 490 B advisory margin noted) → corrected.
- The eligibility-clause quotation silently dropped its parenthetical → quoted verbatim ("(mirror the value vs point at the source)").
- CONTEXT.md's own **Disposition** entry / exhaustiveness sentence / handoff key list were CLASS-2 sites outside the census grep surface, unnamed → named in T2.3 and End state 9.
- `skills/war/references/touched-doc-accuracy.md`:34–35 asserts the clarification lives on the auditor card — false the moment the eviction lands → file added to T1.1, re-pointed in the eviction commit.
- "The CLAUDE.md gospel line" misnamed the real anchor (the Known-traps disposition bullet) → re-anchored; pipeline-gospel section declared no-edit.
- "D2" overloaded (plan's D2 vs doc-cli-consistency's D2 census) → qualified at all three sites.
- T2.3's "its producer sentence" implied a CLAUDE.md producer home (zero `producer` tokens there) → the fifth home is CONTEXT.md's Adjudication entry, now explicit.
- A per-home OLD-absent read of D5 would mint a vacuous assert on the ADR 0013 home (no two-producer literal exists there) → OLD-absent scoped to the four literal-bearing homes; ADR 0013 additive-only.

## Resolutions applied (grill decisions)
- CONTEXT.md budget → operator: byte-cap-plus-ordered-fallback (per-term caps rejected as splittable; eviction rider co-owns tripped guard homes; #1651 stays open) → D12, T2.3 slice + Done-when, End state 9.
- Tour anchors → operator: pattern-only for sibling-edited steps + PIN-10 carries the principle + verify player resolution order → verification showed `line` always wins, so pattern-only extends to every touched step → D10, T2.5, End state 10, binding guardrails, servitor capture.
- D6 render list → operator: it is the :107 handoff render; ownership to T2.1, order-pin to T2.3; option-2 rejection recorded on the plan's own CLASS-2 law → D6, T2.1, T2.3, End state 5, Notes.
- demote() semantics → operator: unconditional re-route to `asks[]` with exactly-once assert; `--afk` no-match is a separate named site, never a bypass flag; throw-rejection recorded verbatim → Pivotal constraints, D1, End state 1, Notes.

## Adjudications
- CONTEXT.md whole-task net growth budget `≤ 4,600 B` with ordered fallback (compression → guard-home-co-owned eviction) supersedes the absent CONTEXT.md arithmetic in D12 — operator-ratified (2026-08-25)
- Pattern-only tour anchors on sibling-edited files + PIN-10 principle supersede D10's "re-anchor base carrying T1.1's insertions" — operator-ratified (2026-08-25)
- Pattern-only extended to ALL touched tour steps (CodeTour 0.0.61 resolves `line` before `pattern`; a kept line makes the added pattern decorative) supersedes "re-anchor the raw line anchors and add pattern keys" — AI-declared
- D6's third CLASS-2 mirror = the SKILL.md:107 Checkpoint handoff render, owned by T2.1 with T2.3's 9-key order pin, supersedes the unowned "SKILL.md render list" — operator-ratified (2026-08-25)
- `demote()` ask-refusal = unconditional log() + re-route onto `asks[]` (exactly-once, never a throw; `--afk` no-match conversion is a separate named site) supersedes the unspecified "refuses ask loudly" — operator-ratified (2026-08-25)
- T1.1 six-suite Done-when (prompt-surface-budgets appended; D9 "names six") supersedes the five-suite Done-when — AI-declared
- The 0.20.0 release literal was not adjudicated — the plan's directive form (next free minor above the live base, re-resolved at land) stands.

## Residual risk
- CONTEXT.md post-land residual is ~1 kB of hard headroom: the next addition anywhere re-triggers the budget fight — accepted; #1651 stays open as the tracked home for a deliberate #1586-style restoration pass.
- Four touched surfaces remain over advisory (warn-only, acknowledged in D12); CLAUDE.md's 490 B advisory margin may be crossed by the widened trap bullet (warn-only).
- Grind measurement is deliberately coarse (no round-level attribution) — the failure-routing asymmetry routes ambiguity to #1664; backstop row 1.
- The ask channel's live behavior is proven only by backstop row 2 (first carrying `/war` run's Checkpoint), not by any End state — as designed.
- No patched blocker was probe re-verified; the ADJUDICATED verdict records exactly that (ADR 0043).
