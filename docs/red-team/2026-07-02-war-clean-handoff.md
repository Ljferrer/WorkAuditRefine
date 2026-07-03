# Red Team — WAR clean handoff (2026-07-02)
**Verdict:** CLEARED-WITH-NOTES — two real coverage gaps and one unsatisfiable verify step patched into the plan; one probe misread refuted; all construct anchors hold at the post-roster tip.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (vs `docs/specs/2026-07-02-war-clean-handoff-design.md` + ADRs 0012/0013), consistency-placeholders, dependency-feasibility. Bespoke: anchor-check-template, anchor-check-agents-strategy-redteam, anchor-check-docs (analyzed), tests-run (executed). **Baseline pinned at `c8a6e8e`** (post-roster series tip — the plan's collision inventory was verified against the post-T1 constructs it names). Provision: `[]` (structural).

## Executed proof
- `executable-proof` ran the plan's T3 deliverable in a sandbox: inserting the 6th `intent-vs-plan` SPINE entry → **3 count-coupled tests go RED** (`out.expected===5` @ :102, `probePrompts.length===7` @ :127, plus the "All 5 spine" comment); restore → 29/29 green. This is reproduced evidence, folded into the plan (T3 now bumps all three in the same commit).
- `tests-run` → full resolved gate GREEN at `c8a6e8e`; `workflow-scaffold.test.mjs` green standalone; `war-strategy-structure.test.sh` green standalone; **roster mechanism proven live**: `validate()` on a config with `audit.covenSize` yields the courtesy error naming the key — plan 3 really is building on the post-roster base it claims.
- All three anchor probes: **pass, zero drift** — eager `minorsFiled` push + aced-splice, aceEligible regex refusing README, missing `required` array on AUDIT_VERDICT finding items, ghost-dep sweep → `landDecision` ternary seam, D7-guarded push sites, both-surfaces test pattern, war-worker plain `git push`, two `/red-team convert` mentions + two "no grilling loop" absolutes in war-strategy SKILL.md, fence-blind structure test guarding a subset of sections, ADRs 0012/0013 at `proposed`.

## Findings
### needsDecision (2 — both closed)
- [needsDecision→patched] T4's grep-verify ("zero surviving 'Minor/Nit → follow-up issues' in `skills/war/**`") was unsatisfiable — the phrase also lives in `gastown-design-params.md:24`, in no task's file list. → **Patched:** file added to T4 + a bullet rewriting its routing row to the disposition taxonomy.
- [needsDecision→refuted+clarified] "T2 edits red-team's files, violating file-disjointness" — misread: the two `/red-team convert` mentions are in war-strategy's OWN SKILL.md (:3, :101; anchor probe confirmed). Adversarial confirm refuted the finding but flagged the ambiguity → **plan wording clarified** ("in this file … no red-team files are touched").

### Minor (auto-fixed via plan patches)
- [Minor→patched] T3's count-coupled assertion breakage (executed-proven above) → bump instruction added, same commit.
- [Minor→patched] `skills/red-team/SKILL.md:25` "five **spine** lenses" was an unlisted stale-count surface → file added to T3, one-word fix.
- [Minor→dismissed] "`/red-team convert` mentions missing from red-team SKILL.md" — same wrong-file misread as the refuted needsDecision.

## Resolutions applied (grill decisions — AFK self-adjudication)
Four plan patches (T4 files+bullet; T2 clarifier; T3 count-bump instruction; T3 files+count-word) — all four re-verified resolved by a fresh probe against the pinned repo. The plan's ten operator-ratified Open decisions were ratified, not re-opened.

## Residual risk
- Coverage whole: 9/9 on-target, 0 dropped. Gate: pass 7 / warn 2 / fail 0; 0 hard blockers.
- Run-mechanics note for the Lead: the plan annotates tasks with the NEW `task.roster` schema but the run executes under the installed v0.9.0 plugin template — the Lead translates roster annotations to `coven`/`lenses` args at decompose (roadmap schema-epoch note). Default rosters → full trio coven; `[{correctness, neighbors}]` → solo (`coven:false`, `correctness` first lens).
- Criterion 12 (Appendix A replay) is spec-time-checkable, carried by the PR body, not a task — accepted.
