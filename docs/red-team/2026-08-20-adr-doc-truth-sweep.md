# Red Team — docs/plans/2026-08-06-adr-doc-truth-sweep.md (2026-08-20)
**Verdict:** ADJUDICATED — every blocker was patched into the plan and Lead-stamped; no probe re-proof was run against the patched text (patched-check literals were, however, executed against the base and behaved as designed).
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed (0 — no prior report) + this run's 1 sweep. -->

Run header: artifactKind **impl-plan** (classified in pre-flight; reported for operator eyeball). Base verified: `26b40d7` (== origin/master tip after fetch), live version 0.18.0. Config: `agents.redteam { model: opus, effort: high }`, `run.redteamRoundLimit: 3`. Provision: none (no manifest; structural fallback empty). `ff-topology`: not triggered — End state 20 is explicitly range-level (`git log --grep <phase-base>..<tip>`); no `^1`/`--first-parent`/three-dot per-task anchor by token grep or hand-read.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm — Part-1→Part-2), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: snippet-fidelity, anchor-check, baseline-repro, command-diff. Executed in sandbox: executable-proof, baseline-repro, command-diff (all via `git clone --no-hardlinks`; the target is a linked worktree, so clone was the only isolating form).
Lead-run: the four drift-guard spine probes — `unguarded-new-mirror` vacuous pass (no workflow-template.js edit), `default-flip-old-absent` vacuous (no default-flip/scope-narrow task), `guard-split-deps-edge` vacuous pass (no mechanical guard authored; the A3 contingency lives in the same Task 1.6 as its fact), `touched-doc-fact-coverage` pass (ADR counts de-mirrored per D2; exit-2 set, CHANGELOG version facts, and Status link line each carry a legitimacy-complete defer row). Backstop-legitimacy: all six entries legitimacy-complete; `judge:`-tag grading: End state 20's `HARD at audit_sha` is justified-judged (the phase range does not exist pre-merge), End state 21 is a proper `gate:` tag.
Fallback: none — every analyzed dispatch ran on `Explore` first try; no sticky pin engaged.
Escape guard: pre-run snapshot exit 0; post-run `--baseline` diff exit 0 — no probe residue, no ref deltas (no foreign deltas either).

## Executed proof
- 20 agents (10 probes + 10 adversarial confirms), 10/10 on-target `read_anchor`, 0 dropped, 0 off-target → coverage whole.
- executable-proof: every plan-shipped check/Done-when extracted and run at `26b40d7`; mocked landed states built for End states 13/15/16; re-cased/re-positioned guard probes run per the sentence-case class.
- command-diff: End-state checks 1–19, 22, 23 + all 8 Done-whens executed verbatim (20/21 skipped as judged/gate tags); defects confirmed in two independent clones.
- baseline-repro: all dated-snapshot counts re-measured (SKILL §2 block = 8 bullets incl. Dated-snapshots ✓; glossary terms = **7**, not 6; `VACUOUS` = **3**, not 2; strip_prose census = 2 ✓, `_hit_i` ≥ 1 — plan 4 landed; all six release commits exist; CHANGELOG.md absent ✓; all five arbiters green at base ✓; in-window release census now **18** releases 0.15.0→0.18.0).
- Lead post-patch: all 13 patched check literals executed against the base — every precondition half green, every deliverable half red, `! grep` pins inverted exactly as designed; zero stale literals (`six term`, `Both suite sites`, `exactly two sites`, `grep -B10`) remain in the plan.

## Findings
28 blockers + 9 needsDecision reported by the gate reduce to **10 distinct roots** (most reported independently by 5–8 probes, each adversarially confirmed):

