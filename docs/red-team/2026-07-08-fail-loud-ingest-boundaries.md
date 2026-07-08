# Red-team report — fail-loud ingest boundaries

**Plan:** `docs/plans/2026-07-08-fail-loud-ingest-boundaries.md`
**Source spec:** `docs/specs/2026-07-08-fail-loud-ingest-boundaries-design.md`
**Repo state verified against:** `dev/2026-07-08-fail-loud-ingest-boundaries` @ `399f56d` (== `origin/master`; contains PR #616 + #625)
**Date:** 2026-07-08
**Verdict:** ✅ **CLEARED-WITH-NOTES**

## Attack surface

10 probes (6 spine + 4 bespoke), all executed, **10/10 on-target** (every probe attested reading the fingerprinted plan), **0 dropped, 0 off-target**. Coverage whole → not `INCOMPLETE`.

- Spine: `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`.
- Bespoke: `anchor-fidelity` (all existing-code anchors present, `unwrapEnvelope` correctly absent as the deliverable), `spine-floor-code-fact` (the plan's ≥6→≥4 spine correction of the spec is itself correct), `task-disjointness-and-merge-adjacency`, `backstop-legitimacy` (both backstop entries well-scoped).

## Executed proof

`executable-proof` (throwaway sandbox `rt-sbx2`, never touched the repo): ran `campaign-ledger.mjs init` against a synthesized canonical table roadmap and `red-team-gate.mjs --stdin` against synthesized envelope / unwrapped / coverage-null fixtures; ran the existing suites at tip — all green. Result: `pass`, no findings.

## Findings & resolutions

**0 blockers, 0 needsDecision.** Two Minors, both the same CONFIRMED point:

- **[Minor · fixed in place]** The `## Notes / conscious deviations` "Merge adjacency" and "Roadmap contention" bullets described the diagnosis-preflight plan (`2026-07-07-diagnosis-preflight-self-confound-gate.md`) as "merged to master, **unexecuted**". Reality: it is **executed** on master (PR #608, commit `7bdb448`); the `## Diagnosis pre-flight (self-confound gate)` section is live in `skills/red-team/SKILL.md` (between `## Backstop-legitimacy check` and `## Invariants`), and the `confirmStage` sentence is present in `workflow-scaffold.js`.
  - **Impact:** none on execution. Task 2 edits step 4 in `## Steps` and `red-team-gate.mjs` — both disjoint from the `## Diagnosis pre-flight` section; `red-team-gate.mjs` carries no diagnosis-preflight content. Task disjointness (T1 `{campaign-ledger.mjs,.test.mjs}` vs T2 `{red-team-gate.mjs,.test.mjs,SKILL.md}`) holds; no same-file same-region collision; no ordering edge. Purely a stale factual label.
  - **Resolution:** patched the plan Notes in place — "merged **and executed** on master, PR #608"; "this plan executes second and rebases trivially"; "the **already-executed** diagnosis-preflight campaign". Adjacency conclusion unchanged.

## Residual risk

None beyond the plan's own declared backstops (both verified legitimate, well-scoped, runner+timing named):
1. Live roadmap seed — next `/war-campaign` seeding from a committed roadmap (unit fixtures mirror the row shape; binding to a specific committed doc would rot).
2. Live persisted-envelope gate — next `/red-team` piping a real persisted task-output file (in-repo fixtures are synthesized against the issue-#587 shape; no persisted file exists in-repo to fixture from).

Version literal (`0.14.10`) is non-authoritative per the plan; resolves to the next free patch (**0.14.14**; slots at 0.14.13) at the release phase.