### Critical / Major (all patched + adjudicated)
- [Critical] Glossary drift: `CONTEXT.md` `### Drift-guard discipline` defines **seven** bold terms (ADR 0025's Amendment (2026-08-19) forced **Touched-doc accuracy duty**, commit `6bd781d`, #1598) → the plan's `grep -qi 'six term'` pins (End state 4, Task 1.1 Done-when) forced a worker to choose between a false ADR note and a red gate. Resolution: re-measured to seven naming both amendments; checks re-pinned count-agnostic on the mandated phrase "owned by the live subsection" + the posterity pin `defining five terms`.
- [Critical] `VACUOUS` census: **three** live sites (285/504/**702**) — the third inside the #1412 L1/L2 block header (`b53c94c`), which Note 2 declared construct-disjoint while the file-wide `! grep -q 'VACUOUS'` Done-when demanded zero. Resolution (operator-ratified): Task 1.5 widened to all three sites; §6/D8/End state 10/Note 2 corrected; sweep widened to C/H/L families; `expect_deny_teach` fails loud a fortiori.
- [Major] End state 2's `grep -qF 'Amendment (2026-08'` contradicted the mandated "ADR 0037 Correction-note shape" (which writes **Correction**) and hard-pinned the land month. Resolution (operator-ratified): slice mandates `## Amendment (<land-date>, #1363)` (body in ADR 0037 correction shape); check de-dated to `grep -qiE '^#+ *(Amendment|Correction) \(20' … && grep -qF '#1363'`.
- [Major] Purpose's "never edit a ratified ADR byte" was checkable only for ADR 0030. Resolution (operator-ratified): mechanical posterity pins added (ADR 0033 ponytail fragment; ADR 0025 `defining five terms`) and End state 2's SOFT diff survey extended to all three amended ADRs.
- [Major] End state 7's `grep -B10` fixed context window undercaptures the grown comment; bare `grep -q '0037'` matches any digit run and `'canonical source'` is vacuous file-wide (the NAME_ANCHOR sibling already carries it). Resolution: re-pinned on `hand-maintained mirror` + `#1240` (both absent at base, both mandated by Task 1.3's wording).
- [Major] End state 6 grepped only the re-anchor targets (already green pre-repair — weak-assertion class). Resolution: check now also asserts ADR 0008 itself carries `6. State & resume` + `reset --hard` and no longer carries `the push-first-CAS clause`.
- [Major] End state 23 / Task 1.7 Done-when's `grep -qi 'live dump'` was vacuous (pre-existing body text, lesson line 50). Resolution: re-pinned on `stays empty` (unique to the corrected mechanism sentence).
- [Major] End state 17's `grep -qi 'release scope'` vs the plan's dominant hyphenation. Resolution: `grep -qiE 'release[- ]scope'`; same `[- ]` tolerance applied to End state 15's `release window`.
- [Major] End state 19: case-sensitive, hyphen-only, `docs/adr/`-omitting sweep vs Context claim 9's census; and claim 9's "0 hits for `all seven`" was false (2 benign hits in `workflow-template.test.mjs`). Resolution: `! grep -rinE 'seven[- ]item' … docs/adr/`; benign hits pre-recorded so the confirm-zero floor doesn't stop-and-report.
- [Minor→patched] D12's "after the blurb" placement ambiguity (dies at the next replace-in-place). Resolution (operator-ratified): the link line is the last line of the `## Status` section, after the final release bullet, blank-line separated; mirrored in Task 1.6 and Task 2.1.

### Minor (auto-fixed alongside)
- D19 + Intent Method said "six" tasks (Phase 1 has seven after the 2026-08-15 amendment) → seven.
- End state 3's `grep -q 'baseline'` case-sensitivity → `-qi`.
- Deferred validations' "End states 1–19" range excluded 23 → "1–19 and 23"; "the six-term count" → "the glossary term count".
- Task 1.1's exit-2 enumeration marked a drafting floor (the guard's header at the rebased base is the truth source — it documents more exit-2 conditions than the five listed).

## Resolutions applied (grill decisions)
- VACUOUS scope → widen Task 1.5 to 3 sites, keep file-wide pin → Task 1.5 slice/Done-when, §6, D8, End state 10, Note 2.
- ADR 0030 note shape → Amendment heading, de-dated check → Task 1.1 slice, End state 2.
- ADR byte-unchanged contract → mechanical posterity pins + 3-ADR survey → End states 2/3/4.
- CHANGELOG link placement → last line of `## Status` section → D12, Task 1.6, Task 2.1.

## Adjudications
- **0.18.1 — the next free patch (+0.0.1) above the live 0.18.0, resolved from the live slots at land time** supersedes every version literal in the plan, spec, and roadmap — Task 2.1 / D16 — operator-ratified (2026-08-20)
- **seven glossary terms (Guard-split deps edge ← Amendment 2026-08-02; Touched-doc accuracy duty ← Amendment 2026-08-19)** supersedes "six terms / `grep -qi 'six term'`" — Context §2(b), D3, Task 1.1, End state 4 — AI-declared
- **three `VACUOUS` sites (≈285/≈504/≈702 at `26b40d7`), Task 1.5 owns all three** supersedes "exactly two sites / Both suite sites" — Context §6, D8, Task 1.5, End state 10, Note 2 — operator-ratified (2026-08-20)
- **`## Amendment (<land-date>, #1363)` heading + `grep -qiE '^#+ *(Amendment|Correction) \(20' && grep -qF '#1363'`** supersedes `grep -qF 'Amendment (2026-08'` — Task 1.1, End state 2 — operator-ratified (2026-08-20)
- **mechanical posterity pins (ADR 0033 ponytail fragment; ADR 0025 `defining five terms`) + three-ADR SOFT diff survey** supersedes ADR-0030-only byte-unchanged verification — End states 2/3/4 — operator-ratified (2026-08-20)
- **CHANGELOG link line = last line of `## Status`, after the final release bullet, blank-line separated** supersedes "after the blurb" — D12, Task 1.6, Task 2.1 — operator-ratified (2026-08-20)
- **A1 ratified**: ADR 0046's README rule read as extending to `CHANGELOG.md`; compliance is costless either way, the plan complies unconditionally — Assumptions ledger A1 — AI-declared
- **A2/A3/A5/A6 stand as written** — each carries a legitimacy-complete backstop row (runner + timing named) — AI-declared

## Residual risk
- The awk lesson (`awk-empty-baseline-nr-fnr-degeneracy.md`) carries a second stale statement beyond the inverted mechanism sentence (its Concrete instance's claim that the guard "never checks `-s`" post-dates plan 2's zero-byte check) — Task 1.7's appended correction targets only the named inverted sentence; the worker's survey and the auditors should note the sibling, but widening the correction is upstream scope.
- Tour step 12's cited constructs now sit at `workflow-template.js` ≈2370–2381 (massive drift from ≈843–844) — absorbed by Task 1.4's re-derive-never-copy directive; noted so the worker expects it.
- The in-window release census is now 18 releases (0.15.0–0.18.0) — Task 1.6's bounded census absorbs it; the CHANGELOG will be materially larger than the drafting-base four entries.
- All six backstop entries are AI-declared (heading per ADR 0014) — operator attention recommended at the approval gate for each; the intent block is `## AI-Commander's Intent` — the human upgrade path is `/war-strategy docs/plans/2026-08-06-adr-doc-truth-sweep.md`.
- ADJUDICATED, not CLEARED: the patched checks were executed against the base by the Lead, but no probe re-dispatch re-proved the patched plan end-to-end (ADR 0043 — adjudication waives re-verification of the patch, never the validation itself; the /war run's gates and auditors are the next validation layer).
